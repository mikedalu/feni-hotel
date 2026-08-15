import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, Home, ShoppingCart, KeyRound, 
  Users, Bed, Tag, SprayCan, Package, 
  ClipboardList, LogOut
} from 'lucide-react';

export default function TopNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const role = user.role;

  // Build navigation links dynamically based on role
  const getLinks = () => {
    const navLinks = [
      { href: '/', label: 'Dashboard', icon: Home }
    ];

    if (['ADMIN', 'BARTENDER', 'FRONT_DESK'].includes(role)) {
      navLinks.push({ href: '/pos', label: 'POS', icon: ShoppingCart });
    }

    if (['ADMIN', 'FRONT_DESK'].includes(role)) {
      navLinks.push({ href: '/reception', label: 'Check-In', icon: KeyRound });
    }

    if (role === 'ADMIN') {
      navLinks.push({ href: '/admin/staff', label: 'Staff', icon: Users });
      navLinks.push({ href: '/admin/rooms', label: 'Rooms', icon: Bed });
      navLinks.push({ href: '/admin/promos', label: 'Promos', icon: Tag });
    }

    if (['ADMIN', 'FRONT_DESK', 'HOUSEKEEPER'].includes(role)) {
      navLinks.push({ href: '/housekeeping', label: 'Housekeeping', icon: SprayCan });
    }

    if (['ADMIN', 'INVENTORY_MANAGER'].includes(role)) {
      navLinks.push({ href: '/admin/products', label: 'Products', icon: Package });
      navLinks.push({ href: '/inventory', label: 'Inventory', icon: ClipboardList });
    }

    return navLinks;
  };

  const links = getLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-4 md:px-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-6 md:gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-blue-900">Feni Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* User Profile */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex flex-col items-end text-sm">
              <span className="font-semibold text-gray-900">{user.username}</span>
              <span className="text-xs text-gray-500">{user.role}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button 
              onClick={logout} 
              className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-4">
          <nav className="flex flex-col gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{user.username}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
