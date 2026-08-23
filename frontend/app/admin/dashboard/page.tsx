"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Activity, Info } from "lucide-react";

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [data, setData] = useState<{ summary: any; chartData: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/reports/pnl?period=${period}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Hotel Overview</h2>
          <p className="text-gray-500 mt-1">Real-time financial and operational metrics for Feni Hotel.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setPeriod('today')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setPeriod('week')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setPeriod('month')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${period === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <div className="group relative flex items-center gap-1.5 cursor-help">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 font-medium">
                Total money collected from all sales and room bookings.
                <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              ₦{data.summary.totalRevenue.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <div className="group relative flex items-center gap-1.5 cursor-help">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 font-medium">
                Total number of successful room reservations during the period.
                <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {data.summary.totalBookings.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <div className="group relative flex items-center gap-1.5 cursor-help">
              <p className="text-sm font-medium text-gray-500">Gross Profit</p>
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 font-medium">
                Revenue minus the Cost of Goods Sold (COGS).
                <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              ₦{data.summary.grossProfit.toLocaleString()}
            </h3>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <div className="group relative flex items-center gap-1.5 cursor-help">
              <p className="text-sm font-medium text-gray-500">Avg. Margin</p>
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 font-medium">
                The percentage of revenue you keep as gross profit.
                <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {data.summary.totalRevenue > 0 
                ? Math.round((data.summary.grossProfit / data.summary.totalRevenue) * 100)
                : 0}%
            </h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {period !== 'today' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Revenue vs COGS {period === 'week' ? '(Last 7 Days)' : '(Last 30 Days)'}
          </h3>
        
        {data.chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            No transaction data available yet.
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`₦${value.toLocaleString()}`, undefined]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#2563EB" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="cogs" 
                  name="COGS" 
                  stroke="#F59E0B" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
