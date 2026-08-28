package com.backend.feni.repository;

import com.backend.feni.entity.Booking;
import com.backend.feni.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByCreatedAtBetween(Instant start, Instant end);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByCheckInDateLessThanEqualAndCheckOutDateGreaterThan(LocalDate end, LocalDate start);
    List<Booking> findByStatusAndCheckInDate(BookingStatus status, LocalDate checkInDate);
    List<Booking> findByStatusAndCheckOutDateBefore(BookingStatus status, LocalDate date);
    List<Booking> findByGuestId(UUID guestId);
    
    @Query("SELECT b FROM Booking b WHERE b.roomNumber = :roomNumber AND b.status != 'CANCELLED' AND b.checkInDate < :checkOutDate AND b.checkOutDate > :checkInDate")
    List<Booking> findOverlappingBookings(@Param("roomNumber") String roomNumber, @Param("checkInDate") LocalDate checkInDate, @Param("checkOutDate") LocalDate checkOutDate);
}
