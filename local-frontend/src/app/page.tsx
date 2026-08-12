'use client';

import React from 'react';
import Link from 'next/link';
import { QrCodeIcon, ShoppingBagIcon, ClipboardDocumentListIcon, ChartPieIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Feni Local Hub</h1>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              System Online
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Front Desk</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/reception/checkin" className="group flex flex-col items-center text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300">
            <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <QrCodeIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Self Check-In</h3>
            <p className="text-sm text-gray-500">Generate QR code for guest clipboard session</p>
          </Link>

          <button className="group flex flex-col items-center text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 cursor-not-allowed opacity-70">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBagIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">POS Sale</h3>
            <p className="text-sm text-gray-500">New touch or barcode sale (Coming Soon)</p>
          </button>

          <button className="group flex flex-col items-center text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-amber-300 hover:bg-amber-50 transition-all duration-300 cursor-not-allowed opacity-70">
            <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <ClipboardDocumentListIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Intake</h3>
            <p className="text-sm text-gray-500">Scan & print barcode labels (Coming Soon)</p>
          </button>

          <button className="group flex flex-col items-center text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-rose-300 hover:bg-rose-50 transition-all duration-300 cursor-not-allowed opacity-70">
            <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
              <ChartPieIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Shift Summary</h3>
            <p className="text-sm text-gray-500">View daily occupancy & stats (Coming Soon)</p>
          </button>
        </div>
      </main>
    </div>
  );
}
