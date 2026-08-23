package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ChangeRoomRequest {

    @NotBlank(message = "newRoomNumber is required")
    private String newRoomNumber;

    @NotBlank(message = "newRoomType is required")
    private String newRoomType;

    @NotNull(message = "newTotalCost is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "newTotalCost must be positive")
    private BigDecimal newTotalCost;

    @NotNull(message = "paymentMethod is required")
    private PaymentMethod paymentMethod;

    private java.util.UUID smartPosTerminalId;
}
