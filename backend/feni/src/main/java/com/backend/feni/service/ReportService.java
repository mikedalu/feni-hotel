package com.backend.feni.service;

import com.backend.feni.dto.request.PosSaleItemRequest;
import com.backend.feni.dto.request.PosSaleRequest;
import com.backend.feni.entity.Booking;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.Product;
import com.backend.feni.repository.BookingRepository;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.JournalLineRepository;
import com.backend.feni.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import com.backend.feni.dto.response.ShiftSummaryDataResponse;
import com.backend.feni.dto.response.DashboardStatsResponse;
import com.backend.feni.entity.enums.BookingStatus;
import com.backend.feni.repository.RoomRepository;
import java.io.File;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final RoomRepository roomRepo;

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
                String[] dssHeaders = { "S/N", "GUEST NAME", "PHONE NUMBER", "OCCUPATION", "CONTACT ADDRESS",
                        "NATIONALITY", "ARRIVAL",
                        "DEPARTURE", "ROOM NUMBER", "PURPOSE OF VISIT", "STATE OF ORIGIN", "L.G.A",
                        "NEXT OF KIN'S PHONE NUMBE" };
                List<String[]> dssRows = new ArrayList<>();
                List<Booking> dssBookings = bookingRepo.findByCheckInDateLessThanEqualAndCheckOutDateGreaterThan(date, date);
                // Filter out cancelled bookings
                dssBookings = dssBookings.stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList();
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
                String signatureLine = "Managers Signature________________";
                return savePdf(pdfService.generateTablePdf(title, dssHeaders, dssRows, signatureLine));

            case "sales":
                title = "Sales Report - " + date;
                String[] salesHeaders = { "S/N", "TIME", "REVENUE CENTER", "AMOUNT", "PROCESSED BY", "REF ID" };
                List<String[]> salesRows = new ArrayList<>();
                
                List<com.backend.feni.entity.JournalLine> salesLines = journalLineRepo
                        .findByAccountNameStartingWithAndDateBetween("Sales Revenue -", startOfDay, endOfDay);
                
                int ssn = 1;
                BigDecimal totalAmount = BigDecimal.ZERO;

                for (com.backend.feni.entity.JournalLine jl : salesLines) {
                    totalAmount = totalAmount.add(jl.getCreditAmount());
                    String processedBy = jl.getJournalEntry().getProcessedBy() != null ? 
                            jl.getJournalEntry().getProcessedBy().getUsername() : "System";
                    
                    salesRows.add(new String[] {
                            String.valueOf(ssn++),
                            jl.getJournalEntry().getCreatedAt().toString(),
                            jl.getAccountName().replace("Sales Revenue - ", ""),
                            jl.getCreditAmount().toString(),
                            processedBy,
                            jl.getJournalEntry().getReferenceId().toString().substring(0, 8)
                    });
                }
                salesRows.add(new String[] { "", "", "TOTAL", totalAmount.toString(), "", "" });

                return savePdf(pdfService.generateTablePdf(title, salesHeaders, salesRows));

            case "admin-revenue":
                title = "Daily Revenue Breakdown - " + date;
                List<com.backend.feni.entity.JournalLine> revLines = journalLineRepo
                        .findByAccountNameStartingWithAndDateBetween("Sales Revenue -", startOfDay, endOfDay);

                BigDecimal roomsRev = BigDecimal.ZERO;
                BigDecimal barRev = BigDecimal.ZERO;
                BigDecimal kitchenRev = BigDecimal.ZERO;
                BigDecimal otherRev = BigDecimal.ZERO;

                for (com.backend.feni.entity.JournalLine jl : revLines) {
                    if (jl.getAccountName().contains("ROOMS"))
                        roomsRev = roomsRev.add(jl.getCreditAmount());
                    else if (jl.getAccountName().contains("BAR"))
                        barRev = barRev.add(jl.getCreditAmount());
                    else if (jl.getAccountName().contains("KITCHEN"))
                        kitchenRev = kitchenRev.add(jl.getCreditAmount());
                    else
                        otherRev = otherRev.add(jl.getCreditAmount());
                }

                content.append("Rooms Revenue: ₦").append(roomsRev).append("\n");
                content.append("Bar Revenue: ₦").append(barRev).append("\n");
                content.append("Kitchen Revenue: ₦").append(kitchenRev).append("\n");
                content.append("Other Revenue: ₦").append(otherRev).append("\n");
                content.append("----------------------------\n");
                content.append("Total Revenue: ₦").append(roomsRev.add(barRev).add(kitchenRev).add(otherRev))
                        .append("\n");
                break;

            case "inventory":
                title = "Inventory Report - " + date;
                String[] invHeaders = { "S/N", "SKU", "PRODUCT", "STOCK QTY", "UNIT COST", "TOTAL VALUE", "STATUS" };
                List<String[]> invRows = new ArrayList<>();
                List<Product> products = productRepo.findAll();

                int invSn = 1;
                BigDecimal totalInventoryValue = BigDecimal.ZERO;

                for (Product p : products) {
                    if (p.getType() == com.backend.feni.entity.enums.ProductType.RAW_GOOD) {
                        String status = "OK";
                        if (p.getStockQty() != null && p.getLowStockThreshold() != null
                                && p.getStockQty() <= p.getLowStockThreshold()) {
                            status = "LOW STOCK";
                        }

                        BigDecimal qty = p.getStockQty() != null ? BigDecimal.valueOf(p.getStockQty())
                                : BigDecimal.ZERO;
                        BigDecimal totalValue = p.getUnitCost().multiply(qty);
                        totalInventoryValue = totalInventoryValue.add(totalValue);

                        invRows.add(new String[] {
                                String.valueOf(invSn++),
                                p.getInternalSku(),
                                p.getName(),
                                String.valueOf(p.getStockQty()),
                                p.getUnitCost().toString(),
                                totalValue.toString(),
                                status
                        });
                    }
                }

                invRows.add(new String[] { "", "", "TOTAL VALUATION", "", "", totalInventoryValue.toString(), "" });
                return savePdf(pdfService.generateTablePdf(title, invHeaders, invRows));

            case "staff-activity":
                title = "Staff Activity Report - " + date;
                String[] staffHeaders = { "S/N", "STAFF", "ENTRY TYPE", "REF ID", "TIME" };
                List<String[]> staffRows = new ArrayList<>();
                
                List<JournalEntry> entries = journalRepo.findByCreatedAtBetween(startOfDay, endOfDay);
                int staffSn = 1;
                for (JournalEntry entry : entries) {
                    String processedBy = entry.getProcessedBy() != null ? entry.getProcessedBy().getUsername() : "System";
                    staffRows.add(new String[] {
                            String.valueOf(staffSn++),
                            processedBy,
                            entry.getEntryType().name(),
                            entry.getReferenceId().toString().substring(0, 8),
                            entry.getCreatedAt().toString()
                    });
                }
                return savePdf(pdfService.generateTablePdf(title, staffHeaders, staffRows));

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

    public String generatePosInvoice(PosSaleRequest request) {
        String documentTitle = "GUEST RECEIPT";
        String invoiceNumber = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String dateOfIssue = LocalDate.now().toString();
        
        String[] headers = { "S/N", "ITEM", "QTY", "UNIT PRICE", "TOTAL" };
        List<String[]> rows = new ArrayList<>();

        int sn = 1;
        BigDecimal grandTotal = BigDecimal.ZERO;

        for (PosSaleItemRequest itemReq : request.getItems()) {
            Product product = productRepo.findByInternalSku(itemReq.getSkuOrBarcode())
                    .orElseGet(() -> productRepo.findByManufacturerBarcode(itemReq.getSkuOrBarcode())
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Product not found: " + itemReq.getSkuOrBarcode())));

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            grandTotal = grandTotal.add(lineTotal);

            rows.add(new String[] {
                    String.valueOf(sn++),
                    product.getName(),
                    String.valueOf(itemReq.getQuantity()),
                    "₦" + product.getPrice().toString(),
                    "₦" + lineTotal.toString()
            });
        }

        String paymentMethods = request.getSplitTenders() != null && !request.getSplitTenders().isEmpty() ? 
                request.getSplitTenders().stream().map(t -> t.getPaymentMethod().name()).distinct().collect(java.util.stream.Collectors.joining("/")) : "UNKNOWN";

        byte[] pdfBytes = pdfService.generateEnterpriseInvoicePdf(
                documentTitle, invoiceNumber, dateOfIssue, 
                null, headers, rows, 
                "₦" + grandTotal.toString(), "₦" + grandTotal.toString(), paymentMethods);

        return savePdf(pdfBytes);
    }

    public byte[] generateBookingInvoiceBytes(UUID bookingId) {
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        String documentTitle = "GUEST RECEIPT";
        String invoiceNumber = booking.getId().toString().substring(0, 8).toUpperCase();
        String dateOfIssue = LocalDate.now().toString();
        
        String guestDetails = booking.getGuest().getFirstName() + " " + booking.getGuest().getLastName() + "\n" +
                              booking.getGuest().getEmail() + "\n" + booking.getGuest().getPhone();
        
        String[] headers = { "S/N", "DESCRIPTION", "CHECK IN", "CHECK OUT", "AMOUNT" };
        List<String[]> rows = new ArrayList<>();
        
        rows.add(new String[] {
                "1", 
                "Room Stay: " + booking.getRoomType() + " (" + booking.getRoomNumber() + ")",
                booking.getCheckInDate().toString(),
                booking.getCheckOutDate().toString(),
                "₦" + booking.getTotalCost().toString()
        });

        return pdfService.generateEnterpriseInvoicePdf(
                documentTitle, invoiceNumber, dateOfIssue, 
                guestDetails, headers, rows, 
                "₦" + booking.getTotalCost().toString(), 
                "₦" + booking.getTotalCost().toString(), 
                booking.getPaymentMethod().name());
    }

    public String generateBookingInvoice(UUID bookingId) {
        return savePdf(generateBookingInvoiceBytes(bookingId));
    }

    public byte[] generateMonthlyPnlBytes(int year, int month) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.plusMonths(1).minusDays(1);
        Instant start = startOfMonth.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = endOfMonth.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        String title = "Monthly Profit & Loss Statement - " + startOfMonth.getMonth() + " " + year;

        List<com.backend.feni.entity.JournalLine> revLines = journalLineRepo
                .findByAccountNameStartingWithAndDateBetween("Sales Revenue -", start, end);
        List<com.backend.feni.entity.JournalLine> cogsLines = journalLineRepo
                .findByAccountNameStartingWithAndDateBetween("Cost of Goods Sold", start, end);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        for (com.backend.feni.entity.JournalLine jl : revLines) {
            totalRevenue = totalRevenue.add(jl.getCreditAmount());
        }

        BigDecimal totalCogs = BigDecimal.ZERO;
        for (com.backend.feni.entity.JournalLine jl : cogsLines) {
            totalCogs = totalCogs.add(jl.getDebitAmount());
        }

        BigDecimal grossProfit = totalRevenue.subtract(totalCogs);

        StringBuilder content = new StringBuilder();
        content.append("Statement Period: ").append(startOfMonth).append(" to ").append(endOfMonth).append("\n\n");
        content.append("REVENUE\n");
        content.append("Total Sales Revenue: ₦").append(totalRevenue).append("\n\n");
        content.append("Cost of Goods Sold (COGS):\n");
        content.append("Total COGS: ₦").append(totalCogs).append("\n\n");
        content.append("----------------------------\n");
        content.append("GROSS PROFIT: ₦").append(grossProfit).append("\n");
        content.append("========================================\n");

        return pdfService.generateSimpleTextPdf(title, content.toString());
    }

    public String generateProfitAndLossReport(LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        String title = "Profit & Loss Statement\n" + startDate + " to " + endDate;

        List<com.backend.feni.entity.JournalLine> revLines = journalLineRepo
                .findByAccountNameStartingWithAndDateBetween("Sales Revenue", start, end);
        List<com.backend.feni.entity.JournalLine> cogsLines = journalLineRepo
                .findByAccountNameStartingWithAndDateBetween("Cost of Goods Sold", start, end);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        for (com.backend.feni.entity.JournalLine jl : revLines) {
            totalRevenue = totalRevenue.add(jl.getCreditAmount());
        }

        BigDecimal totalCogs = BigDecimal.ZERO;
        for (com.backend.feni.entity.JournalLine jl : cogsLines) {
            totalCogs = totalCogs.add(jl.getDebitAmount());
        }

        BigDecimal grossProfit = totalRevenue.subtract(totalCogs);

        String[] headers = { "CATEGORY", "AMOUNT" };
        List<String[]> rows = new ArrayList<>();
        
        rows.add(new String[] { "REVENUE", "" });
        rows.add(new String[] { "Total Sales Revenue", "₦" + totalRevenue.toString() });
        rows.add(new String[] { "", "" });
        rows.add(new String[] { "COST OF GOODS SOLD (COGS)", "" });
        rows.add(new String[] { "Total COGS", "₦" + totalCogs.toString() });
        rows.add(new String[] { "", "" });
        rows.add(new String[] { "GROSS PROFIT", "₦" + grossProfit.toString() });

        byte[] pdfBytes = pdfService.generateTablePdf(title, headers, rows);
        return savePdf(pdfBytes);
    }

    public List<ShiftSummaryDataResponse> getShiftSummaryData(LocalDate date) {
        Instant startOfDay = date.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = date.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

        List<Booking> bookings = bookingRepo.findByCheckInDateLessThanEqualAndCheckOutDateGreaterThan(date, date);
        bookings = bookings.stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList();

        return bookings.stream().map(b -> ShiftSummaryDataResponse.builder()
                .guestName(b.getGuest().getFirstName() + " " + b.getGuest().getLastName())
                .guestPhone(b.getGuest().getPhone())
                .guestOccupation(b.getGuest().getOccupation())
                .guestAddress(b.getGuest().getAddress())
                .guestNationality(b.getGuest().getNationality())
                .checkInDate(b.getCheckInDate())
                .checkOutDate(b.getCheckOutDate())
                .roomNumber(b.getRoomNumber())
                .purposeOfVisit(b.getGuest().getPurposeOfVisit())
                .stateOfOrigin(b.getGuest().getStateOfOrigin())
                .lga(b.getGuest().getLga())
                .nextOfKinPhone(b.getGuest().getNextOfKinPhone())
                .build()).toList();
    }
    public DashboardStatsResponse getDashboardStats(LocalDate today) {
        // Active guests (assuming CHECKED_IN bookings represent active guests)
        int activeGuests = bookingRepo.findByStatus(BookingStatus.CHECKED_IN).size();

        // Pending check-ins today
        int pendingCheckins = bookingRepo.findByStatusAndCheckInDate(BookingStatus.RESERVED, today).size();

        long totalRooms = roomRepo.count();
        double occupancyRate = totalRooms > 0 ? ((double) activeGuests / totalRooms) * 100 : 0.0;

        // Revenue logic
        Instant startOfToday = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfToday = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        // 7 days trend
        List<DashboardStatsResponse.DailyRevenue> revenueTrend = new ArrayList<>();
        List<DashboardStatsResponse.DailyOccupancy> occupancyTrend = new ArrayList<>();
        
        BigDecimal currentWeekRevenue = BigDecimal.ZERO;
        BigDecimal lastWeekRevenue = BigDecimal.ZERO;
        
        List<com.backend.feni.entity.JournalLine> todayLines = new ArrayList<>();
        List<com.backend.feni.entity.JournalLine> currentWeekLines = new ArrayList<>();

        // We fetch revenue data for the past 14 days to compute percentage change
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            Instant s = d.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant e = d.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            
            List<com.backend.feni.entity.JournalLine> dailyLines = journalLineRepo.findByAccountNameStartingWithAndDateBetween("Sales Revenue -", s, e);
            BigDecimal dailyRev = dailyLines.stream().map(com.backend.feni.entity.JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            
            if (i < 7) {
                // Current 7 days
                currentWeekRevenue = currentWeekRevenue.add(dailyRev);
                currentWeekLines.addAll(dailyLines);
                if (i == 0) {
                    todayLines.addAll(dailyLines);
                }
                
                String dayName = d.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
                revenueTrend.add(new DashboardStatsResponse.DailyRevenue(dayName, dailyRev));
                
                // Calculate occupancy for this day (bookings that overlap with this day)
                List<Booking> overlapping = bookingRepo.findByCheckInDateLessThanEqualAndCheckOutDateGreaterThan(d, d);
                // Filter out cancelled bookings
                long occupiedCount = overlapping.stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).count();
                double dailyOcc = totalRooms > 0 ? ((double) occupiedCount / totalRooms) * 100 : 0.0;
                occupancyTrend.add(new DashboardStatsResponse.DailyOccupancy(dayName, dailyOcc));
            } else {
                // Previous 7 days
                lastWeekRevenue = lastWeekRevenue.add(dailyRev);
            }
        }

        // Percentage change calculation
        // Calculation: (Current Week - Last Week) / Last Week * 100
        double revenuePercentageChange = 0.0;
        if (lastWeekRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenuePercentageChange = currentWeekRevenue.subtract(lastWeekRevenue)
                    .divide(lastWeekRevenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        } else if (currentWeekRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenuePercentageChange = 100.0;
        }
        
        // Inventory Stats
        List<Product> products = productRepo.findAll();
        int totalInventoryItems = 0;
        BigDecimal inventoryValue = BigDecimal.ZERO;
        int lowStockAlerts = 0;

        for (Product p : products) {
            if (p.getType() == com.backend.feni.entity.enums.ProductType.RAW_GOOD) {
                totalInventoryItems++;
                BigDecimal qty = p.getStockQty() != null ? BigDecimal.valueOf(p.getStockQty()) : BigDecimal.ZERO;
                if (p.getUnitCost() != null) {
                    inventoryValue = inventoryValue.add(p.getUnitCost().multiply(qty));
                }
                
                if (p.getStockQty() != null && p.getLowStockThreshold() != null && p.getStockQty() <= p.getLowStockThreshold()) {
                    lowStockAlerts++;
                }
            }
        }

        return DashboardStatsResponse.builder()
                .totalRevenue(currentWeekRevenue) // This assumes totalRevenue displayed is for the current week
                .revenuePercentageChange(revenuePercentageChange)
                .activeGuests(activeGuests)
                .occupancyRate(occupancyRate)
                .occupancyPercentageChange(0.0) // Mocked for now, logic can be added similarly if requested
                .pendingCheckins(pendingCheckins)
                .revenueTrend(revenueTrend)
                .occupancyTrend(occupancyTrend)
                .todayBreakdown(calculateBreakdown(todayLines))
                .weeklyBreakdown(calculateBreakdown(currentWeekLines))
                .totalInventoryItems(totalInventoryItems)
                .inventoryValue(inventoryValue)
                .lowStockAlerts(lowStockAlerts)
                .build();
    }
    
    private DashboardStatsResponse.RevenueBreakdown calculateBreakdown(List<com.backend.feni.entity.JournalLine> lines) {
        BigDecimal roomsRev = BigDecimal.ZERO;
        BigDecimal barRev = BigDecimal.ZERO;
        BigDecimal kitchenRev = BigDecimal.ZERO;
        BigDecimal otherRev = BigDecimal.ZERO;

        for (com.backend.feni.entity.JournalLine jl : lines) {
            String acc = jl.getAccountName().toUpperCase();
            if (acc.contains("ROOMS")) {
                roomsRev = roomsRev.add(jl.getCreditAmount());
            } else if (acc.contains("BAR")) {
                barRev = barRev.add(jl.getCreditAmount());
            } else if (acc.contains("KITCHEN")) {
                kitchenRev = kitchenRev.add(jl.getCreditAmount());
            } else {
                otherRev = otherRev.add(jl.getCreditAmount());
            }
        }
        
        return DashboardStatsResponse.RevenueBreakdown.builder()
            .roomsRevenue(roomsRev)
            .barRevenue(barRev)
            .kitchenRevenue(kitchenRev)
            .otherRevenue(otherRev)
            .totalRevenue(roomsRev.add(barRev).add(kitchenRev).add(otherRev))
            .build();
    }
}
