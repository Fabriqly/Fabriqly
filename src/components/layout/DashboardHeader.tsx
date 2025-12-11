'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, User, Compass } from 'lucide-react';
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
  variant?: 'default' | 'admin';
}

export function DashboardHeader({ user, onMenuClick, showMobileMenu = false, variant = 'default' }: DashboardHeaderProps) {
  const handleMenuClick = () => {
    // Dispatch custom event to toggle sidebar
    window.dispatchEvent(new CustomEvent('toggleDashboardSidebar'));
    // Also call the optional onMenuClick if provided
    if (onMenuClick) {
      onMenuClick();
    }
  };

  const isAdmin = variant === 'admin';
  const headerClasses = isAdmin
    ? 'fixed top-0 left-0 w-full h-20 z-50 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 shadow-lg'
    : 'fixed top-0 left-0 right-0 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 shadow-lg z-50';
  const containerHeight = 'h-20';
  const textColor = 'text-white';
  const hoverBg = 'hover:bg-white/10';
  const focusRing = 'focus:ring-white/20';
  const userAvatarBg = 'bg-white/20';
  const userTextColor = 'text-white';
  const userTextSecondary = 'text-white/80';

  return (
    <header className={headerClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`${containerHeight} flex items-center justify-between`}>
          {/* Left side - Menu and Logo */}
          <div className="flex items-center">
            {/* Mobile menu button - Always show on mobile */}
            <button
              type="button"
              className={`mr-4 p-2 rounded-md ${textColor} ${hoverBg} focus:outline-none focus:ring-2 ${focusRing} lg:hidden`}
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
              <h1 className={`text-xl font-bold ${textColor}`}>
                {user?.role === 'designer' ? 'Designer Dashboard' : 
                 user?.role === 'admin' ? 'Admin Dashboard' : 'Business Dashboard'}
              </h1>
            </div>
          </div>

          {/* Right side - User info */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* Explore Button */}
            <Link
              href="/explore"
              className={`flex items-center space-x-2 px-3 py-2 ${textColor} ${hoverBg} rounded-lg transition-colors`}
              aria-label="Go to Explore"
              title="Go to Explore"
            >
              <Compass className="w-5 h-5" />
              <span className="hidden sm:block text-sm font-medium">to explore</span>
            </Link>

            {/* User info */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center">
                <div className={`h-8 w-8 rounded-full ${userAvatarBg} flex items-center justify-center`}>
                  <User className={`h-4 w-4 ${textColor}`} />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${userTextColor}`}>{user?.name || 'Admin'}</p>
                  <p className={`text-xs ${userTextSecondary}`}>{user?.email || 'Administrator'}</p>
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
