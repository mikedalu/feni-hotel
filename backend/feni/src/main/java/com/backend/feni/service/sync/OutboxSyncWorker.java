package com.backend.feni.service.sync;

import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.entity.SystemAlert;
import com.backend.feni.entity.enums.SystemAlertType;
import com.backend.feni.repository.SystemAlertRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;

@Component
@Slf4j
public class OutboxSyncWorker {

    private final OutboxEventRepository outboxEventRepo;
    private final SystemAlertRepository systemAlertRepo;
    private final RestClient restClient;
    private final String cloudApiUrl;
    private final String facilityApiKey;
    private final ObjectMapper objectMapper;

    public OutboxSyncWorker(
            OutboxEventRepository outboxEventRepo,
            SystemAlertRepository systemAlertRepo,
            ObjectMapper objectMapper,
            @Value("${cloud.sync.url:http://localhost:3000/api/sync/events}") String cloudApiUrl,
            @Value("${cloud.sync.api-key:default-dev-key}") String facilityApiKey) {
        this.outboxEventRepo = outboxEventRepo;
        this.systemAlertRepo = systemAlertRepo;
        this.objectMapper = objectMapper;
        this.cloudApiUrl = cloudApiUrl;
        this.facilityApiKey = facilityApiKey;
        this.restClient = RestClient.builder()
                .requestFactory(new SimpleClientHttpRequestFactory())
                .build();
    }

    @Scheduled(fixedDelayString = "${cloud.sync.polling-delay:5000}")
    public void processOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepo.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        if (pendingEvents.isEmpty()) {
            return;
        }

        try {
            // Serialize to string to force Content-Length header and prevent chunked transfer
            String jsonBody = objectMapper.writeValueAsString(pendingEvents);
            
            // Push events in a single batch array
            restClient.post()
                    .uri(cloudApiUrl)
                    .header("x-facility-api-key", facilityApiKey)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(jsonBody)
                    .retrieve()
                    .toBodilessEntity();

            // If we reach here, it's a 2xx success
            Instant now = Instant.now();
            for (OutboxEvent event : pendingEvents) {
                event.setStatus(OutboxStatus.SYNCED);
                event.setSyncedAt(now);
            }
            outboxEventRepo.saveAll(pendingEvents);
            log.info("Successfully synced {} events to the cloud", pendingEvents.size());

        } catch (Exception e) {
            log.error("Failed to sync outbox events: {}", e.getMessage());
            handleFailure(pendingEvents);
        }
    }

    private void handleFailure(List<OutboxEvent> pendingEvents) {
        boolean triggerAlert = false;

        for (OutboxEvent event : pendingEvents) {
            int retries = event.getRetryCount() != null ? event.getRetryCount() : 0;
            event.setRetryCount(retries + 1);

            if (event.getRetryCount() > 100) {
                event.setStatus(OutboxStatus.FAILED);
                triggerAlert = true;
            }
        }
        outboxEventRepo.saveAll(pendingEvents);

        if (triggerAlert) {
            log.error("One or more outbox events exceeded MAX_RETRIES (100). Triggering Ops Alert.");
            createSyncFailureAlert();
        }
    }

    private void createSyncFailureAlert() {
        systemAlertRepo.findFirstByTypeAndResolvedFalse(SystemAlertType.SYNC_FAILURE)
                .ifPresentOrElse(
                        alert -> log.debug("Unresolved SYNC_FAILURE alert already exists, skipping creation."),
                        () -> {
                            SystemAlert alert = SystemAlert.builder()
                                    .type(SystemAlertType.SYNC_FAILURE)
                                    .message("The local facility server has been unable to sync data to the cloud for over 100 consecutive attempts. Please investigate network connectivity or cloud service health immediately.")
                                    .build();
                            systemAlertRepo.save(alert);
                            log.info("Created new SYNC_FAILURE SystemAlert.");
                        }
                );
    }
}
