package com.backend.feni.service;

import com.backend.feni.dto.response.DashboardStatsResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiReportService {

    private final ChatModel chatModel;
    private final ReportService reportService;
    private final ObjectMapper objectMapper;

    public String generateIntelligentInsights(LocalDate date) {
        try {
            DashboardStatsResponse stats = reportService.getDashboardStats(date);
            String statsJson = objectMapper.writeValueAsString(stats);

            String promptText = "You are an expert hotel management AI assistant for Feni Hospitality SaaS. " +
                    "Analyze the following dashboard statistics and provide a concise, actionable executive summary. " +
                    "Highlight revenue trends, occupancy rate concerns or positives, and any inventory issues (like low stock). " +
                    "Make it professional and insightful. " +
                    "\n\nStats data:\n" + statsJson;

            return chatModel.call(promptText);

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize stats for AI analysis", e);
            return "Unable to generate AI insights due to a data processing error.";
        } catch (Exception e) {
            log.error("AI service error", e);
            return "AI service is currently unavailable or improperly configured. Please check your API key and connection.";
        }
    }
}
