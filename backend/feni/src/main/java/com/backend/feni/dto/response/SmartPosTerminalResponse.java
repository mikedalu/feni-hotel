package com.backend.feni.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SmartPosTerminalResponse {
    private UUID id;
    private String name;
    private String serialNumber;
    private Boolean isActive;
}
