package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class IncidentalDepositRequest {

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "paymentMethod is required")
    private PaymentMethod paymentMethod;

    private java.util.UUID smartPosTerminalId;
}
