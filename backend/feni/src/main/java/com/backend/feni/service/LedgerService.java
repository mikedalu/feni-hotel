package com.backend.feni.service;

import com.backend.feni.dto.response.LedgerResponse;
import com.backend.feni.entity.JournalEntry;
import com.backend.feni.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final JournalEntryRepository journalEntryRepository;

    @Transactional(readOnly = true)
    public List<LedgerResponse> getLedgerEntries(String accountName, Instant startDate, Instant endDate) {
        if (startDate == null) {
            startDate = Instant.ofEpochMilli(0);
        }
        if (endDate == null) {
            endDate = Instant.now();
        }
        
        List<JournalEntry> entries = journalEntryRepository.searchLedger(
                accountName == null || accountName.trim().isEmpty() ? "" : accountName.trim(), 
                startDate, 
                endDate
        );

        return entries.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private LedgerResponse mapToResponse(JournalEntry entry) {
        return LedgerResponse.builder()
                .id(entry.getId())
                .entryType(entry.getEntryType())
                .referenceId(entry.getReferenceId())
                .processedByUsername(entry.getProcessedBy() != null ? entry.getProcessedBy().getUsername() : null)
                .createdAt(entry.getCreatedAt())
                .lines(entry.getLines().stream().map(line -> LedgerResponse.LedgerLineResponse.builder()
                        .id(line.getId())
                        .accountName(line.getAccountName())
                        .debitAmount(line.getDebitAmount())
                        .creditAmount(line.getCreditAmount())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
