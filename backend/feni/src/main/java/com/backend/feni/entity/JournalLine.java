package com.backend.feni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "journal_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalLine {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    // Account name (e.g., 'Cash', 'Sales Revenue', 'Inventory Asset', 'Cost of Goods Sold', 'Accounts Payable')
    @Column(nullable = false)
    private String accountName;

    @Column(precision = 10, scale = 2)
    private BigDecimal debitAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal creditAmount;
}
