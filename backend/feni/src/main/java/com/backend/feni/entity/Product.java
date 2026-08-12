package com.backend.feni.entity;

import com.backend.feni.entity.enums.ProductType;
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

    public boolean hasManufacturerBarcode() {
        return manufacturerBarcode != null && !manufacturerBarcode.trim().isEmpty();
    }
}
