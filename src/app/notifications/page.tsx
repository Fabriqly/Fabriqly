'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Loader } from 'lucide-react';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isDesigner = session?.user?.role === 'designer' || session?.user?.role === 'business_owner';

  // For designers/business owners, use dashboard layout
  if (isDesigner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={session?.user || null} showMobileMenu={true} />
        <div className="flex flex-1">
          <DashboardSidebar user={session?.user || null} />
          <div className="flex-1">
            <NotificationCenter className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  // For customers, use customer header with floating sidebar
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />
      
      {/* Mobile: Horizontal Tab Bar (appears right after header) */}
      <CustomerNavigationSidebar variant="mobile" />
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
        {/* Desktop: Vertical Sidebar (inside flex container) */}
        <CustomerNavigationSidebar variant="desktop" />

        {/* Right Content Area */}
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-4 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Stay updated with your activity</p>
            </div>
            
            <NotificationCenter className="w-full" />
          </div>
        </main>
      </div>
      
      <ScrollToTop />
    </div>
  );
}


