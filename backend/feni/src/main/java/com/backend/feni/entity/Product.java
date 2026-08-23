package com.backend.feni.entity;

import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.entity.enums.RevenueCenter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RevenueCenter revenueCenter;

    // Only used for RAW_GOOD (manufacturer barcode, if any)
    @Column(unique = true)
    private String manufacturerBarcode;

    // The internal SKU generated/used by the facility
    @Column(unique = true, nullable = false)
    private String internalSku;

    // Current stock quantity, only meaningful for RAW_GOOD
    private Integer stockQty;

    // Threshold for low stock alerts
    private Integer lowStockThreshold;

    // Selling price
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // Estimated unit cost, used for COGS calculation
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost;

    // Unit of Measure (UoM) fields
    private String baseUnit; // e.g., "Bottle", "Portion"
    private String bulkUnit; // e.g., "Carton", "Crate"
    
    @Column(nullable = false, columnDefinition = "integer default 1")
    @Builder.Default
    private Integer conversionRatio = 1; // e.g., 24 (1 Carton = 24 Bottles)

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "product_tax_brackets",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "tax_bracket_id")
    )
    @Builder.Default
    private java.util.Set<TaxBracket> taxBrackets = new java.util.HashSet<>();

    public boolean hasManufacturerBarcode() {
        return manufacturerBarcode != null && !manufacturerBarcode.trim().isEmpty();
    }
}
