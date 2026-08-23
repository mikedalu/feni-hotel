package com.backend.feni.controller;

import com.backend.feni.dto.request.PosSaleRequest;
import com.backend.feni.dto.response.ReportResponse;
import com.backend.feni.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/{type}/generate")
    public ReportResponse generateReport(
            @PathVariable String type,
            @RequestParam(required = false) LocalDate date) {
        
        if (date == null) {
            date = LocalDate.now();
        }
        
        String url = reportService.generateReport(type, date);
        return new ReportResponse(url);
    }

    @PostMapping("/pnl/generate")
    public ReportResponse generatePnl(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        if (startDate == null) startDate = LocalDate.now().withDayOfMonth(1);
        if (endDate == null) endDate = LocalDate.now();
        
        String url = reportService.generateProfitAndLossReport(startDate, endDate);
        return new ReportResponse(url);
    }

    @PostMapping("/pos-invoice/generate")
    public ReportResponse generatePosInvoice(@RequestBody @Valid PosSaleRequest request) {
        String url = reportService.generatePosInvoice(request);
        return new ReportResponse(url);
    }

    @PostMapping("/booking-invoice/{bookingId}/generate")
    public ReportResponse generateBookingInvoice(@PathVariable UUID bookingId) {
        String url = reportService.generateBookingInvoice(bookingId);
        return new ReportResponse(url);
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> downloadReport(@PathVariable String filename) {
        File file = new File(System.getProperty("java.io.tmpdir"), filename);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    @GetMapping("/shift-summary/data")
    public java.util.List<com.backend.feni.dto.response.ShiftSummaryDataResponse> getShiftSummaryData(
            @RequestParam(required = false) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return reportService.getShiftSummaryData(date);
    }

    @GetMapping("/dashboard")
    public com.backend.feni.dto.response.DashboardStatsResponse getDashboardStats() {
        return reportService.getDashboardStats(LocalDate.now());
    }
}
