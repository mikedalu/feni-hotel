package com.backend.feni.service;

import com.backend.feni.entity.Booking;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.Product;
import com.backend.feni.repository.BookingRepository;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final PdfGenerationService pdfService;
    private final BookingRepository bookingRepo;
    private final JournalEntryRepository journalRepo;
    private final ProductRepository productRepo;

    public String generateReport(String type) {
        String title;
        StringBuilder content = new StringBuilder();

        switch (type.toLowerCase()) {
            case "occupancy":
                title = "Occupancy Report";
                List<Booking> bookings = bookingRepo.findAll();
                content.append("Total Bookings: ").append(bookings.size()).append("\n");
                for (Booking b : bookings) {
                    content.append(b.getGuest().getFirstName()).append(" ").append(b.getGuest().getLastName())
                            .append(" - Room: ").append(b.getRoomNumber())
                            .append(" (").append(b.getCheckInDate()).append(" to ").append(b.getCheckOutDate()).append(")\n");
                }
                break;

            case "shift-summary":
                title = "Daily Shift Summary";
                content.append("Shift Summary Report\n(Metrics for the current shift would appear here.)\n");
                break;

            case "sales":
                title = "Sales Report";
                List<JournalEntry> entries = journalRepo.findAll();
                long salesCount = entries.stream().filter(e -> e.getEntryType().name().equals("SALE")).count();
                content.append("Total Sales Transactions: ").append(salesCount).append("\n");
                break;

            case "inventory":
                title = "Inventory Low-Stock Report";
                List<Product> products = productRepo.findAll();
                content.append("Low Stock Items:\n");
                for (Product p : products) {
                    if (p.getStockQty() != null && p.getLowStockThreshold() != null && p.getStockQty() <= p.getLowStockThreshold()) {
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
