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
import com.backend.feni.entity.TaxBracket;
import com.backend.feni.exception.UnbalancedJournalException;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.repository.ProductRepository;
import com.backend.feni.repository.StaffUserRepository;
import com.backend.feni.repository.SmartPosTerminalRepository;
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
public class PosSaleService {

    private final ProductRepository productRepo;
    private final JournalEntryRepository journalRepo;
    private final OutboxEventRepository outboxRepo;
    private final ThermalPrinterService printerService;
    private final StaffUserRepository staffRepo;
    private final com.backend.feni.service.email.EmailSender emailSender;
    private final ObjectMapper objectMapper;
    private final com.backend.feni.repository.FacilityRepository facilityRepo;
    private final SmartPosTerminalRepository smartPosRepo;
    private final com.backend.feni.repository.InventoryLocationRepository locationRepo;
    private final com.backend.feni.repository.InventoryStockRepository stockRepo;

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
        BigDecimal totalTaxes = BigDecimal.ZERO;
        List<Product> updatedProducts = new ArrayList<>();
        java.util.Map<String, BigDecimal> revenueByCenter = new java.util.HashMap<>();
        java.util.Map<String, BigDecimal> taxesByAccount = new java.util.HashMap<>();

        for (PosSaleItemRequest itemReq : request.getItems()) {
            Product product = productRepo.findByInternalSku(itemReq.getSkuOrBarcode())
                    .orElseGet(() -> productRepo.findByManufacturerBarcode(itemReq.getSkuOrBarcode())
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Product not found: " + itemReq.getSkuOrBarcode())));

            if (product.getType() == ProductType.RAW_GOOD) {
                com.backend.feni.entity.InventoryLocation location = locationRepo.findById(request.getLocationId())
                        .orElseThrow(() -> new IllegalArgumentException("Location not found"));
                com.backend.feni.entity.InventoryStock stock = stockRepo.findByProductAndLocation(product, location)
                        .orElseThrow(() -> new IllegalStateException("Insufficient stock for product: " + product.getName() + " at this location"));

                if (stock.getQuantity() < itemReq.getQuantity()) {
                    throw new IllegalStateException("Insufficient stock for product: " + product.getName() + " at this location");
                }
                stock.setQuantity(stock.getQuantity() - itemReq.getQuantity());
                stockRepo.save(stock);

                // Low stock check across all locations
                int totalStock = product.getInventoryStocks().stream()
                        .mapToInt(s -> s.getId().equals(stock.getId()) ? stock.getQuantity() : s.getQuantity())
                        .sum();

                if (product.getLowStockThreshold() != null && totalStock <= product.getLowStockThreshold()) {
                    String adminEmail = facilityRepo.findAll().stream().findFirst()
                            .map(com.backend.feni.entity.Facility::getAdminEmail)
                            .orElse("admin@feni.local");
                            
                    if (adminEmail != null) {
                        String subject = "Low Stock Alert: " + product.getName();
                        String htmlBody = String.format(
                                "<p>The total stock for <b>%s</b> (SKU: %s) has dropped to <b>%d</b>, which is at or below the threshold of %d.</p>",
                                product.getName(), product.getInternalSku(), totalStock,
                                product.getLowStockThreshold());
                        emailSender.send(adminEmail, subject, htmlBody);
                    }
                }
            }

            BigDecimal itemQty = BigDecimal.valueOf(itemReq.getQuantity());
            BigDecimal lineRevenue = product.getPrice().multiply(itemQty);
            BigDecimal lineCogs = product.getUnitCost().multiply(itemQty);

            totalRevenue = totalRevenue.add(lineRevenue);
            totalCogs = totalCogs.add(lineCogs);

            String accountName = "Sales Revenue - " + product.getRevenueCenter().name();
            revenueByCenter.put(accountName, revenueByCenter.getOrDefault(accountName, BigDecimal.ZERO).add(lineRevenue));

            if (product.getTaxBrackets() != null) {
                for (TaxBracket tax : product.getTaxBrackets()) {
                    if (tax.getIsActive() != null && tax.getIsActive()) {
                        BigDecimal taxAmount = lineRevenue.multiply(tax.getRate()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                        totalTaxes = totalTaxes.add(taxAmount);
                        
                        String liabilityAccount = tax.getLiabilityAccountName();
                        taxesByAccount.put(liabilityAccount, taxesByAccount.getOrDefault(liabilityAccount, BigDecimal.ZERO).add(taxAmount));
                    }
                }
            }

            productRepo.save(product);
            updatedProducts.add(product);
        }

        BigDecimal grandTotal = totalRevenue.add(totalTaxes);
        
        BigDecimal tenderedTotal = BigDecimal.ZERO;
        
        for (PosSaleRequest.SplitTenderRequest tender : request.getSplitTenders()) {
            tenderedTotal = tenderedTotal.add(tender.getAmount());
            
            String debitAccount = switch (tender.getPaymentMethod()) {
                case CASH -> "Cash";
                case POS -> {
                    if (tender.getSmartPosTerminalId() != null) {
                        yield smartPosRepo.findById(tender.getSmartPosTerminalId())
                            .map(t -> "Card Payments - " + t.getName())
                            .orElse("Card Payments");
                    }
                    yield "Card Payments";
                }
                case TRANSFER -> {
                    if (tender.getSmartPosTerminalId() != null) {
                        yield smartPosRepo.findById(tender.getSmartPosTerminalId())
                            .map(t -> "Bank Transfers - " + t.getName())
                            .orElse("Bank Transfers");
                    }
                    yield "Bank Transfers";
                }
            };
            
            journalEntry.addLine(JournalLine.builder()
                .accountName(debitAccount)
                .debitAmount(tender.getAmount())
                .creditAmount(BigDecimal.ZERO).build());
        }

        if (tenderedTotal.compareTo(grandTotal) != 0) {
            throw new IllegalArgumentException("Sum of split tenders (" + tenderedTotal + ") does not match grand total (" + grandTotal + ")");
        }

        for (java.util.Map.Entry<String, BigDecimal> entry : revenueByCenter.entrySet()) {
            journalEntry.addLine(JournalLine.builder().accountName(entry.getKey()).debitAmount(BigDecimal.ZERO)
                    .creditAmount(entry.getValue()).build());
        }

        for (java.util.Map.Entry<String, BigDecimal> entry : taxesByAccount.entrySet()) {
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

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            payloadMap.put("referenceId", saleReferenceId);
            payloadMap.put("totalRevenue", totalRevenue);
            payloadMap.put("journalEntry", journalEntry);
            payloadMap.put("updatedProducts", updatedProducts);
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("SALE_COMPLETED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }

        // Print receipt async
        if (request.getPrinterIp() != null && !request.getPrinterIp().isEmpty()) {
            String receipt = buildReceiptContent(request, "POS RECEIPT");
            printerService.printReceiptAsync(receipt, request.getPrinterIp());
        }
    }

    public void printPreReceipt(PosSaleRequest request) {
        if (request.getPrinterIp() == null || request.getPrinterIp().isEmpty()) {
            throw new IllegalArgumentException("Printer IP is required to print a pre-receipt");
        }
        String receipt = buildReceiptContent(request, "PROFORMA INVOICE");
        printerService.printReceiptAsync(receipt, request.getPrinterIp());
    }

    private String buildReceiptContent(PosSaleRequest request, String headerTitle) {
        StringBuilder receiptBuilder = new StringBuilder();
        receiptBuilder.append("============================\n");
        receiptBuilder.append("         FENI HOTEL         \n");
        receiptBuilder.append(" No. 1, Keana Link Road, Jos\n");
        receiptBuilder.append("    Tel: +234 123 456 7890  \n");
        receiptBuilder.append("============================\n");
        // Center the title roughly
        int padding = Math.max(0, (28 - headerTitle.length()) / 2);
        receiptBuilder.append(" ".repeat(padding)).append(headerTitle).append("\n");
        receiptBuilder.append("============================\n\n");

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalTaxes = BigDecimal.ZERO;

        for (PosSaleItemRequest itemReq : request.getItems()) {
            Product product = productRepo.findByInternalSku(itemReq.getSkuOrBarcode())
                    .orElseGet(() -> productRepo.findByManufacturerBarcode(itemReq.getSkuOrBarcode())
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Product not found: " + itemReq.getSkuOrBarcode())));

            BigDecimal lineRevenue = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalRevenue = totalRevenue.add(lineRevenue);
            
            if (product.getTaxBrackets() != null) {
                for (TaxBracket tax : product.getTaxBrackets()) {
                    if (tax.getIsActive() != null && tax.getIsActive()) {
                        BigDecimal taxAmount = lineRevenue.multiply(tax.getRate()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                        totalTaxes = totalTaxes.add(taxAmount);
                    }
                }
            }

            receiptBuilder.append(
                    String.format("%s x%d  ₦%s\n", product.getName(), itemReq.getQuantity(), lineRevenue.toString()));
        }

        receiptBuilder.append(String.format("SUBTOTAL: ₦%s\n", totalRevenue.toString()));
        if (totalTaxes.compareTo(BigDecimal.ZERO) > 0) {
            receiptBuilder.append(String.format("TAXES: ₦%s\n", totalTaxes.toString()));
        }
        BigDecimal grandTotal = totalRevenue.add(totalTaxes);
        receiptBuilder.append(String.format("TOTAL: ₦%s\n", grandTotal.toString()));
        receiptBuilder.append("----------------------------\n");
        if (request.getSplitTenders() != null) {
            for (PosSaleRequest.SplitTenderRequest tender : request.getSplitTenders()) {
                receiptBuilder.append(String.format("PAID (%s): ₦%s\n", tender.getPaymentMethod().name(), tender.getAmount().toString()));
            }
        }
        receiptBuilder.append("============================\n");
        return receiptBuilder.toString();
    }
}
