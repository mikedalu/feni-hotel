package com.backend.feni.service.email;

import com.backend.feni.entity.SystemAlert;
import com.backend.feni.repository.SystemAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeferredEmailDispatcher {

    private final SystemAlertRepository systemAlertRepo;
    private final EmailSender emailSender;

    @Value("${bootstrap.admin.username}")
    private String adminEmail;

    @Scheduled(fixedDelay = 60000)
    public void processDeferredEmails() {
        List<SystemAlert> pendingAlerts = systemAlertRepo.findByEmailSentFalse();
        if (pendingAlerts.isEmpty()) {
            return;
        }

        log.info("Found {} SystemAlerts requiring email dispatch", pendingAlerts.size());

        for (SystemAlert alert : pendingAlerts) {
            try {
                String subject = "OPS ALERT: " + alert.getType().name();
                String htmlBody = "<h1>System Alert</h1>" +
                        "<p><strong>Type:</strong> " + alert.getType().name() + "</p>" +
                        "<p><strong>Message:</strong> " + alert.getMessage() + "</p>" +
                        "<p><strong>Time:</strong> " + alert.getCreatedAt() + "</p>";
                
                emailSender.send(adminEmail, subject, htmlBody);
                alert.setEmailSent(true);
                systemAlertRepo.save(alert);
                log.info("Successfully dispatched email for alert {}", alert.getId());
            } catch (Exception e) {
                log.warn("Failed to dispatch email for alert {}. Will retry next tick. Reason: {}", alert.getId(), e.getMessage());
                // Break out of loop since if one email fails due to network, subsequent ones will too
                break;
            }
        }
    }
}
