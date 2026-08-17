package com.backend.feni.service.email;

import com.backend.feni.entity.Facility;
import com.backend.feni.repository.FacilityRepository;
import com.backend.feni.service.LocalFileUploadService;
import com.backend.feni.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportScheduler {

    private final ReportService reportService;
    private final LocalFileUploadService localFileUploadService;
    private final EmailSender emailSender;
    private final FacilityRepository facilityRepo;

    @Value("${email.admin-address:admin@feni.local}")
    private String adminEmail;

    /**
     * Runs on the 1st day of every month at 8:00 AM.
     * Generates the P&L for the previous month, uploads it to R2, and emails the Admin.
     */
    @Scheduled(cron = "0 0 8 1 * ?")
    public void generateAndEmailMonthlyPnl() {
        log.info("Starting scheduled Monthly P&L generation and dispatch");

        try {
            Facility facility = facilityRepo.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("Facility not found"));

            LocalDate previousMonth = LocalDate.now().minusMonths(1);
            int year = previousMonth.getYear();
            int month = previousMonth.getMonthValue();

            byte[] pdfBytes = reportService.generateMonthlyPnlBytes(year, month);
            
            String reportName = "Monthly-PnL-" + year + "-" + month;
            String reportUrl = localFileUploadService.uploadReportPdf(pdfBytes, facility.getId(), reportName);

            String subject = "Monthly P&L Report: " + previousMonth.getMonth() + " " + year;
            String htmlBody = String.format(
                "<p>Hello,</p><p>The Monthly P&L report for %s %s is ready.</p><p>You can download it here: <a href=\"%s\">Download PDF</a></p>",
                previousMonth.getMonth(), year, reportUrl
            );
            emailSender.send(adminEmail, subject, htmlBody);
            log.info("Successfully generated and emailed Monthly P&L for {} {}", previousMonth.getMonth(), year);
            
        } catch (Exception e) {
            log.error("Failed to generate or email Monthly P&L report", e);
        }
    }
}
