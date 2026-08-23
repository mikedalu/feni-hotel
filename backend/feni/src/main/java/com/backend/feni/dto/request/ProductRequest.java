package com.backend.feni.dto.request;

import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.entity.enums.RevenueCenter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    @NotNull(message = "Product type is required")
    private ProductType type;

    @NotNull(message = "Revenue center is required")
    private RevenueCenter revenueCenter;

    private String manufacturerBarcode;

    @NotBlank(message = "Internal SKU is required")
    private String internalSku;

    @PositiveOrZero(message = "Stock quantity must be zero or positive")
    private Integer stockQty;

    @PositiveOrZero(message = "Low stock threshold must be zero or positive")
    private Integer lowStockThreshold;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be zero or positive")
    private BigDecimal price;

    @NotNull(message = "Unit cost is required")
    @PositiveOrZero(message = "Unit cost must be zero or positive")
    private BigDecimal unitCost;

    private String baseUnit;
    private String bulkUnit;
    
    @PositiveOrZero(message = "Conversion ratio must be positive")
    private Integer conversionRatio;
}
