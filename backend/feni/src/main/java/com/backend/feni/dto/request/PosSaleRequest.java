package com.backend.feni.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PosSaleRequest {
    @NotEmpty
    private List<PosSaleItemRequest> items;

    // Optional printer IP to send the receipt to. If null, no receipt is printed.
    private String printerIp;
}
