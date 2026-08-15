package com.backend.feni.controller;

import com.backend.feni.dto.request.ProductRequest;
import com.backend.feni.dto.response.ProductResponse;
import com.backend.feni.entity.Product;
import com.backend.feni.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .type(request.getType())
                .revenueCenter(request.getRevenueCenter())
                .manufacturerBarcode(request.getManufacturerBarcode())
                .internalSku(request.getInternalSku())
                .stockQty(request.getStockQty())
                .lowStockThreshold(request.getLowStockThreshold())
                .price(request.getPrice())
                .unitCost(request.getUnitCost())
                .build();
        return mapToResponse(productRepository.save(product));
    }

    @PutMapping("/{id}")
    public ProductResponse updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        product.setName(request.getName());
        product.setType(request.getType());
        product.setRevenueCenter(request.getRevenueCenter());
        product.setManufacturerBarcode(request.getManufacturerBarcode());
        product.setInternalSku(request.getInternalSku());
        product.setStockQty(request.getStockQty());
        product.setLowStockThreshold(request.getLowStockThreshold());
        product.setPrice(request.getPrice());
        product.setUnitCost(request.getUnitCost());

        return mapToResponse(productRepository.save(product));
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .type(product.getType())
                .revenueCenter(product.getRevenueCenter())
                .manufacturerBarcode(product.getManufacturerBarcode())
                .internalSku(product.getInternalSku())
                .stockQty(product.getStockQty())
                .lowStockThreshold(product.getLowStockThreshold())
                .price(product.getPrice())
                .unitCost(product.getUnitCost())
                .build();
    }
}
