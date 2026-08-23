package com.backend.feni.dto.response;

import com.backend.feni.entity.enums.EntryType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class LedgerResponse {
    private UUID id;
    private EntryType entryType;
    private UUID referenceId;
    private String processedByUsername;
    private Instant createdAt;
    private List<LedgerLineResponse> lines;

    @Data
    @Builder
    public static class LedgerLineResponse {
        private UUID id;
        private String accountName;
        private BigDecimal debitAmount;
        private BigDecimal creditAmount;
    }
}
