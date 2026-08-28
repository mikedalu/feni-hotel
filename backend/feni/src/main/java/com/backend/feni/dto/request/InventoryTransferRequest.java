package com.backend.feni.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class InventoryTransferRequest {
    @NotNull(message = "Source location is required")
    private UUID sourceLocationId;

    @NotNull(message = "Destination location is required")
    private UUID destinationLocationId;

    @Valid
    @NotEmpty(message = "Items list cannot be empty")
    private List<InventoryTransferItemRequest> items;
}
