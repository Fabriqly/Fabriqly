'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
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

  // For customers, use customer header
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session?.user || null} />
      <NotificationCenter className="w-full" />
    </div>
  );
}


