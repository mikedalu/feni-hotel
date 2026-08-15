package com.backend.feni.dto.response;

import com.backend.feni.entity.enums.ProductType;
import com.backend.feni.entity.enums.RevenueCenter;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID id;
    private String name;
    private ProductType type;
    private RevenueCenter revenueCenter;
    private String manufacturerBarcode;
    private String internalSku;
    private Integer stockQty;
    private Integer lowStockThreshold;
    private BigDecimal price;
    private BigDecimal unitCost;
}
