package com.backend.feni.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PromoRequest {

    @NotBlank(message = "Promo name is required")
    private String name;

    @NotNull(message = "Discount percentage is required")
    @DecimalMin(value = "0.01", message = "Discount must be greater than 0")
    @DecimalMax(value = "100.00", message = "Discount cannot exceed 100")
    private BigDecimal discountPercentage;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotBlank(message = "Target room type is required")
    private String targetRoomType;

    private boolean isActive = true;
}
