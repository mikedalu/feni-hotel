package com.backend.feni.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SmartPosTerminalRequest {

    @NotBlank(message = "Terminal name is required")
    private String name;

    private String serialNumber;

    private Boolean isActive = true;
}
