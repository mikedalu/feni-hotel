package com.backend.feni.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private BigDecimal totalRevenue;
    private double revenuePercentageChange;
    private int activeGuests;
    private double occupancyRate;
    private double occupancyPercentageChange;
    private int pendingCheckins;
    private List<DailyRevenue> revenueTrend;
    private List<DailyOccupancy> occupancyTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenue {
        private String name;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyOccupancy {
        private String name;
        private double occupancy;
    }
}
