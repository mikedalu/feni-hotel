package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;

@Data
public class ExtendBookingRequest {

    @NotNull(message = "newCheckOutDate is required")
    @Future(message = "newCheckOutDate must be in the future")
    private LocalDate newCheckOutDate;

    @NotNull(message = "additionalCost is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "additionalCost must be zero or positive")
    private BigDecimal additionalCost;

    @Valid
    private List<SplitTenderRequest> splitTenders;

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
