package com.backend.feni.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PosSaleItemRequest {
    @NotBlank
    private String skuOrBarcode; // Could be internal SKU or manufacturer barcode

    @Min(1)
    private int quantity;
}
