'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useRequireAdmin } from '@/hooks/useAdminAuth';
import { DashboardHeader } from '@/components/layout';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FolderOpen, 
  BarChart3, 
  Settings,
  X,
  LogOut,
  Palette,
  Activity,
  Shield,
  Store,
  MessageSquare,
  FileText,
  DollarSign,
  Tag,
  AlertTriangle,
  Database,
  ScrollText
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard/admin',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    name: 'Activities',
    href: '/dashboard/admin/activities',
    icon: Activity,
    description: 'System activity log'
  },
  {
    name: 'Categories',
    href: '/dashboard/admin/categories',
    icon: FolderOpen,
    description: 'Manage product categories'
  },
  {
    name: 'Colors',
    href: '/dashboard/admin/colors',
    icon: Palette,
    description: 'Manage product colors'
  },
  {
    name: 'Products',
    href: '/dashboard/admin/products',
    icon: Package,
    description: 'Manage all products'
  },
  {
    name: 'Shop Management',
    href: '/dashboard/admin/shops',
    icon: Store,
    description: 'Manage shop profiles'
  },
  {
    name: 'Shop Appeals',
    href: '/dashboard/admin/shop-appeals',
    icon: MessageSquare,
    description: 'Review shop suspension appeals'
  },
  {
    name: 'Disputes',
    href: '/dashboard/admin/disputes',
    icon: AlertTriangle,
    description: 'Manage and resolve disputes'
  },
  {
    name: 'Applications',
    href: '/dashboard/admin/applications',
    icon: FileText,
    description: 'Review designer and shop applications'
  },
  {
    name: 'Designer Verification',
    href: '/dashboard/admin/designer-verification',
    icon: Shield,
    description: 'Verify designer accounts'
  },
  {
    name: 'Payouts',
    href: '/dashboard/admin/payouts',
    icon: DollarSign,
    description: 'Manage designer payouts'
  },
  {
    name: 'Promotions',
    href: '/dashboard/admin/promotions',
    icon: Tag,
    description: 'Manage discounts and coupons'
  },
  {
    name: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
    description: 'Manage user accounts'
  },
  {
    name: 'Analytics',
    href: '/dashboard/admin/analytics',
    icon: BarChart3,
    description: 'System analytics'
  },
  {
    name: 'Backups',
    href: '/dashboard/admin/backups',
    icon: Database,
    description: 'Manage backups and recovery'
  },
  {
    name: 'System Announcements',
    href: '/dashboard/admin/system-announcements',
    icon: MessageSquare,
    description: 'Send system-wide announcements'
  },
  {
    name: 'Policies',
    href: '/dashboard/admin/policies',
    icon: ScrollText,
    description: 'Manage Terms & Conditions, Privacy, Shipping, and Refund policies'
  },
  {
    name: 'Settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
    description: 'System settings'
  }
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isAdmin } = useRequireAdmin();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <DashboardHeader 
        user={user} 
        onMenuClick={() => setSidebarOpen(true)}
        showMobileMenu={true}
        variant="admin"
      />

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} style={{ top: '80px' }}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex flex-col h-full">
            {/* Navigation Links Area */}
            <div className="flex-1 overflow-y-auto pt-5 pb-4">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Navigation</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== '/dashboard/admin' && pathname.startsWith(item.href + '/'));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Profile Footer */}
            <div className="mt-auto border-t border-gray-200 p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@fabriqly.com'}</p>
                </div>

                {/* Sign Out Button */}
                <button 
                  onClick={() => {
                    signOut({ callbackUrl: '/login' });
                    setSidebarOpen(false);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-full transition-colors flex-shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-20 w-64 h-[calc(100vh-5rem)] border-r border-gray-200 bg-white overflow-y-auto z-40">
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">Navigation</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard/admin' && pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 w-full">
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@fabriqly.com'}</p>
              </div>

              {/* Sign Out Button */}
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-full transition-colors flex-shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Wrapper - with padding to account for fixed header and sidebar */}
      <main className="pt-20 pl-0 lg:pl-64 w-full min-h-screen bg-gray-50">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}