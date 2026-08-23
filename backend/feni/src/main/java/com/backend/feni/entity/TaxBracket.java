package com.backend.feni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tax_brackets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxBracket {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal rate; // e.g. 7.50 for 7.5%

    @Column(nullable = false)
    private String liabilityAccountName; // e.g. "Taxes Payable - VAT"

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
