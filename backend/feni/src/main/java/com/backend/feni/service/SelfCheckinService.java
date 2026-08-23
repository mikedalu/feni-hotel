package com.backend.feni.service;

import com.backend.feni.dto.request.SelfCheckinConfirmRequest;
import com.backend.feni.entity.Facility;
import com.backend.feni.entity.Guest;
import com.backend.feni.repository.FacilityRepository;
import com.backend.feni.repository.GuestRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class SelfCheckinService {

    private final BookingService bookingService;
    private final LocalFileUploadService localFileUploadService;
    private final FacilityRepository facilityRepo;
    private final GuestRepository guestRepo;
    private final RestClient restClient;
    
    @Value("${cloud.sync.api-key}")
    private String cloudApiKey;

    @Value("${cloud.sync.url}")
    private String cloudSyncUrl; // e.g. http://localhost:3000/api/sync/events. We can derive checkin URL from it.

    public SelfCheckinService(BookingService bookingService, 
                              LocalFileUploadService localFileUploadService, 
                              FacilityRepository facilityRepo,
                              GuestRepository guestRepo) {
        this.bookingService = bookingService;
        this.localFileUploadService = localFileUploadService;
        this.facilityRepo = facilityRepo;
        this.guestRepo = guestRepo;
        this.restClient = RestClient.builder()
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory())
                .build();
    }

    private String getCloudCheckinUrl() {
        return cloudSyncUrl.replace("/sync/events", "/checkin/session");
    }

    private String getCloudRecoverUrl() {
        return cloudSyncUrl.replace("/sync/events", "/checkin/recover");
    }

    public String startSession(UUID staffId) {
        String sessionId = UUID.randomUUID().toString();
        
        Facility facility = facilityRepo.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Facility not found"));

        try {
            ResponseEntity<Void> response = restClient.post()
                    .uri(getCloudCheckinUrl())
                    .header("x-facility-api-key", cloudApiKey)
                    .body(Map.of("sessionId", sessionId, "facilityId", facility.getId().toString()))
                    .retrieve()
                    .toBodilessEntity();
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to open cloud clipboard session");
            }
        } catch (Exception e) {
            log.error("Error communicating with Cloud API to start session", e);
            throw new RuntimeException("Could not start self check-in session", e);
        }

        return sessionId;
    }

    @Transactional
    public void confirmCheckin(String sessionId, SelfCheckinConfirmRequest request, UUID staffId) {
        Facility facility = facilityRepo.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Facility not found"));

        // 1. Core booking flow handles the Booking, Journal, and Outbox event
        bookingService.createBooking(request.getBookingRequest(), staffId);

        if (request.getIdScanBase64() != null && !request.getIdScanBase64().isEmpty()) {
            CompletableFuture<String> futureIdUrl = localFileUploadService.uploadIdScanAsync(request.getIdScanBase64(), facility.getId());
            futureIdUrl.thenAccept(url -> {
                if (url != null) {
                    guestRepo.findFirstByEmailAndFirstNameIgnoreCaseAndLastNameIgnoreCase(
                            request.getBookingRequest().getGuestEmail(),
                            request.getBookingRequest().getGuestFirstName(),
                            request.getBookingRequest().getGuestLastName()
                    ).ifPresent(guest -> {
                        guest.setIdScanUrl(url);
                        guestRepo.save(guest);
                        log.info("Saved ID scan URL to guest profile: {}", guest.getId());
                    });
                }
            });
        }

        // 3. Clear cloud session to prevent stale data
        try {
            restClient.delete()
                    .uri(getCloudCheckinUrl() + "/" + sessionId)
                    .header("x-facility-api-key", cloudApiKey)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Cleared Cloud Clipboard session: {}", sessionId);
        } catch (Exception e) {
            log.error("Failed to delete Cloud Clipboard session after confirm. It will expire naturally.", e);
        }
    }

    public List<Map<String, Object>> getRecoverableSessions() {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> sessions = restClient.get()
                    .uri(getCloudRecoverUrl())
                    .header("x-facility-api-key", cloudApiKey)
                    .retrieve()
                    .body(List.class);
            return sessions;
        } catch (Exception e) {
            log.error("Error communicating with Cloud API to recover sessions", e);
            throw new RuntimeException("Could not recover sessions", e);
        }
    }
}
