'use client';

import React from 'react';
import { ChartBarIcon, BuildingStorefrontIcon, UsersIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function CloudAdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SenForge Cloud Admin</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full font-semibold border border-indigo-100">
              Global HQ
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Executive Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <BuildingStorefrontIcon className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Active Facilities</h3>
            <p className="text-3xl font-bold text-gray-900">4</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Today's Check-ins</h3>
            <p className="text-3xl font-bold text-gray-900">128</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Gross Revenue (MTD)</h3>
            <p className="text-3xl font-bold text-gray-900">$245.8k</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <UsersIcon className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Active Staff</h3>
            <p className="text-3xl font-bold text-gray-900">42</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
             <p className="text-gray-400 font-medium text-center">Revenue Charts (Recharts)<br/>Will be implemented here</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
             <p className="text-gray-400 font-medium text-center">P&L Report Generator<br/>Will be implemented here</p>
          </div>
        </div>
      </main>
    </div>
  );
}
