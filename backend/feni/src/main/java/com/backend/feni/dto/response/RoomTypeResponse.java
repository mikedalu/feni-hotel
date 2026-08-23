package com.backend.feni.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RoomTypeResponse {
    private UUID id;
    private String name;
    private BigDecimal basePrice;
    private Instant createdAt;
    private Instant updatedAt;
}
