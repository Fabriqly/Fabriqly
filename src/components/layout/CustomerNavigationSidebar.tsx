'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, MessageCircle, Bell, Settings } from 'lucide-react';

const navigationItems = [
  { href: '/profile', icon: User, label: 'My Profile' },
  { href: '/orders', icon: Package, label: 'My Orders' },
  { href: '/my-customizations', icon: MessageCircle, label: 'My Customizations' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function CustomerNavigationSidebar() {
  const pathname = usePathname();

  return (
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
}

