package com.backend.feni.service;

import com.backend.feni.entity.Booking;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.Product;
import com.backend.feni.repository.BookingRepository;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.JournalLineRepository;
import com.backend.feni.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final PdfGenerationService pdfService;
    private final BookingRepository bookingRepo;
    private final JournalEntryRepository journalRepo;
    private final JournalLineRepository journalLineRepo;
    private final ProductRepository productRepo;

    public String generateReport(String type, LocalDate date) {
        String title;
        StringBuilder content = new StringBuilder();

        Instant startOfDay = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        switch (type.toLowerCase()) {
            case "occupancy":
                title = "Occupancy Report - " + date;
                List<Booking> bookings = bookingRepo.findByCreatedAtBetween(startOfDay, endOfDay);
                content.append("Total Bookings: ").append(bookings.size()).append("\n");
                for (Booking b : bookings) {
                    content.append(b.getGuest().getFirstName()).append(" ").append(b.getGuest().getLastName())
                            .append(" - Room: ").append(b.getRoomNumber())
                            .append(" (").append(b.getCheckInDate()).append(" to ").append(b.getCheckOutDate())
                            .append(")\n");
                }
                break;

            case "shift-summary":
                title = "D.S.S / S.I.D REPORT - " + date;
                String[] dssHeaders = { "S/N", "GUEST NAME", "PHONE", "OCCUPATION", "ADDRESS", "NATIONALITY", "ARRIVAL",
                        "DEPARTURE", "ROOM NO", "PURPOSE", "STATE", "LGA", "NOK PHONE" };
                List<String[]> dssRows = new ArrayList<>();
                List<Booking> dssBookings = bookingRepo.findByCreatedAtBetween(startOfDay, endOfDay);
                int sn = 1;
                for (Booking b : dssBookings) {
                    com.backend.feni.entity.Guest g = b.getGuest();
                    dssRows.add(new String[] {
                            String.valueOf(sn++),
                            g.getFirstName() + " " + g.getLastName(),
                            g.getPhone(),
                            g.getOccupation(),
                            g.getAddress(),
                            g.getNationality(),
                            b.getCheckInDate().toString(),
                            b.getCheckOutDate().toString(),
                            b.getRoomNumber(),
                            g.getPurposeOfVisit(),
                            g.getStateOfOrigin(),
                            g.getLga(),
                            g.getNextOfKinPhone()
                    });
                }
                return savePdf(pdfService.generateTablePdf(title, dssHeaders, dssRows));

            case "sales":
                title = "DAILY SALES BOOK (ACCOMMODATION) - " + date;
                String[] salesHeaders = { "S/N", "ROOM NO", "RM CATEGORY", "AMOUNT", "CASH", "TRANSFER", "POS",
                        "REMARK" };
                List<String[]> salesRows = new ArrayList<>();
                List<Booking> salesBookings = bookingRepo.findByCreatedAtBetween(startOfDay, endOfDay);
                int ssn = 1;
                BigDecimal totalAmount = BigDecimal.ZERO;
                BigDecimal totalCash = BigDecimal.ZERO;
                BigDecimal totalTransfer = BigDecimal.ZERO;
                BigDecimal totalPos = BigDecimal.ZERO;

                for (Booking b : salesBookings) {
                    BigDecimal cost = b.getTotalCost();
                    totalAmount = totalAmount.add(cost);

                    String cash = "", transfer = "", pos = "";
                    if (b.getPaymentMethod() == com.backend.feni.entity.enums.PaymentMethod.CASH) {
                        cash = cost.toString();
                        totalCash = totalCash.add(cost);
                    }
                    if (b.getPaymentMethod() == com.backend.feni.entity.enums.PaymentMethod.TRANSFER) {
                        transfer = cost.toString();
                        totalTransfer = totalTransfer.add(cost);
                    }
                    if (b.getPaymentMethod() == com.backend.feni.entity.enums.PaymentMethod.POS) {
                        pos = cost.toString();
                        totalPos = totalPos.add(cost);
                    }

                    salesRows.add(new String[] {
                            String.valueOf(ssn++),
                            b.getRoomNumber(),
                            b.getRoomType(),
                            cost.toString(),
                            cash,
                            transfer,
                            pos,
                            ""
                    });
                }
                salesRows.add(new String[] { "", "TOTAL", "", totalAmount.toString(), totalCash.toString(),
                        totalTransfer.toString(), totalPos.toString(), "" });

                return savePdf(pdfService.generateTablePdf(title, salesHeaders, salesRows));

            case "admin-revenue":
                title = "Daily Revenue Breakdown - " + date;
                List<com.backend.feni.entity.JournalLine> revLines = journalLineRepo.findByAccountNameStartingWithAndDateBetween("Sales Revenue -", startOfDay, endOfDay);
                
                BigDecimal roomsRev = BigDecimal.ZERO;
                BigDecimal barRev = BigDecimal.ZERO;
                BigDecimal kitchenRev = BigDecimal.ZERO;
                BigDecimal otherRev = BigDecimal.ZERO;

                for (com.backend.feni.entity.JournalLine jl : revLines) {
                    if (jl.getAccountName().contains("ROOMS")) roomsRev = roomsRev.add(jl.getCreditAmount());
                    else if (jl.getAccountName().contains("BAR")) barRev = barRev.add(jl.getCreditAmount());
                    else if (jl.getAccountName().contains("KITCHEN")) kitchenRev = kitchenRev.add(jl.getCreditAmount());
                    else otherRev = otherRev.add(jl.getCreditAmount());
                }

                content.append("Rooms Revenue: $").append(roomsRev).append("\n");
                content.append("Bar Revenue: $").append(barRev).append("\n");
                content.append("Kitchen Revenue: $").append(kitchenRev).append("\n");
                content.append("Other Revenue: $").append(otherRev).append("\n");
                content.append("----------------------------\n");
                content.append("Total Revenue: $").append(roomsRev.add(barRev).add(kitchenRev).add(otherRev)).append("\n");
                break;

            case "inventory":
                title = "Inventory Low-Stock Report";
                List<Product> products = productRepo.findAll();
                content.append("Low Stock Items:\n");
                for (Product p : products) {
                    if (p.getStockQty() != null && p.getLowStockThreshold() != null
                            && p.getStockQty() <= p.getLowStockThreshold()) {
                        content.append(p.getName()).append(" (SKU: ").append(p.getInternalSku())
                                .append(") - Current Stock: ").append(p.getStockQty()).append("\n");
                    }
                }
                break;

            case "staff-activity":
                title = "Staff Activity Report";
                content.append("Staff Activity Report\n(Staff actions would appear here.)\n");
                break;

            default:
                throw new IllegalArgumentException("Unknown report type: " + type);
        }

        byte[] pdfBytes = pdfService.generateSimpleTextPdf(title, content.toString());
        return savePdf(pdfBytes);
    }

    private String savePdf(byte[] pdfBytes) {
        String filename = UUID.randomUUID().toString() + ".pdf";

        try {
            File tempFile = new File(System.getProperty("java.io.tmpdir"), filename);
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(pdfBytes);
            }
        } catch (Exception e) {
            throw new RuntimeException("Could not save temporary report file", e);
        }

        // Return the URL to download it locally
        return "/api/reports/download/" + filename;
    }
}
