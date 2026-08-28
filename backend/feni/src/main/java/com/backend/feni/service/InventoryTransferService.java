package com.backend.feni.service;

import com.backend.feni.dto.request.InventoryTransferItemRequest;
import com.backend.feni.dto.request.InventoryTransferRequest;
import com.backend.feni.entity.InventoryLocation;
import com.backend.feni.entity.InventoryStock;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.JournalLine;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.Product;
import com.backend.feni.entity.StaffUser;
import com.backend.feni.entity.enums.EntryType;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.exception.UnbalancedJournalException;
import com.backend.feni.repository.InventoryLocationRepository;
import com.backend.feni.repository.InventoryStockRepository;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.repository.ProductRepository;
import com.backend.feni.repository.StaffUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryTransferService {

    private final ProductRepository productRepo;
    private final InventoryLocationRepository locationRepo;
    private final InventoryStockRepository stockRepo;
    private final JournalEntryRepository journalRepo;
    private final OutboxEventRepository outboxRepo;
    private final StaffUserRepository staffRepo;
    private final ObjectMapper objectMapper;

    @Transactional
    public void transferStock(InventoryTransferRequest request, UUID staffId) {
        if (request.getSourceLocationId().equals(request.getDestinationLocationId())) {
            throw new IllegalArgumentException("Source and destination locations cannot be the same");
        }

        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        InventoryLocation sourceLocation = locationRepo.findById(request.getSourceLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Source location not found"));

        InventoryLocation destinationLocation = locationRepo.findById(request.getDestinationLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Destination location not found"));

        UUID transferReferenceId = UUID.randomUUID();

        JournalEntry journalEntry = JournalEntry.builder()
                .entryType(EntryType.INVENTORY_TRANSFER)
                .referenceId(transferReferenceId)
                .processedBy(staffUser)
                .build();

        BigDecimal totalTransferValue = BigDecimal.ZERO;
        List<Product> updatedProducts = new ArrayList<>();

        for (InventoryTransferItemRequest itemReq : request.getItems()) {
            Product product = productRepo.findByInternalSku(itemReq.getInternalSku())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + itemReq.getInternalSku()));

            if (product.getType() != ProductType.RAW_GOOD) {
                throw new IllegalArgumentException("Cannot transfer non-raw goods: " + product.getName());
            }

            InventoryStock sourceStock = stockRepo.findByProductAndLocation(product, sourceLocation)
                    .orElseThrow(() -> new IllegalStateException("Product " + product.getName() + " not found in source location"));

            if (sourceStock.getQuantity() < itemReq.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for product " + product.getName() + " in source location");
            }

            InventoryStock destStock = stockRepo.findByProductAndLocation(product, destinationLocation)
                    .orElse(InventoryStock.builder().product(product).location(destinationLocation).quantity(0).build());

            sourceStock.setQuantity(sourceStock.getQuantity() - itemReq.getQuantity());
            destStock.setQuantity(destStock.getQuantity() + itemReq.getQuantity());

            stockRepo.save(sourceStock);
            stockRepo.save(destStock);

            BigDecimal lineValue = product.getUnitCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalTransferValue = totalTransferValue.add(lineValue);

            updatedProducts.add(product);
        }

        // 2 lines of accounting: transferring from one inventory asset account to another
        // To reflect internal movement, we can use "Inventory Asset - Source" and "Inventory Asset - Destination"
        String sourceAccount = "Inventory Asset - " + sourceLocation.getName();
        String destAccount = "Inventory Asset - " + destinationLocation.getName();

        journalEntry.addLine(JournalLine.builder().accountName(destAccount).debitAmount(totalTransferValue).creditAmount(BigDecimal.ZERO).build());
        journalEntry.addLine(JournalLine.builder().accountName(sourceAccount).debitAmount(BigDecimal.ZERO).creditAmount(totalTransferValue).build());

        BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException("Journal entry is unbalanced. Debits: " + totalDebit + ", Credits: " + totalCredit);
        }

        journalRepo.save(journalEntry);

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            payloadMap.put("referenceId", transferReferenceId);
            payloadMap.put("totalValue", totalTransferValue);
            payloadMap.put("journalEntry", journalEntry);
            payloadMap.put("updatedProducts", updatedProducts);
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("INVENTORY_TRANSFERRED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }
}
