package com.backend.feni.service.sync;

import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.entity.SystemAlert;
import com.backend.feni.entity.enums.SystemAlertType;
import com.backend.feni.repository.SystemAlertRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.client.RestClient;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OutboxSyncWorkerTest {

    @Mock
    private OutboxEventRepository outboxEventRepo;

    @Mock
    private SystemAlertRepository systemAlertRepo;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private RestClient.RequestBodySpec requestBodySpec;
    
    @Mock
    private RestClient.ResponseSpec responseSpec;

    private OutboxSyncWorker worker;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(any(String.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any(Object.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.toBodilessEntity()).thenReturn(ResponseEntity.ok().build());
        
        worker = new OutboxSyncWorker(outboxEventRepo, systemAlertRepo, new ObjectMapper(), "http://dummy", "dummy-key");
        org.springframework.test.util.ReflectionTestUtils.setField(worker, "restClient", restClient);
    }

    @Test
    void testProcessOutboxEvents_Success() {
        OutboxEvent event = new OutboxEvent();
        event.setStatus(OutboxStatus.PENDING);
        
        when(outboxEventRepo.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)).thenReturn(List.of(event));

        worker.processOutboxEvents();

        assertEquals(OutboxStatus.SYNCED, event.getStatus());
        verify(outboxEventRepo).saveAll(List.of(event));
    }

    @Test
    void testProcessOutboxEvents_FailureTriggersAlert() {
        OutboxEvent event = new OutboxEvent();
        event.setStatus(OutboxStatus.PENDING);
        event.setRetryCount(100); // 101st failure
        
        when(outboxEventRepo.findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING)).thenReturn(List.of(event));
        
        when(requestBodySpec.retrieve()).thenThrow(new RuntimeException("Simulated Failure"));
        
        when(systemAlertRepo.findFirstByTypeAndResolvedFalse(SystemAlertType.SYNC_FAILURE))
            .thenReturn(java.util.Optional.empty());

        worker.processOutboxEvents();

        assertEquals(OutboxStatus.FAILED, event.getStatus());
        verify(outboxEventRepo).saveAll(List.of(event));
        verify(systemAlertRepo).save(argThat(alert -> alert.getType() == SystemAlertType.SYNC_FAILURE));
    }
}
