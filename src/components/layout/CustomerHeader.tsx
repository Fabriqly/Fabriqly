'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, MessageCircle, Bell, User, LogOut, ChevronDown, Settings, Package, AlertTriangle, LayoutDashboard } from 'lucide-react';
import { CartButton } from '@/components/cart/CartButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signOut, useSession } from 'next-auth/react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import LogoName from '@/../public/LogoName.png';

interface CustomerHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    photoURL?: string | null;
  } | null;
}

export function CustomerHeader({ user }: CustomerHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = () => {
    // Check if user is on dashboard or is a business user
    const isOnDashboard = pathname?.startsWith('/dashboard');
    const isBusinessUser = session?.user?.role === 'business_owner' || session?.user?.role === 'designer';
    
    // Redirect business users to business login when signing out from dashboard
    const redirectUrl = (isOnDashboard && isBusinessUser) ? '/business/login' : '/login';
    signOut({ callbackUrl: redirectUrl });
  };

  // Sync search query with URL params when on search page
  useEffect(() => {
    if (pathname === '/search') {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get('q') || params.get('query') || '';
      if (queryParam) {
        setSearchQuery(queryParam);
      }
    }
  }, [pathname]);

  // Fetch profile photoURL if user is logged in
  useEffect(() => {
    if (user && session?.user?.id) {
      fetch('/api/users/profile')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.photoURL) {
            setProfilePhotoURL(data.data.photoURL);
          }
        })
        .catch(err => {
          console.error('Error fetching profile photo:', err);
        });
    }
  }, [user, session?.user?.id]);

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
        {/* Row 1: Logo and Icons (Mobile) / Full Layout (Desktop) */}
        <div className="flex items-center justify-between h-16 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image src={LogoName} alt="Fabriqly" className="h-8 w-auto" priority />
            </Link>
          </div>

          {/* Search Bar - Desktop Only */}
          <div className="hidden sm:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
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
          <div className="flex items-center gap-2 sm:gap-4">
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
            <NotificationBell />

            {/* User Profile / Login */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors"
                >
                  {(profilePhotoURL || user.image || user.photoURL) ? (
                    <img
                      src={profilePhotoURL || user.image || user.photoURL || ''}
                      alt={user.name || 'User'}
                      className="w-6 h-6 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:block text-white text-sm font-medium">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className={`hidden sm:block w-4 h-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center space-x-3">
                      {(profilePhotoURL || user.image || user.photoURL) ? (
                        <img
                          src={profilePhotoURL || user.image || user.photoURL || ''}
                          alt={user.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/cart"
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-3" />
                      My Cart
                    </Link>
                    <Link
                      href="/orders"
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Package className="w-4 h-4 mr-3" />
                      My Orders
                    </Link>
                    <Link
                      href="/my-customizations"
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <MessageCircle className="w-4 h-4 mr-3" />
                      My Customizations
                    </Link>
                    <Link
                      href="/disputes"
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-3" />
                      My Disputes
                    </Link>
                    <Link
                      href="/notifications"
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Bell className="w-4 h-4 mr-3" />
                      Notifications
                    </Link>
                    {(session?.user?.role === 'business_owner' || session?.user?.role === 'designer') && (
                      <Link
                        href="/dashboard"
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      My Profile
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

        {/* Row 2: Search Bar (Mobile Only) */}
        <div className="sm:hidden mt-2 pb-3">
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

        {/* Navigation Tabs */}
        <div className="border-t border-white/20">
          <nav className="flex overflow-x-auto no-scrollbar whitespace-nowrap space-x-8 py-3 pr-4 sm:pr-0">
            <Link
              href="/explore"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/explore' 
                  ? 'text-white border-b-2 border-white/80' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Explore
            </Link>
            <Link
              href="/explore/merchandise"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/explore/merchandise' 
                  ? 'text-white border-b-2 border-white/80' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Merchandise
            </Link>
            <Link
              href="/explore/designs"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith('/explore/designs')
                  ? 'text-white border-b-2 border-white/80' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Designs
            </Link>
            <Link
              href="/explore/graphics-services"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/explore/graphics-services' 
                  ? 'text-white border-b-2 border-white/80' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Graphics Services
            </Link>
            <Link
              href="/explore/designers"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith('/explore/designers')
                  ? 'text-white border-b-2 border-white/80' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Designers
            </Link>
            <Link
              href="/explore/shops"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.startsWith('/explore/shops') || pathname === '/shops'
                  ? 'text-white border-b-2 border-white/80' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Shops
            </Link>
          </nav>
        </div>
      </div>

      {/* Custom scrollbar hide styles for navigation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </header>
  );
}

export default CustomerHeader;
