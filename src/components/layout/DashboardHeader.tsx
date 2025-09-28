'use client';

import React from 'react';
import Image from 'next/image';
import { Menu, LogOut, User } from 'lucide-react';
import LogoName from '@/../public/LogoName.png';
import { signOut } from 'next-auth/react';

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
  const handleSignOut = () => {
    // Redirect admins to login page, others to business login
    const redirectUrl = user?.role === 'admin' ? '/login' : '/business/login';
    signOut({ callbackUrl: redirectUrl });
  };

  return (
    <header className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            {showMobileMenu && (
              <button
                type="button"
                className="mr-4 p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 lg:hidden"
                onClick={onMenuClick}
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            
            {/* Logo */}
            <div className="flex items-center">
              <Image src={LogoName} alt="Fabriqly" className="h-10 w-auto" priority />
            </div>
            
            {/* Business Dashboard Text */}
            <div className="ml-6 hidden sm:block">
              <h1 className="text-xl font-bold text-white">Business Dashboard</h1>
            </div>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
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

            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-white/30 text-sm font-medium rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
