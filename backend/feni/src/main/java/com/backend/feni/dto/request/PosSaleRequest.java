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

    @Data
    public static class SplitTenderRequest {
        @NotNull
        private PaymentMethod paymentMethod;

        @NotNull
        private java.math.BigDecimal amount;

        private java.util.UUID smartPosTerminalId;
    }
}
