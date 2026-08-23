package com.backend.feni.service;

import com.backend.feni.dto.request.BookingRequest;
import com.backend.feni.dto.request.ChangeRoomRequest;
import com.backend.feni.dto.request.ExtendBookingRequest;
import com.backend.feni.dto.request.IncidentalDepositRequest;
import com.backend.feni.entity.*;
import com.backend.feni.entity.enums.*;
import com.backend.feni.exception.UnbalancedJournalException;
import com.backend.feni.repository.*;
import com.backend.feni.service.email.EmailSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.backend.feni.dto.response.BookingResponse;

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
    private final RoomRepository roomRepo;
    private final ThermalPrinterService thermalPrinterService;
    private final ReportService reportService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional
    public void createBooking(BookingRequest request, UUID staffId) {
        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        Room room = roomRepo.findByRoomNumber(request.getRoomNumber())
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        
        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new IllegalStateException("Room is not available for check-in");
        }

        Guest guest = guestRepo.findFirstByEmailAndFirstNameIgnoreCaseAndLastNameIgnoreCase(
                    request.getGuestEmail(), request.getGuestFirstName(), request.getGuestLastName())
                .orElseGet(() -> Guest.builder().email(request.getGuestEmail()).build());

        guest.setFirstName(request.getGuestFirstName());
        guest.setLastName(request.getGuestLastName());
        guest.setPhone(request.getGuestPhone());

        if (request.getTitle() != null) guest.setTitle(request.getTitle());
        if (request.getOccupation() != null) guest.setOccupation(request.getOccupation());
        if (request.getNextOfKinPhone() != null) guest.setNextOfKinPhone(request.getNextOfKinPhone());
        if (request.getAddress() != null) guest.setAddress(request.getAddress());
        if (request.getLga() != null) guest.setLga(request.getLga());
        if (request.getNationality() != null) guest.setNationality(request.getNationality());
        if (request.getStateOfOrigin() != null) guest.setStateOfOrigin(request.getStateOfOrigin());
        if (request.getPassportNo() != null) guest.setPassportNo(request.getPassportNo());
        if (request.getNin() != null) guest.setNin(request.getNin());
        if (request.getPurposeOfVisit() != null) guest.setPurposeOfVisit(request.getPurposeOfVisit());
        if (request.getArrivingFrom() != null) guest.setArrivingFrom(request.getArrivingFrom());
        if (request.getGoingTo() != null) guest.setGoingTo(request.getGoingTo());
        guest = guestRepo.save(guest);

        Booking booking = Booking.builder()
                .guest(guest)
                .processedBy(staffUser)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .roomNumber(room.getRoomNumber())
                .roomType(request.getRoomType())
                .checkInTime(request.getCheckInTime())
                .paymentMethod(request.getPaymentMethod())
                .totalCost(request.getTotalCost())
                .status(BookingStatus.CHECKED_IN)
                .priceOverrideReason(request.getOverrideReason())
                .build();
        booking = bookingRepo.save(booking);

        room.setStatus(RoomStatus.OCCUPIED);
        roomRepo.save(room);

        JournalEntry journalEntry = JournalEntry.builder()
                .entryType(EntryType.BOOKING_PAYMENT)
                .referenceId(booking.getId())
                .processedBy(staffUser)
                .build();

        String debitAccount = switch (request.getPaymentMethod()) {
            case CASH -> "Cash";
            case POS -> "Card Payments";
            case TRANSFER -> "Bank Transfers";
        };

        journalEntry.addLine(JournalLine.builder().accountName(debitAccount).debitAmount(request.getTotalCost()).creditAmount(BigDecimal.ZERO).build());
        journalEntry.addLine(JournalLine.builder().accountName("Sales Revenue - ROOMS").debitAmount(BigDecimal.ZERO).creditAmount(request.getTotalCost()).build());

        BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException("Journal entry is unbalanced.");
        }
        journalRepo.save(journalEntry);

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            java.util.Map<String, Object> bookingMap = new java.util.HashMap<>();
            bookingMap.put("id", booking.getId());
            bookingMap.put("totalCost", booking.getTotalCost());
            
            java.util.Map<String, Object> processedByMap = new java.util.HashMap<>();
            processedByMap.put("username", staffUser.getUsername());
            bookingMap.put("processedBy", processedByMap);
            
            payloadMap.put("booking", bookingMap);
            payloadMap.put("journalEntry", journalEntry);
            
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("BOOKING_CREATED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }

        if (request.getPrinterIp() != null && !request.getPrinterIp().isBlank()) {
            String receipt = String.format("============================\n         FENI HOTEL         \n No. 1, Keana Link Road, Jos\n    Tel: +234 123 456 7890  \n============================\n      BOOKING RECEIPT       \n============================\n\nRoom: %s\nCheck-in: %s\nCheck-out: %s\nTotal: ₦%s\n",
                    booking.getRoomNumber(), booking.getCheckInDate(), booking.getCheckOutDate(), booking.getTotalCost());
            thermalPrinterService.printReceiptAsync(receipt, request.getPrinterIp());
        }

        String invoiceUrl = reportService.generateBookingInvoice(booking.getId());
        String fullInvoiceUrl = "http://hotel-hub.local" + invoiceUrl;

        String emailBody = String.format("<h1>Booking Confirmed</h1><p>Dear %s,</p><p>Your booking for room %s from %s to %s is confirmed.</p><p>Please find your official receipt attached to this email.</p><p><a href=\"%s\">Download Receipt Locally (Internal Network Only)</a></p>",
                guest.getFirstName(), booking.getRoomNumber(), booking.getCheckInDate(), booking.getCheckOutDate(), fullInvoiceUrl);
        
        byte[] invoiceBytes = reportService.generateBookingInvoiceBytes(booking.getId());
        emailSender.sendWithAttachment(guest.getEmail(), "Your Booking Confirmation - Feni Hotel", emailBody, invoiceBytes, "Receipt-" + booking.getRoomNumber() + ".pdf");
    }

    @Transactional
    public void checkoutBooking(UUID bookingId) {
        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalStateException("Booking is not in CHECKED_IN state");
        }

        booking.setStatus(BookingStatus.CHECKED_OUT);
        bookingRepo.save(booking);

        roomRepo.findByRoomNumber(booking.getRoomNumber()).ifPresent(room -> {
            room.setStatus(RoomStatus.DIRTY);
            roomRepo.save(room);
        });

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            java.util.Map<String, Object> bookingMap = new java.util.HashMap<>();
            bookingMap.put("id", booking.getId());
            bookingMap.put("status", booking.getStatus().name());
            
            payloadMap.put("booking", bookingMap);
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("BOOKING_CHECKED_OUT")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }

    @Transactional
    public void changeRoom(UUID bookingId, ChangeRoomRequest request, UUID staffId) {
        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalStateException("Only CHECKED_IN bookings can be changed");
        }

        Room newRoom = roomRepo.findByRoomNumber(request.getNewRoomNumber())
                .orElseThrow(() -> new IllegalArgumentException("New room not found"));
        
        if (newRoom.getStatus() != RoomStatus.AVAILABLE) {
            throw new IllegalStateException("New room is not available");
        }

        // 1. Mark old room DIRTY (if it exists)
        roomRepo.findByRoomNumber(booking.getRoomNumber()).ifPresent(room -> {
            room.setStatus(RoomStatus.DIRTY);
            roomRepo.save(room);
        });

        // 2. Mark new room OCCUPIED
        newRoom.setStatus(RoomStatus.OCCUPIED);
        roomRepo.save(newRoom);

        // 3. Accounting - difference
        BigDecimal oldCost = booking.getTotalCost();
        BigDecimal newCost = request.getNewTotalCost();
        BigDecimal difference = newCost.subtract(oldCost);

        JournalEntry finalJournalEntry = null;

        if (difference.compareTo(BigDecimal.ZERO) != 0) {
            JournalEntry journalEntry = JournalEntry.builder()
                    .entryType(EntryType.BOOKING_PAYMENT)
                    .referenceId(booking.getId())
                    .processedBy(staffUser)
                    .build();

            String paymentAccount = switch (request.getPaymentMethod()) {
                case CASH -> "Cash";
                case POS -> "Card Payments";
                case TRANSFER -> "Bank Transfers";
            };

            if (difference.compareTo(BigDecimal.ZERO) > 0) {
                // Upgrade: Debit cash, Credit revenue
                journalEntry.addLine(JournalLine.builder().accountName(paymentAccount).debitAmount(difference).creditAmount(BigDecimal.ZERO).build());
                journalEntry.addLine(JournalLine.builder().accountName("Sales Revenue - ROOMS").debitAmount(BigDecimal.ZERO).creditAmount(difference).build());
            } else {
                // Downgrade: Debit revenue, Credit cash (absolute value)
                BigDecimal absDiff = difference.abs();
                journalEntry.addLine(JournalLine.builder().accountName("Sales Revenue - ROOMS").debitAmount(absDiff).creditAmount(BigDecimal.ZERO).build());
                journalEntry.addLine(JournalLine.builder().accountName(paymentAccount).debitAmount(BigDecimal.ZERO).creditAmount(absDiff).build());
            }

            BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalDebit.compareTo(totalCredit) != 0) {
                throw new UnbalancedJournalException("Journal entry is unbalanced during room change.");
            }
            finalJournalEntry = journalRepo.save(journalEntry);
        }

        // 4. Update booking
        booking.setRoomNumber(request.getNewRoomNumber());
        booking.setRoomType(request.getNewRoomType());
        booking.setTotalCost(newCost);
        bookingRepo.save(booking);

        // 5. Outbox Event
        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            java.util.Map<String, Object> bookingMap = new java.util.HashMap<>();
            bookingMap.put("id", booking.getId());
            bookingMap.put("totalCost", booking.getTotalCost());
            
            java.util.Map<String, Object> processedByMap = new java.util.HashMap<>();
            processedByMap.put("username", staffUser.getUsername());
            bookingMap.put("processedBy", processedByMap);
            
            payloadMap.put("booking", bookingMap);
            
            if (finalJournalEntry != null) {
                payloadMap.put("journalEntry", finalJournalEntry);
            }
            
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("BOOKING_UPDATED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }

    @Transactional
    public void extendBooking(UUID bookingId, ExtendBookingRequest request, UUID staffId) {
        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        if (booking.getStatus() != BookingStatus.CHECKED_IN && booking.getStatus() != BookingStatus.OVERDUE) {
            throw new IllegalStateException("Only CHECKED_IN or OVERDUE bookings can be extended");
        }

        if (!request.getNewCheckOutDate().isAfter(booking.getCheckOutDate())) {
            throw new IllegalArgumentException("New check-out date must be after current check-out date");
        }

        JournalEntry finalJournalEntry = null;

        if (request.getAdditionalCost().compareTo(BigDecimal.ZERO) > 0) {
            JournalEntry journalEntry = JournalEntry.builder()
                    .entryType(EntryType.BOOKING_PAYMENT)
                    .referenceId(booking.getId())
                    .processedBy(staffUser)
                    .build();

            String paymentAccount = switch (request.getPaymentMethod()) {
                case CASH -> "Cash";
                case POS -> "Card Payments";
                case TRANSFER -> "Bank Transfers";
            };

            journalEntry.addLine(JournalLine.builder().accountName(paymentAccount).debitAmount(request.getAdditionalCost()).creditAmount(BigDecimal.ZERO).build());
            journalEntry.addLine(JournalLine.builder().accountName("Sales Revenue - ROOMS").debitAmount(BigDecimal.ZERO).creditAmount(request.getAdditionalCost()).build());

            BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalDebit.compareTo(totalCredit) != 0) {
                throw new UnbalancedJournalException("Journal entry is unbalanced during booking extension.");
            }
            finalJournalEntry = journalRepo.save(journalEntry);
        }

        booking.setCheckOutDate(request.getNewCheckOutDate());
        booking.setTotalCost(booking.getTotalCost().add(request.getAdditionalCost()));
        booking.setStatus(BookingStatus.CHECKED_IN); // Remove OVERDUE status if it was set
        bookingRepo.save(booking);

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            java.util.Map<String, Object> bookingMap = new java.util.HashMap<>();
            bookingMap.put("id", booking.getId());
            bookingMap.put("totalCost", booking.getTotalCost());
            bookingMap.put("checkOutDate", booking.getCheckOutDate().toString());
            bookingMap.put("status", booking.getStatus().name());
            
            java.util.Map<String, Object> processedByMap = new java.util.HashMap<>();
            processedByMap.put("username", staffUser.getUsername());
            bookingMap.put("processedBy", processedByMap);
            
            payloadMap.put("booking", bookingMap);
            
            if (finalJournalEntry != null) {
                payloadMap.put("journalEntry", finalJournalEntry);
            }
            
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("BOOKING_UPDATED")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }

    @Transactional
    public void addDeposit(UUID bookingId, IncidentalDepositRequest request, UUID staffId) {
        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        if (booking.getStatus() != BookingStatus.CHECKED_IN && booking.getStatus() != BookingStatus.OVERDUE) {
            throw new IllegalStateException("Only CHECKED_IN or OVERDUE bookings can add deposits");
        }

        JournalEntry journalEntry = JournalEntry.builder()
                .entryType(EntryType.INCIDENTAL_DEPOSIT)
                .referenceId(booking.getId())
                .processedBy(staffUser)
                .build();

        String paymentAccount = switch (request.getPaymentMethod()) {
            case CASH -> "Cash";
            case POS -> "Card Payments";
            case TRANSFER -> "Bank Transfers";
        };

        journalEntry.addLine(JournalLine.builder().accountName(paymentAccount).debitAmount(request.getAmount()).creditAmount(BigDecimal.ZERO).build());
        journalEntry.addLine(JournalLine.builder().accountName("Customer Deposits").debitAmount(BigDecimal.ZERO).creditAmount(request.getAmount()).build());

        BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException("Journal entry is unbalanced during deposit.");
        }
        journalEntry = journalRepo.save(journalEntry);

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            java.util.Map<String, Object> bookingMap = new java.util.HashMap<>();
            bookingMap.put("id", booking.getId());
            payloadMap.put("booking", bookingMap);
            payloadMap.put("journalEntry", journalEntry);
            
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("INCIDENTAL_DEPOSIT")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }

    @Transactional
    public void refundDeposit(UUID bookingId, IncidentalDepositRequest request, UUID staffId) {
        StaffUser staffUser = staffRepo.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found"));

        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        JournalEntry journalEntry = JournalEntry.builder()
                .entryType(EntryType.INCIDENTAL_REFUND)
                .referenceId(booking.getId())
                .processedBy(staffUser)
                .build();

        String paymentAccount = switch (request.getPaymentMethod()) {
            case CASH -> "Cash";
            case POS -> "Card Payments";
            case TRANSFER -> "Bank Transfers";
        };

        journalEntry.addLine(JournalLine.builder().accountName("Customer Deposits").debitAmount(request.getAmount()).creditAmount(BigDecimal.ZERO).build());
        journalEntry.addLine(JournalLine.builder().accountName(paymentAccount).debitAmount(BigDecimal.ZERO).creditAmount(request.getAmount()).build());

        BigDecimal totalDebit = journalEntry.getLines().stream().map(JournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = journalEntry.getLines().stream().map(JournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new UnbalancedJournalException("Journal entry is unbalanced during deposit refund.");
        }
        journalEntry = journalRepo.save(journalEntry);

        try {
            java.util.Map<String, Object> payloadMap = new java.util.HashMap<>();
            java.util.Map<String, Object> bookingMap = new java.util.HashMap<>();
            bookingMap.put("id", booking.getId());
            payloadMap.put("booking", bookingMap);
            payloadMap.put("journalEntry", journalEntry);
            
            String payload = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .eventType("INCIDENTAL_REFUND")
                    .payload(payload)
                    .status(OutboxStatus.PENDING)
                    .build();
            outboxRepo.save(event);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize outbox event payload", e);
        }
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepo.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(UUID id) {
        Booking booking = bookingRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        return toResponse(booking);
    }

    private BookingResponse toResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .guestFirstName(booking.getGuest().getFirstName())
                .guestLastName(booking.getGuest().getLastName())
                .guestEmail(booking.getGuest().getEmail())
                .guestPhone(booking.getGuest().getPhone())
                .title(booking.getGuest().getTitle())
                .occupation(booking.getGuest().getOccupation())
                .nextOfKinPhone(booking.getGuest().getNextOfKinPhone())
                .address(booking.getGuest().getAddress())
                .lga(booking.getGuest().getLga())
                .nationality(booking.getGuest().getNationality())
                .stateOfOrigin(booking.getGuest().getStateOfOrigin())
                .passportNo(booking.getGuest().getPassportNo())
                .nin(booking.getGuest().getNin())
                .purposeOfVisit(booking.getGuest().getPurposeOfVisit())
                .arrivingFrom(booking.getGuest().getArrivingFrom())
                .goingTo(booking.getGuest().getGoingTo())
                .idScanUrl(booking.getGuest().getIdScanUrl())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .roomNumber(booking.getRoomNumber())
                .roomType(booking.getRoomType())
                .checkInTime(booking.getCheckInTime())
                .paymentMethod(booking.getPaymentMethod())
                .totalCost(booking.getTotalCost())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .processedByUsername(booking.getProcessedBy().getUsername())
                .priceOverrideReason(booking.getPriceOverrideReason())
                .build();
    }
}
