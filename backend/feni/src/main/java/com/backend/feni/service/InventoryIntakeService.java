package com.backend.feni.service;

import com.backend.feni.dto.request.InventoryIntakeItemRequest;
import com.backend.feni.dto.request.InventoryIntakeRequest;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.JournalLine;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.Product;
import com.backend.feni.entity.enums.EntryType;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.exception.UnbalancedJournalException;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.repository.ProductRepository;
import com.backend.feni.repository.StaffUserRepository;
import com.backend.feni.entity.StaffUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryIntakeService {

    private final ProductRepository productRepo;
    private final JournalEntryRepository journalRepo;
    private final OutboxEventRepository outboxRepo;
    private final ThermalPrinterService printerService;
    private final StaffUserRepository staffRepo;
    private final com.backend.feni.repository.InventoryLocationRepository locationRepo;
    private final com.backend.feni.repository.InventoryStockRepository stockRepo;
    private final ObjectMapper objectMapper;

    @Transactional
    public void receiveShipment(InventoryIntakeRequest request, UUID staffId) {
        UUID intakeReferenceId = UUID.randomUUID();

        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        JournalEntry journalEntry = JournalEntry.builder()
                .entryType(EntryType.INVENTORY_INTAKE)
                .referenceId(intakeReferenceId)
                .processedBy(staffUser)
                .build();

        BigDecimal totalInventoryValue = BigDecimal.ZERO;
        List<Product> updatedProducts = new ArrayList<>();

        for (InventoryIntakeItemRequest itemReq : request.getItems()) {
            Product product = productRepo.findByInternalSku(itemReq.getInternalSku())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + itemReq.getInternalSku()));

            if (product.getType() != ProductType.RAW_GOOD) {
                throw new IllegalArgumentException("Cannot intake inventory for non-raw goods: " + product.getName());
            }

            int effectiveQuantity = itemReq.getQuantity();
            if (itemReq.isBulkIntake()) {
                effectiveQuantity = itemReq.getQuantity() * (product.getConversionRatio() != null ? product.getConversionRatio() : 1);
            }

            com.backend.feni.entity.InventoryLocation location = locationRepo.findById(request.getLocationId())
                    .orElseThrow(() -> new IllegalArgumentException("Location not found"));

            com.backend.feni.entity.InventoryStock stock = stockRepo.findByProductAndLocation(product, location)
                    .orElse(com.backend.feni.entity.InventoryStock.builder().product(product).location(location).quantity(0).build());

            stock.setQuantity(stock.getQuantity() + effectiveQuantity);
            stockRepo.save(stock);

            BigDecimal lineValue;
            if (itemReq.getTotalCost() != null) {
                lineValue = itemReq.getTotalCost();
                if (effectiveQuantity > 0) {
                    BigDecimal newUnitCost = itemReq.getTotalCost().divide(BigDecimal.valueOf(effectiveQuantity), 2, java.math.RoundingMode.HALF_UP);
                    product.setUnitCost(newUnitCost);
                }
            } else {
                lineValue = product.getUnitCost().multiply(BigDecimal.valueOf(effectiveQuantity));
            }

            totalInventoryValue = totalInventoryValue.add(lineValue);

            productRepo.save(product);
            updatedProducts.add(product);

            if (request.getPrinterIp() != null && !request.getPrinterIp().isEmpty()) {
                if (!product.hasManufacturerBarcode()) {
                    printerService.printInventoryLabelsAsync(product, effectiveQuantity, request.getPrinterIp());
                }
            }
        }

        // 2 lines of accounting
        journalEntry.addLine(JournalLine.builder().accountName("Inventory Asset").debitAmount(totalInventoryValue).creditAmount(BigDecimal.ZERO).build());
        journalEntry.addLine(JournalLine.builder().accountName("Accounts Payable").debitAmount(BigDecimal.ZERO).creditAmount(totalInventoryValue).build());

        // Validate journal balance
        BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException("Journal entry is unbalanced. Debits: " + totalDebit + ", Credits: " + totalCredit);
        }

        journalRepo.save(journalEntry);

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            payloadMap.put("referenceId", intakeReferenceId);
            payloadMap.put("totalValue", totalInventoryValue);
            payloadMap.put("journalEntry", journalEntry);
            payloadMap.put("updatedProducts", updatedProducts);
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("INVENTORY_RECEIVED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }
}
