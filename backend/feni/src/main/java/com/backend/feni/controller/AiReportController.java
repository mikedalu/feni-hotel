package com.backend.feni.controller;

import com.backend.feni.service.AiReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports/ai-insights")
@RequiredArgsConstructor
public class AiReportController {

    private final AiReportService aiReportService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public String getAiInsights(@RequestParam(required = false) String date) {
        LocalDate parsedDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return aiReportService.generateIntelligentInsights(parsedDate);
    }
}
