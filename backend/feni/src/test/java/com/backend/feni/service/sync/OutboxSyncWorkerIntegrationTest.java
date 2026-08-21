package com.backend.feni.service.sync;

import com.backend.feni.TestcontainersConfiguration;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.entity.enums.SystemAlertType;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.repository.SystemAlertRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@TestPropertySource(properties = {"cloud.sync.polling-delay=9999999"})
public class OutboxSyncWorkerIntegrationTest {

    @Autowired
    private OutboxEventRepository outboxEventRepo;

    @Autowired
    private SystemAlertRepository systemAlertRepo;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OutboxSyncWorker scheduledWorkerBean;

    private OutboxSyncWorker worker;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        outboxEventRepo.deleteAll();
        systemAlertRepo.deleteAll();

        // Create a RestClient instance with MockRestServiceServer attached
        RestClient.Builder restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();
        RestClient restClient = restClientBuilder.build();

        // Re-initialize the worker with our test RestClient
        worker = new OutboxSyncWorker(outboxEventRepo, systemAlertRepo, objectMapper, "http://localhost:3000/api/sync/events", "test-key");
        org.springframework.test.util.ReflectionTestUtils.setField(worker, "restClient", restClient);
    }

    @Test
    void processOutboxEvents_Success_UpdatesStatusToSynced() {
        // Arrange
        OutboxEvent event = new OutboxEvent();
        event.setEventType("SALE_COMPLETED");
        event.setPayload("{}");
        event.setStatus(OutboxStatus.PENDING);
        outboxEventRepo.save(event);

        mockServer.expect(requestTo("http://localhost:3000/api/sync/events"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        // Act
        worker.processOutboxEvents();

        // Assert
        mockServer.verify();
        List<OutboxEvent> events = outboxEventRepo.findAll();
        assertThat(events).hasSize(1);
        assertThat(events.get(0).getStatus()).isEqualTo(OutboxStatus.SYNCED);
        assertThat(events.get(0).getSyncedAt()).isNotNull();
    }

    @Test
    void processOutboxEvents_Failure_IncrementsRetryCountAndTriggersAlert() {
        // Arrange
        OutboxEvent event = new OutboxEvent();
        event.setEventType("SALE_COMPLETED");
        event.setPayload("{}");
        event.setStatus(OutboxStatus.PENDING);
        event.setRetryCount(100); // Trigger failure on next retry
        outboxEventRepo.save(event);

        mockServer.expect(requestTo("http://localhost:3000/api/sync/events"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        // Act
        worker.processOutboxEvents();

        // Assert
        mockServer.verify();
        List<OutboxEvent> events = outboxEventRepo.findAll();
        assertThat(events).hasSize(1);
        assertThat(events.get(0).getStatus()).isEqualTo(OutboxStatus.FAILED);
        assertThat(events.get(0).getRetryCount()).isEqualTo(101);

        assertThat(systemAlertRepo.findFirstByTypeAndResolvedFalse(SystemAlertType.SYNC_FAILURE)).isPresent();
    }
}
