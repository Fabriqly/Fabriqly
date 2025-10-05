'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  DollarSign,
  User,
  Menu,
  X,
  Palette,
  Briefcase,
  Store
} from 'lucide-react';

const getNavigationItems = (userRole?: string | null) => {
  const baseItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      name: userRole === 'designer' ? 'Designs' : 'Products',
      href: userRole === 'designer' ? '/dashboard/designs' : '/dashboard/products',
      icon: userRole === 'designer' ? Palette : Package,
      description: userRole === 'designer' ? 'Manage your designs' : 'Manage your products'
    }
  ];

  // Add Designer Profile link only for designers
  if (userRole === 'designer') {
    baseItems.push({
      name: 'Designer Profile',
      href: '/dashboard/designer-profile',
      icon: Briefcase,
      description: 'Manage your designer profile'
    });
  }

  // Add Shop Profile link for business owners
  if (userRole === 'business_owner') {
    baseItems.push({
      name: 'Shop Profile',
      href: '/dashboard/shop-profile',
      icon: Store,
      description: 'Manage your shop profile'
    });
  }

  // Add remaining common items
  baseItems.push(
    {
      name: 'Orders',
      href: '/dashboard/orders',
      icon: ShoppingCart,
      description: 'View and manage orders'
    },
    {
      name: 'Finance',
      href: '/dashboard/finance',
      icon: DollarSign,
      description: 'Earnings and financial reports'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Edit your profile'
    }
  );

  return baseItems;
};

interface DashboardSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigationItems = getNavigationItems(user?.role);

  return (
    <>
      {/* Mobile sidebar button */}
      <div className="lg:hidden fixed top-24 left-4 z-40">
        <button
          type="button"
          className="p-2 rounded-md bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} style={{ top: '80px' }}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User info at bottom of mobile sidebar */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name || user?.email}</p>
                <p className="text-xs font-medium text-gray-500 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-full border-r border-gray-200 bg-white shadow-sm">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="flex-1 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={item.description}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User info at bottom of desktop sidebar */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name || user?.email}</p>
                  <p className="text-xs font-medium text-gray-500 capitalize">{user?.role || 'User'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardSidebar;
