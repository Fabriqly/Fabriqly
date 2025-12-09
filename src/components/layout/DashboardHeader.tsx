'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, User } from 'lucide-react';
import LogoName from '@/../public/LogoName.png';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export function DashboardHeader({ user, onMenuClick, showMobileMenu = false }: DashboardHeaderProps) {
  const handleMenuClick = () => {
    // Dispatch custom event to toggle sidebar
    window.dispatchEvent(new CustomEvent('toggleDashboardSidebar'));
    // Also call the optional onMenuClick if provided
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 shadow-lg z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Left side - Menu and Logo */}
          <div className="flex items-center">
            {/* Mobile menu button - Always show on mobile */}
            <button
              type="button"
              className="mr-4 p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 lg:hidden"
              onClick={handleMenuClick}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo */}
            <div className="flex items-center">
              <Image src={LogoName} alt="Fabriqly" className="h-10 w-auto" priority />
            </div>
            
            {/* Dashboard Text */}
            <div className="ml-6 hidden sm:block">
              <h1 className="text-xl font-bold text-white">
                {user?.role === 'designer' ? 'Designer Dashboard' : 
                 user?.role === 'admin' ? 'Admin Dashboard' : 'Business Dashboard'}
              </h1>
            </div>
          </div>

          {/* Right side - User info */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-white/80">{user?.email || 'Administrator'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
