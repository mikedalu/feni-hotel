package com.backend.feni.dto.response;

import lombok.Data;
import lombok.Builder;
import com.backend.feni.entity.enums.PaymentMethod;
import com.backend.feni.entity.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class BookingResponse {
    private UUID id;
    private String guestFirstName;
    private String guestLastName;
    private String guestEmail;
    private String guestPhone;
    
    private String title;
    private String occupation;
    private String nextOfKinPhone;
    private String address;
    private String lga;
    private String nationality;
    private String stateOfOrigin;
    private String passportNo;
    private String purposeOfVisit;
    private String arrivingFrom;
    private String goingTo;
    
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String roomNumber;
    private String roomType;
    private String checkInTime;
    
    private PaymentMethod paymentMethod;
    private BigDecimal totalCost;
    private BookingStatus status;
    private Instant createdAt;
    
    private String processedByUsername;
    private String priceOverrideReason;
}
