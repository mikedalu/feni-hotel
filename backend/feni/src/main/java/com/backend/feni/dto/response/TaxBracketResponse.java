package com.backend.feni.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TaxBracketResponse {
    private UUID id;
    private String name;
    private BigDecimal rate;
    private String liabilityAccountName;
    private Boolean isActive;
}
