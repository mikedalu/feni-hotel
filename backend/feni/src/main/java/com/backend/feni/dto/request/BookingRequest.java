package com.backend.feni.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.backend.feni.entity.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

@Data
public class BookingRequest {

    @NotBlank
    private String guestFirstName;

    @NotBlank
    private String guestLastName;

    @Email
    @NotBlank
    private String guestEmail;

    @NotBlank
    private String guestPhone;

    @NotNull
    @FutureOrPresent
    private LocalDate checkInDate;

    @NotNull
    @Future
    private LocalDate checkOutDate;

    @NotBlank
    private String roomNumber;

    @NotBlank
    private String roomType;

    private String checkInTime;

    @Valid
    private List<SplitTenderRequest> splitTenders;

    @NotNull
    private BigDecimal totalCost;

    // Optional fields from Guest form
    private String title;
    private String occupation;
    private String nextOfKinPhone;
    private String address;
    private String lga;
    private String nationality;
    private String stateOfOrigin;
    private String passportNo;
    private String nin;
    private String purposeOfVisit;
    private String arrivingFrom;
    private String goingTo;

    private String overrideReason;

    private String printerIp;

    @Data
    public static class SplitTenderRequest {
        @NotNull
        private PaymentMethod paymentMethod;

        @NotNull
        @jakarta.validation.constraints.DecimalMin(value = "0.01", message = "Tender amount must be greater than zero")
        private BigDecimal amount;

        private java.util.UUID smartPosTerminalId;
    }
}
