package com.backend.feni.controller;

import com.backend.feni.dto.request.BookingRequest;
import com.backend.feni.dto.request.ChangeRoomRequest;
import com.backend.feni.dto.request.ExtendBookingRequest;
import com.backend.feni.dto.request.IncidentalDepositRequest;
import com.backend.feni.dto.response.BookingResponse;
import com.backend.feni.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createBooking(@Valid @RequestBody BookingRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        bookingService.createBooking(request, staffId);
    }

    @GetMapping
    public List<BookingResponse> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @GetMapping("/{id}")
    public BookingResponse getBookingById(@PathVariable UUID id) {
        return bookingService.getBookingById(id);
    }

    @PostMapping("/{id}/checkout")
    public void checkoutBooking(@PathVariable UUID id) {
        bookingService.checkoutBooking(id);
    }

    @PatchMapping("/{id}/change-room")
    public void changeRoom(@PathVariable UUID id, @Valid @RequestBody ChangeRoomRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        bookingService.changeRoom(id, request, staffId);
    }

    @PostMapping("/{id}/extend")
    public void extendBooking(@PathVariable UUID id, @Valid @RequestBody ExtendBookingRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        bookingService.extendBooking(id, request, staffId);
    }

    @PostMapping("/{id}/deposit")
    public void addDeposit(@PathVariable UUID id, @Valid @RequestBody IncidentalDepositRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        bookingService.addDeposit(id, request, staffId);
    }

    @PostMapping("/{id}/refund-deposit")
    public void refundDeposit(@PathVariable UUID id, @Valid @RequestBody IncidentalDepositRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        bookingService.refundDeposit(id, request, staffId);
    }

    @PostMapping("/reserve")
    @ResponseStatus(HttpStatus.CREATED)
    public void createReservation(@Valid @RequestBody BookingRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        bookingService.createReservation(request, staffId);
    }

    @PostMapping("/{id}/checkin")
    public void checkinReservation(@PathVariable UUID id, @Valid @RequestBody BookingRequest request, @AuthenticationPrincipal Jwt jwt) {
        UUID staffId = UUID.fromString(jwt.getClaimAsString("userId"));
        bookingService.checkinReservation(id, request, staffId);
    }
}
