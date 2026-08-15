package com.backend.feni.service;

import com.backend.feni.dto.request.PosSaleItemRequest;
import com.backend.feni.dto.request.PosSaleRequest;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class PosSaleService {

    private final ProductRepository productRepo;
    private final JournalEntryRepository journalRepo;
    private final OutboxEventRepository outboxRepo;
    private final ThermalPrinterService printerService;
    private final StaffUserRepository staffRepo;
    private final com.backend.feni.service.email.EmailSender emailSender;

    @org.springframework.beans.factory.annotation.Value("${email.admin-address:admin@feni.local}")
    private String adminEmail;

    @Transactional
    public void completeSale(PosSaleRequest request, UUID staffId) {
        UUID saleReferenceId = UUID.randomUUID();

        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        JournalEntry journalEntry = JournalEntry.builder()
                .entryType(EntryType.SALE)
                .referenceId(saleReferenceId)
                .processedBy(staffUser)
                .build();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCogs = BigDecimal.ZERO;

        StringBuilder receiptBuilder = new StringBuilder();
        receiptBuilder.append("============================\n");
        receiptBuilder.append("         FENI HOTEL         \n");
        receiptBuilder.append(" No. 1, Keana Link Road, Jos\n");
        receiptBuilder.append("    Tel: +234 123 456 7890  \n");
        receiptBuilder.append("============================\n");
        receiptBuilder.append("        POS RECEIPT         \n");
        receiptBuilder.append("============================\n\n");

        for (PosSaleItemRequest itemReq : request.getItems()) {
            Product product = productRepo.findByInternalSku(itemReq.getSkuOrBarcode())
                    .orElseGet(() -> productRepo.findByManufacturerBarcode(itemReq.getSkuOrBarcode())
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Product not found: " + itemReq.getSkuOrBarcode())));

            if (product.getType() == ProductType.RAW_GOOD) {
                if (product.getStockQty() == null || product.getStockQty() < itemReq.getQuantity()) {
                    throw new IllegalStateException("Insufficient stock for product: " + product.getName());
                }
                product.setStockQty(product.getStockQty() - itemReq.getQuantity());

                // Low stock check
                if (product.getLowStockThreshold() != null && product.getStockQty() <= product.getLowStockThreshold()) {
                    String subject = "Low Stock Alert: " + product.getName();
                    String htmlBody = String.format(
                            "<p>The stock for <b>%s</b> (SKU: %s) has dropped to <b>%d</b>, which is at or below the threshold of %d.</p>",
                            product.getName(), product.getInternalSku(), product.getStockQty(),
                            product.getLowStockThreshold());
                    emailSender.send(adminEmail, subject, htmlBody);
                }
            }

            BigDecimal lineRevenue = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal lineCogs = product.getUnitCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            totalRevenue = totalRevenue.add(lineRevenue);
            totalCogs = totalCogs.add(lineCogs);

            receiptBuilder.append(
                    String.format("%s x%d  $%s\n", product.getName(), itemReq.getQuantity(), lineRevenue.toString()));

            productRepo.save(product);
        }

        receiptBuilder.append(String.format("TOTAL: $%s\n", totalRevenue.toString()));
        receiptBuilder.append("============================\n");

        String debitAccount = switch (request.getPaymentMethod()) {
            case CASH -> "Cash";
            case POS -> "Card Payments";
            case TRANSFER -> "Bank Transfers";
        };

        // 4 lines of accounting (basic structure, we need to handle per-product revenue
        // centers if they differ, but we can simplify by grouping revenue by center)
        journalEntry.addLine(JournalLine.builder().accountName(debitAccount).debitAmount(totalRevenue)
                .creditAmount(BigDecimal.ZERO).build());

        // Group revenue by center
        java.util.Map<String, BigDecimal> revenueByCenter = new java.util.HashMap<>();
        for (PosSaleItemRequest itemReq : request.getItems()) {
            Product p = productRepo.findByInternalSku(itemReq.getSkuOrBarcode())
                    .orElseGet(() -> productRepo.findByManufacturerBarcode(itemReq.getSkuOrBarcode()).orElseThrow());
            String accountName = "Sales Revenue - " + p.getRevenueCenter().name();
            BigDecimal lineRev = p.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            revenueByCenter.put(accountName, revenueByCenter.getOrDefault(accountName, BigDecimal.ZERO).add(lineRev));
        }

        for (java.util.Map.Entry<String, BigDecimal> entry : revenueByCenter.entrySet()) {
            journalEntry.addLine(JournalLine.builder().accountName(entry.getKey()).debitAmount(BigDecimal.ZERO)
                    .creditAmount(entry.getValue()).build());
        }
        journalEntry.addLine(JournalLine.builder().accountName("Cost of Goods Sold").debitAmount(totalCogs)
                .creditAmount(BigDecimal.ZERO).build());
        journalEntry.addLine(JournalLine.builder().accountName("Inventory Asset").debitAmount(BigDecimal.ZERO)
                .creditAmount(totalCogs).build());

        // Validate journal balance
        BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException(
                    "Journal entry is unbalanced. Debits: " + totalDebit + ", Credits: " + totalCredit);
        }

        journalRepo.save(journalEntry);

        // Transactional Outbox
        OutboxEvent event = OutboxEvent.builder()
                .eventType("SALE_COMPLETED")
                .payload("{\"referenceId\":\"" + saleReferenceId + "\", \"totalRevenue\":" + totalRevenue + "}") // Keep
                                                                                                                 // simple
                                                                                                                 // for
                                                                                                                 // now
                .status(OutboxStatus.PENDING)
                .build();
        outboxRepo.save(event);

        // Print receipt async
        if (request.getPrinterIp() != null && !request.getPrinterIp().isEmpty()) {
            printerService.printReceiptAsync(receiptBuilder.toString(), request.getPrinterIp());
        }
    }
}
