package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PosSaleRequest {
    @Valid
    @NotEmpty
    private List<PosSaleItemRequest> items;

    @NotNull
    private PaymentMethod paymentMethod;

    // Optional printer IP to send the receipt to. If null, no receipt is printed.
    private String printerIp;
}
