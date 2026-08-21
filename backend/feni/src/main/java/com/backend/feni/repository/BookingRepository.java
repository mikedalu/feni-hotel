package com.backend.feni.repository;

import com.backend.feni.entity.Booking;
import com.backend.feni.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByCreatedAtBetween(Instant start, Instant end);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByCheckInDateLessThanEqualAndCheckOutDateGreaterThan(LocalDate end, LocalDate start);
    List<Booking> findByStatusAndCheckInDate(BookingStatus status, LocalDate checkInDate);
}
