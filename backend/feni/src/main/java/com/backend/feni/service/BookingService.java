package com.backend.feni.service;

import com.backend.feni.dto.request.BookingRequest;
import com.backend.feni.entity.Booking;
import com.backend.feni.entity.Guest;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.entity.JournalLine;
import com.backend.feni.entity.OutboxEvent;
import com.backend.feni.entity.StaffUser;
import com.backend.feni.entity.enums.EntryType;
import com.backend.feni.entity.enums.OutboxStatus;
import com.backend.feni.exception.UnbalancedJournalException;
import com.backend.feni.repository.BookingRepository;
import com.backend.feni.repository.GuestRepository;
import com.backend.feni.repository.JournalEntryRepository;
import com.backend.feni.repository.OutboxEventRepository;
import com.backend.feni.repository.StaffUserRepository;
import com.backend.feni.service.email.EmailSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepo;
    private final GuestRepository guestRepo;
    private final JournalEntryRepository journalRepo;
    private final OutboxEventRepository outboxRepo;
    private final StaffUserRepository staffRepo;
    private final EmailSender emailSender;

    @Transactional
    public void createBooking(BookingRequest request, UUID staffId) {
        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        Guest guest = guestRepo.findByEmail(request.getGuestEmail())
                .orElseGet(() -> Guest.builder()
                        .firstName(request.getGuestFirstName())
                        .lastName(request.getGuestLastName())
                        .email(request.getGuestEmail())
                        .phone(request.getGuestPhone())
                        .build());
        guest = guestRepo.save(guest);

        Booking booking = Booking.builder()
                .guest(guest)
                .processedBy(staffUser)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .roomNumber(request.getRoomNumber())
                .totalCost(request.getTotalCost())
                .build();
        booking = bookingRepo.save(booking);

        JournalEntry journalEntry = JournalEntry.builder()
                .entryType(EntryType.BOOKING_PAYMENT)
                .referenceId(booking.getId())
                .processedBy(staffUser)
                .build();

        journalEntry.addLine(JournalLine.builder().accountName("Cash").debitAmount(request.getTotalCost()).creditAmount(BigDecimal.ZERO).build());
        journalEntry.addLine(JournalLine.builder().accountName("Sales Revenue").debitAmount(BigDecimal.ZERO).creditAmount(request.getTotalCost()).build());

        BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException("Journal entry is unbalanced.");
        }
        journalRepo.save(journalEntry);

        OutboxEvent event = OutboxEvent.builder()
                .eventType("BOOKING_CREATED")
                .payload("{\"bookingId\":\"" + booking.getId() + "\", \"totalCost\":" + request.getTotalCost() + "}")
                .status(OutboxStatus.PENDING)
                .build();
        outboxRepo.save(event);

        String emailBody = String.format("<h1>Booking Confirmed</h1><p>Dear %s,</p><p>Your booking for room %s from %s to %s is confirmed.</p>",
                guest.getFirstName(), booking.getRoomNumber(), booking.getCheckInDate(), booking.getCheckOutDate());
        
        emailSender.send(guest.getEmail(), "Your Booking Confirmation - Feni Hotel", emailBody);
    }
}
