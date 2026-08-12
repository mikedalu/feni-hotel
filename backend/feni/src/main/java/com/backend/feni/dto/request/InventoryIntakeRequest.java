package com.backend.feni.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class InventoryIntakeRequest {
    @NotEmpty
    private List<InventoryIntakeItemRequest> items;

    // Optional printer IP to print internal SKU labels to
    private String printerIp;
}
