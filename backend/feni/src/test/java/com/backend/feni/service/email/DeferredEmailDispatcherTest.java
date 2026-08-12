package com.backend.feni.service.email;

import com.backend.feni.entity.SystemAlert;
import com.backend.feni.entity.enums.SystemAlertType;
import com.backend.feni.repository.SystemAlertRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DeferredEmailDispatcherTest {

    @Mock
    private SystemAlertRepository systemAlertRepo;

    @Mock
    private EmailSender emailSender;

    private DeferredEmailDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        dispatcher = new DeferredEmailDispatcher(systemAlertRepo, emailSender);
        ReflectionTestUtils.setField(dispatcher, "adminEmail", "admin@feni.local");
    }

    @Test
    void testProcessDeferredEmails_Success() {
        SystemAlert alert = new SystemAlert();
        alert.setType(SystemAlertType.SYNC_FAILURE);
        alert.setMessage("Offline");
        
        when(systemAlertRepo.findByEmailSentFalse()).thenReturn(List.of(alert));

        dispatcher.processDeferredEmails();

        verify(emailSender).send(eq("admin@feni.local"), contains("SYNC_FAILURE"), contains("Offline"));
        assertTrue(alert.isEmailSent());
        verify(systemAlertRepo).save(alert);
    }
    
    @Test
    void testProcessDeferredEmails_FailureStopsProcessing() {
        SystemAlert alert1 = new SystemAlert();
        alert1.setType(SystemAlertType.SYNC_FAILURE);
        SystemAlert alert2 = new SystemAlert();
        alert2.setType(SystemAlertType.GENERAL_ERROR);
        
        when(systemAlertRepo.findByEmailSentFalse()).thenReturn(List.of(alert1, alert2));
        
        doThrow(new RuntimeException("Simulated Network Error")).when(emailSender).send(anyString(), anyString(), anyString());

        dispatcher.processDeferredEmails();

        verify(emailSender, times(1)).send(anyString(), anyString(), anyString());
        verify(systemAlertRepo, never()).save(any());
    }
}
