package com.backend.feni.service;

import com.backend.feni.dto.response.BookingResponse;
import com.backend.feni.dto.response.GuestResponse;
import com.backend.feni.entity.Booking;
import com.backend.feni.entity.Guest;
import com.backend.feni.repository.BookingRepository;
import com.backend.feni.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuestService {

    private final GuestRepository guestRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<GuestResponse> getAllGuests() {
        return guestRepository.findAll().stream().map(g -> toResponse(g, false)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GuestResponse getGuestById(UUID id) {
        Guest guest = guestRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Guest not found"));
        return toResponse(guest, true);
    }

    private GuestResponse toResponse(Guest guest, boolean includeBookings) {
        List<BookingResponse> bookings = null;
        if (includeBookings) {
            bookings = bookingRepository.findByGuestId(guest.getId()).stream()
                    .map(this::toBookingResponse)
                    .collect(Collectors.toList());
        }

        return GuestResponse.builder()
                .id(guest.getId())
                .firstName(guest.getFirstName())
                .lastName(guest.getLastName())
                .email(guest.getEmail())
                .phone(guest.getPhone())
                .title(guest.getTitle())
                .occupation(guest.getOccupation())
                .nextOfKinPhone(guest.getNextOfKinPhone())
                .address(guest.getAddress())
                .lga(guest.getLga())
                .nationality(guest.getNationality())
                .stateOfOrigin(guest.getStateOfOrigin())
                .passportNo(guest.getPassportNo())
                .nin(guest.getNin())
                .purposeOfVisit(guest.getPurposeOfVisit())
                .arrivingFrom(guest.getArrivingFrom())
                .goingTo(guest.getGoingTo())
                .idScanUrl(guest.getIdScanUrl())
                .bookings(bookings)
                .build();
    }

    private BookingResponse toBookingResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .guestId(booking.getGuest().getId())
                .guestFirstName(booking.getGuest().getFirstName())
                .guestLastName(booking.getGuest().getLastName())
                .guestEmail(booking.getGuest().getEmail())
                .guestPhone(booking.getGuest().getPhone())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .roomNumber(booking.getRoomNumber())
                .roomType(booking.getRoomType())
                .totalCost(booking.getTotalCost())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .processedByUsername(booking.getProcessedBy().getUsername())
                .build();
    }
}
