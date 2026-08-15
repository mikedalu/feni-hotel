package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.RoomStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoomStatusUpdateRequest {
    @NotNull(message = "Room status is required")
    private RoomStatus status;
}
