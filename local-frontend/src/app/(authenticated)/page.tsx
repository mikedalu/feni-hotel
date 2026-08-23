'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  QrCodeIcon, 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon, 
  ChartPieIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  KeyIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function Home() {
  const { user } = useAuth();
  const role = user?.role;
  const { data: stats, isLoading } = useDashboardStats();
  const [breakdownPeriod, setBreakdownPeriod] = useState<'today' | 'week'>('today');

  const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(role || '');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, {user?.username}</h2>
          <p className="text-sm text-gray-500 mt-1">Here is what&apos;s happening at Feni Hotel today.</p>
        </div>
      </div>

      {isAdminOrManager && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? '...' : `₦ ${(stats?.totalRevenue ?? 0).toLocaleString()}`}
                </h3>
                <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${!stats || stats.revenuePercentageChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <ArrowTrendingUpIcon className={`h-3 w-3 ${stats && stats.revenuePercentageChange < 0 ? 'rotate-180 transform' : ''}`} /> 
                  {isLoading ? '...' : `${stats?.revenuePercentageChange && stats.revenuePercentageChange > 0 ? '+' : ''}${(stats?.revenuePercentageChange ?? 0).toFixed(1)}% this week`}
                  <span className="text-gray-400 font-normal ml-1 cursor-help" title="Calculated by comparing revenue from the last 7 days against the preceding 7 days.">(?)</span>
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Guests</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? '...' : stats?.activeGuests ?? 0}
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                  <UserGroupIcon className="h-3 w-3" /> Currently Checked-in
                </p>
              </div>
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? '...' : `${(stats?.occupancyRate ?? 0).toFixed(1)}%`}
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1">
                  <KeyIcon className="h-3 w-3" /> Today
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <KeyIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Check-ins</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {isLoading ? '...' : stats?.pendingCheckins ?? 0}
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-1">Expected today</p>
              </div>
              <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <QrCodeIcon className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Detailed Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Revenue Breakdown</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setBreakdownPeriod('today')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${breakdownPeriod === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setBreakdownPeriod('week')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${breakdownPeriod === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Last 7 Days
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Rooms</span>
                  <span className="text-base font-bold text-gray-900">₦ {isLoading ? '...' : (breakdownPeriod === 'today' ? stats?.todayBreakdown?.roomsRevenue : stats?.weeklyBreakdown?.roomsRevenue)?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Bar</span>
                  <span className="text-base font-bold text-gray-900">₦ {isLoading ? '...' : (breakdownPeriod === 'today' ? stats?.todayBreakdown?.barRevenue : stats?.weeklyBreakdown?.barRevenue)?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Kitchen</span>
                  <span className="text-base font-bold text-gray-900">₦ {isLoading ? '...' : (breakdownPeriod === 'today' ? stats?.todayBreakdown?.kitchenRevenue : stats?.weeklyBreakdown?.kitchenRevenue)?.toLocaleString()}</span>
                </div>
                {((breakdownPeriod === 'today' ? stats?.todayBreakdown?.otherRevenue : stats?.weeklyBreakdown?.otherRevenue) ?? 0) > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Other</span>
                    <span className="text-base font-bold text-gray-900">₦ {(breakdownPeriod === 'today' ? stats?.todayBreakdown?.otherRevenue : stats?.weeklyBreakdown?.otherRevenue)?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 mt-4 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-indigo-600">₦ {isLoading ? '...' : (breakdownPeriod === 'today' ? stats?.todayBreakdown?.totalRevenue : stats?.weeklyBreakdown?.totalRevenue)?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Inventory Levels */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory Levels</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border border-gray-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '...' : stats?.totalInventoryItems}</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="p-4 border border-gray-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Inventory Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₦ {isLoading ? '...' : stats?.inventoryValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className={`p-4 border rounded-xl flex items-center justify-between ${(stats?.lowStockAlerts ?? 0) > 0 ? 'border-rose-200 bg-rose-50' : 'border-gray-100'}`}>
                  <div>
                    <p className={`text-sm font-medium ${(stats?.lowStockAlerts ?? 0) > 0 ? 'text-rose-600' : 'text-gray-500'}`}>Low Stock Alerts</p>
                    <p className={`text-2xl font-bold mt-1 ${(stats?.lowStockAlerts ?? 0) > 0 ? 'text-rose-700' : 'text-gray-900'}`}>{isLoading ? '...' : stats?.lowStockAlerts}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${(stats?.lowStockAlerts ?? 0) > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                    <ChartPieIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (7 Days)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.revenueTrend || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} tickFormatter={(val) => `₦${val/1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: unknown) => [`₦ ${Number(value || 0).toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Occupancy Rate (%)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.occupancyTrend || []} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} domain={[0, 100]} />
                    <RechartsTooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: unknown) => [`${Number(value || 0)}%`, 'Occupancy']}
                    />
                    <Bar dataKey="occupancy" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions (For all roles) */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/reception/checkin" className="group flex flex-col items-center text-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300">
            <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <QrCodeIcon className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Self Check-In</h3>
            <p className="text-xs text-gray-500">Generate QR code for guest clipboard session</p>
          </Link>

          <Link href="/pos" className="group flex flex-col items-center text-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-300">
            <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <ShoppingBagIcon className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">POS Sale</h3>
            <p className="text-xs text-gray-500">New touch or barcode sale</p>
          </Link>

          <Link href="/inventory" className="group flex flex-col items-center text-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-300">
            <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <ClipboardDocumentListIcon className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Inventory Intake</h3>
            <p className="text-xs text-gray-500">Scan & print barcode labels</p>
          </Link>

          <Link href="/reports/shift-summary" className="group flex flex-col items-center text-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-rose-200 hover:bg-rose-50/50 transition-all duration-300">
            <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
              <ChartPieIcon className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Shift Summary</h3>
            <p className="text-xs text-gray-500">View daily occupancy & stats</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
