'use client';

import React from 'react';
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

const mockRevenueData = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

const mockOccupancyData = [
  { name: 'Mon', occupancy: 65 },
  { name: 'Tue', occupancy: 59 },
  { name: 'Wed', occupancy: 80 },
  { name: 'Thu', occupancy: 81 },
  { name: 'Fri', occupancy: 56 },
  { name: 'Sat', occupancy: 55 },
  { name: 'Sun', occupancy: 40 },
];

export default function Home() {
  const { user } = useAuth();
  const role = user?.role;

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
                <h3 className="text-2xl font-bold text-gray-900 mt-1">₦ 1,432,000</h3>
                <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +14.5% this week
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Guests</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">124</h3>
                <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +4 this week
                </p>
              </div>
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <UserGroupIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">82%</h3>
                <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <ArrowTrendingUpIcon className="h-3 w-3" /> +2.1% today
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <KeyIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Check-ins</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">12</h3>
                <p className="text-xs font-medium text-gray-500 mt-1">Expected today</p>
              </div>
              <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <QrCodeIcon className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (7 Days)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueData}>
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
                  <BarChart data={mockOccupancyData} barSize={32}>
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

          <Link href="/inventory/intake" className="group flex flex-col items-center text-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-300">
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
