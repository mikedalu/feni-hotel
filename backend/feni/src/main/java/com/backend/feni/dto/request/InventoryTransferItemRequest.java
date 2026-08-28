package com.backend.feni.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InventoryTransferItemRequest {
    @NotBlank
    private String internalSku;

    @Min(1)
    private int quantity;
}
