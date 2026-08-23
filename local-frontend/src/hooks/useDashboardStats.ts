import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface DailyRevenue {
  name: string;
  revenue: number;
}

export interface DailyOccupancy {
  name: string;
  occupancy: number;
}

export interface DashboardStats {
  totalRevenue: number;
  revenuePercentageChange: number;
  activeGuests: number;
  occupancyRate: number;
  occupancyPercentageChange: number;
  pendingCheckins: number;
  revenueTrend: DailyRevenue[];
  occupancyTrend: DailyOccupancy[];
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiClient('/api/proxy/reports/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
