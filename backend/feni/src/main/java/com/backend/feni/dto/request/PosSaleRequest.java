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

    @Valid
    private List<SplitTenderRequest> splitTenders;

    // Optional printer IP to send the receipt to. If null, no receipt is printed.
    private String printerIp;

    @NotNull(message = "Location is required for sale")
    private java.util.UUID locationId;

    @Data
    public static class SplitTenderRequest {
        @NotNull
        private PaymentMethod paymentMethod;

        @NotNull
        @jakarta.validation.constraints.DecimalMin(value = "0.01", message = "Tender amount must be greater than zero")
        private java.math.BigDecimal amount;

        private java.util.UUID smartPosTerminalId;
    }
}
