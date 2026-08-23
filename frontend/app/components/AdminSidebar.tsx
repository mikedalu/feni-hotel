"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Settings, Package, FileText, Users, UserCircle, Menu, X } from "lucide-react";
import SignOutButton from "./SignOutButton";

export default function AdminSidebar({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 shrink-0">
        <h1 className="text-xl font-black text-blue-900 tracking-tight">Feni Hotel</h1>
        <button onClick={() => setIsOpen(true)} className="p-2 bg-gray-100 rounded-md text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tight">Feni Hotel</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Admin Dashboard</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <Link onClick={() => setIsOpen(false)} href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reports</p>
          </div>
          <Link onClick={() => setIsOpen(false)} href="/admin/reports/inventory" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors">
            <Package className="w-5 h-5" />
            Inventory Levels
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/admin/reports/pnl" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors">
            <FileText className="w-5 h-5" />
            P&L Statement
          </Link>
          <Link onClick={() => setIsOpen(false)} href="/admin/reports/staff-activity" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors">
            <Users className="w-5 h-5" />
            Staff Activity
          </Link>
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</p>
          </div>

          <Link onClick={() => setIsOpen(false)} href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t bg-gray-50 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {session?.user?.name || "Administrator"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
            <div className="mt-1">
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
