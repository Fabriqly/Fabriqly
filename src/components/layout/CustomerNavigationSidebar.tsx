'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, MessageCircle, Bell, Settings, ShoppingCart } from 'lucide-react';

const navigationItems = [
  { href: '/profile', icon: User, label: 'My Profile' },
  { href: '/cart', icon: ShoppingCart, label: 'My Cart' },
  { href: '/orders', icon: Package, label: 'My Orders' },
  { href: '/my-customizations', icon: MessageCircle, label: 'My Customizations' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

interface CustomerNavigationSidebarProps {
  variant?: 'mobile' | 'desktop' | 'both';
}

export function CustomerNavigationSidebar({ variant = 'both' }: CustomerNavigationSidebarProps) {
  const pathname = usePathname();

  const renderMobileTabs = () => (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <nav className="flex overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-2 gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
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
    </div>
  );

  const renderDesktopSidebar = () => (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );

  if (variant === 'mobile') {
    return <div className="block md:hidden">{renderMobileTabs()}</div>;
  }
  
  if (variant === 'desktop') {
    return <div className="hidden md:block">{renderDesktopSidebar()}</div>;
  }

  // Default: both (for backward compatibility)
  return (
    <>
      <div className="block md:hidden">{renderMobileTabs()}</div>
      <div className="hidden md:block">{renderDesktopSidebar()}</div>
    </>
  );
}

