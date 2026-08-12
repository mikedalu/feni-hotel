package com.backend.feni.repository;

import com.backend.feni.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByCreatedAtBetween(Instant start, Instant end);
}
