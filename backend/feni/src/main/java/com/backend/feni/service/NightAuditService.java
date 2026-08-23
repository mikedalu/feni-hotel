package com.backend.feni.service;

import com.backend.feni.entity.Booking;
import com.backend.feni.entity.enums.BookingStatus;
import com.backend.feni.repository.BookingRepository;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NightAuditService {

    private final BookingRepository bookingRepository;
    private final OutboxEventRepository outboxRepo;
    private final ObjectMapper objectMapper;

    /**
     * Runs every day at 13:00 (1 PM).
     * If a booking checkout date is strictly before today, it is definitely overdue.
     * If a booking checkout date is today, and it's 1 PM (past standard 12 PM checkout),
     * it is also considered overdue.
     * Therefore, we find bookings with checkOutDate <= today.
     * Wait, to be safe, let's just mark anything where checkOutDate <= today as OVERDUE
     * when this runs at 1 PM. If it's already checked out, it won't be picked up.
     */
    @Scheduled(cron = "0 0 13 * * ?") // Every day at 1 PM
    @Transactional
    public void flagOverdueCheckouts() {
        log.info("Starting Night Audit: Checking for overdue checkouts.");
        
        LocalDate today = LocalDate.now();
        // Any CHECKED_IN booking whose checkOutDate is today or earlier is now overdue
        // Wait, the requirement says "after the check_out date has passed".
        // Let's use checkOutDate <= today. Since this runs at 1 PM, checkout time (usually 12 PM) has passed.
        // For simplicity, let's just find checkOutDate < today (strictly before today). 
        // Or actually, findByStatusAndCheckOutDateBefore with date = tomorrow (so it includes today).
        // Let's use strictly less than today to mean "they should have left yesterday".
        // But if checkout is 12 PM, and it is 1 PM today, they are overdue today. 
        // Let's use tomorrow's date for "before" so it includes today.
        LocalDate tomorrow = today.plusDays(1);
        
        List<Booking> overdueBookings = bookingRepository.findByStatusAndCheckOutDateBefore(BookingStatus.CHECKED_IN, tomorrow);
        
        if (overdueBookings.isEmpty()) {
            log.info("Night Audit: No overdue bookings found.");
            return;
        }

        for (Booking booking : overdueBookings) {
            booking.setStatus(BookingStatus.OVERDUE);
            log.info("Flagged booking {} (Room {}) as OVERDUE.", booking.getId(), booking.getRoomNumber());
            
            try {
                java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
                java.util.Map<String, Object> bookingMap = new java.util.HashMap<>();
                bookingMap.put("id", booking.getId());
                bookingMap.put("status", booking.getStatus().name());
                payloadMap.put("booking", bookingMap);
                String payload = objectMapper.writeValueAsString(payloadMap);

                OutboxEvent event = OutboxEvent.builder()
                        .eventType("BOOKING_UPDATED")
                        .payload(payload)
                        .status(OutboxStatus.PENDING)
                        .build();
                outboxRepo.save(event);
            } catch (Exception e) {
                log.error("Failed to serialize outbox event for overdue booking {}", booking.getId(), e);
            }
        }
        
        bookingRepository.saveAll(overdueBookings);
        log.info("Night Audit completed: {} bookings marked as OVERDUE.", overdueBookings.size());
    }
}
