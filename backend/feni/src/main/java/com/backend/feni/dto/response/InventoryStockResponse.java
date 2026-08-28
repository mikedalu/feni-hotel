package com.backend.feni.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class InventoryStockResponse {
    private UUID id;
    private UUID locationId;
    private String locationName;
    private Integer quantity;
}
