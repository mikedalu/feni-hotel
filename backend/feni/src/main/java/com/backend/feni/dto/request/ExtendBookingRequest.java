package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExtendBookingRequest {

    @NotNull(message = "newCheckOutDate is required")
    @Future(message = "newCheckOutDate must be in the future")
    private LocalDate newCheckOutDate;

    @NotNull(message = "additionalCost is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "additionalCost must be zero or positive")
    private BigDecimal additionalCost;

    @NotNull(message = "paymentMethod is required")
    private PaymentMethod paymentMethod;
}
