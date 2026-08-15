'use client';

import React from 'react';
import TopNav from '@/components/TopNav';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <TopNav />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
