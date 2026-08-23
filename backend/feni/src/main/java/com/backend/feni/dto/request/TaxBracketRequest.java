package com.backend.feni.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TaxBracketRequest {

    @NotBlank(message = "Tax bracket name is required")
    private String name;

    @NotNull(message = "Rate is required")
    @Positive(message = "Rate must be positive")
    private BigDecimal rate;

    @NotBlank(message = "Liability account name is required")
    private String liabilityAccountName;

    private Boolean isActive = true;
}
