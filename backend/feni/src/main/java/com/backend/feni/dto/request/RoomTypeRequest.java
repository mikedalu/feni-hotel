package com.backend.feni.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoomTypeRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Base price is required")
    @Min(value = 0, message = "Base price must be greater than or equal to 0")
    private BigDecimal basePrice;
}
