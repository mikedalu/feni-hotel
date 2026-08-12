package com.backend.feni.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SelfCheckinConfirmRequest {

    @NotNull
    @Valid
    private BookingRequest bookingRequest;

    @NotBlank
    private String idScanBase64;
}
