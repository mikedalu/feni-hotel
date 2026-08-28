package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

@Data
public class ChangeRoomRequest {

    @NotBlank(message = "newRoomNumber is required")
    private String newRoomNumber;

    @NotBlank(message = "newRoomType is required")
    private String newRoomType;

    @NotNull(message = "newTotalCost is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "newTotalCost must be positive")
    private BigDecimal newTotalCost;

    @Valid
    private List<SplitTenderRequest> splitTenders; // Optional, only if newTotalCost > oldCost

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
