package com.backend.feni.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InventoryIntakeItemRequest {
    @NotBlank
    private String internalSku;

    @Min(1)
    private int quantity;

    private boolean isBulkIntake;
    
    @jakarta.validation.constraints.DecimalMin(value = "0.00", message = "Total cost cannot be negative")
    private java.math.BigDecimal totalCost;
}
