package com.backend.feni.controller;

import com.backend.feni.dto.response.ReportResponse;
import com.backend.feni.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDate;

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

    @GetMapping("/download/{filename}")
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
}
