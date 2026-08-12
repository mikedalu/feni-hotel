package com.backend.feni.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

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

    @NotNull
    private BigDecimal totalCost;
}
