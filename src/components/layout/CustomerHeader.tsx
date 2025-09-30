'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ShoppingCart, MessageCircle, Bell, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { CartButton } from '@/components/cart/CartButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signOut } from 'next-auth/react';
import LogoName from '@/../public/LogoName.png';

interface CustomerHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function CustomerHeader({ user }: CustomerHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image src={LogoName} alt="Fabriqly" className="h-8 w-auto" priority />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products, designs, or shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/90 backdrop-blur-sm border-white/20 rounded-lg focus:bg-white focus:ring-2 focus:ring-white/50"
                />
              </div>
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Shopping Cart */}
            <CartButton />

            {/* Messages */}
            <button className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <MessageCircle className="w-5 h-5" />
              {/* Message Badge */}
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Edit Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-white/20">
          <nav className="flex space-x-8 py-3">
            <Link
              href="/explore"
              className="text-white/90 hover:text-white px-3 py-2 text-sm font-medium border-b-2 border-white/80"
            >
              Explore
            </Link>
            <Link
              href="/shops"
              className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Shops
            </Link>
            <Link
              href="/clothing"
              className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Clothing
            </Link>
            <Link
              href="/merchandise"
              className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Merchandise
            </Link>
            <Link
              href="/graphics-services"
              className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Graphics Services
            </Link>
            <Link
              href="/other-services"
              className="text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Other Services
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default CustomerHeader;
