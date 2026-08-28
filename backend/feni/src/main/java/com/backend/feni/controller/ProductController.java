package com.backend.feni.controller;

import com.backend.feni.dto.request.ProductRequest;
import com.backend.feni.dto.response.ProductResponse;
import com.backend.feni.dto.response.TaxBracketResponse;
import com.backend.feni.entity.Product;
import com.backend.feni.entity.TaxBracket;
import com.backend.feni.repository.ProductRepository;
import com.backend.feni.repository.TaxBracketRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final TaxBracketRepository taxBracketRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .type(request.getType())
                .revenueCenter(request.getRevenueCenter())
                .manufacturerBarcode(request.getManufacturerBarcode())
                .internalSku(request.getInternalSku())
                .lowStockThreshold(request.getLowStockThreshold())
                .price(request.getPrice())
                .unitCost(request.getUnitCost())
                .baseUnit(request.getBaseUnit())
                .bulkUnit(request.getBulkUnit())
                .conversionRatio(request.getConversionRatio() != null ? request.getConversionRatio() : 1)
                .build();
                
        if (request.getTaxBracketIds() != null && !request.getTaxBracketIds().isEmpty()) {
            List<TaxBracket> taxBrackets = taxBracketRepository.findAllById(request.getTaxBracketIds());
            product.setTaxBrackets(new java.util.HashSet<>(taxBrackets));
        }
        
        Product saved = productRepository.save(product);
        createProductOutboxEvent(saved);
        return mapToResponse(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    public ProductResponse updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        product.setName(request.getName());
        product.setType(request.getType());
        product.setRevenueCenter(request.getRevenueCenter());
        product.setManufacturerBarcode(request.getManufacturerBarcode());
        product.setInternalSku(request.getInternalSku());
        product.setLowStockThreshold(request.getLowStockThreshold());
        product.setPrice(request.getPrice());
        product.setUnitCost(request.getUnitCost());
        product.setBaseUnit(request.getBaseUnit());
        product.setBulkUnit(request.getBulkUnit());
        product.setConversionRatio(request.getConversionRatio() != null ? request.getConversionRatio() : 1);

        if (request.getTaxBracketIds() != null && !request.getTaxBracketIds().isEmpty()) {
            List<TaxBracket> taxBrackets = taxBracketRepository.findAllById(request.getTaxBracketIds());
            product.setTaxBrackets(new java.util.HashSet<>(taxBrackets));
        } else {
            product.getTaxBrackets().clear();
        }

        Product saved = productRepository.save(product);
        createProductOutboxEvent(saved);
        return mapToResponse(saved);
    }

    private void createProductOutboxEvent(Product product) {
        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            payloadMap.put("product", product);
            String payload = objectMapper.writeValueAsString(payloadMap);
            
            OutboxEvent event = OutboxEvent.builder()
                    .eventType("PRODUCT_UPSERTED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxEventRepository.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize product for outbox event", e);
        }
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .type(product.getType())
                .revenueCenter(product.getRevenueCenter())
                .manufacturerBarcode(product.getManufacturerBarcode())
                .internalSku(product.getInternalSku())
                .stockQty(product.getInventoryStocks() != null ? product.getInventoryStocks().stream().mapToInt(com.backend.feni.entity.InventoryStock::getQuantity).sum() : 0)
                .inventoryStocks(product.getInventoryStocks() != null ? product.getInventoryStocks().stream().map(s -> com.backend.feni.dto.response.InventoryStockResponse.builder().id(s.getId()).locationId(s.getLocation().getId()).locationName(s.getLocation().getName()).quantity(s.getQuantity()).build()).collect(Collectors.toList()) : null)
                .imageUrl(product.getImageUrl())
                .lowStockThreshold(product.getLowStockThreshold())
                .price(product.getPrice())
                .unitCost(product.getUnitCost())
                .baseUnit(product.getBaseUnit())
                .bulkUnit(product.getBulkUnit())
                .conversionRatio(product.getConversionRatio())
                .taxBrackets(product.getTaxBrackets() != null ? 
                    product.getTaxBrackets().stream().map(this::mapTaxBracketToResponse).collect(Collectors.toList()) : null)
                .build();
    }
    
    private TaxBracketResponse mapTaxBracketToResponse(TaxBracket taxBracket) {
        return TaxBracketResponse.builder()
                .id(taxBracket.getId())
                .name(taxBracket.getName())
                .rate(taxBracket.getRate())
                .liabilityAccountName(taxBracket.getLiabilityAccountName())
                .isActive(taxBracket.getIsActive())
                .build();
    }
}
