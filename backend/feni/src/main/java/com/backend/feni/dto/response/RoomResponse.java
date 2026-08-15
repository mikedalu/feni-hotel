package com.backend.feni.dto.response;

import lombok.Builder;
import lombok.Data;
import com.backend.feni.entity.enums.RoomStatus;
import java.util.UUID;
import java.math.BigDecimal;

@Data
@Builder
public class RoomResponse {
    private UUID id;
    private String roomNumber;
    private String roomType;
    private RoomStatus status;
    private BigDecimal basePrice;
    private BigDecimal currentPrice;
    private boolean active;
}
