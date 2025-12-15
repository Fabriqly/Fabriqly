'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DisputeList } from '@/components/disputes/DisputeList';
import { Button } from '@/components/ui/Button';
import { Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';

export default function DisputesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const isDesigner = session.user.role === 'designer' || session.user.role === 'business_owner';

  const content = (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Disputes</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">
              Manage and track your dispute cases
            </p>
          </div>
          <Link href="/disputes/file">
            <Button className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              File New Dispute
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <DisputeList userId={session.user.id} showFilters={true} />
      </div>

      {/* Info Box */}
      <div className="mt-4 md:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">About Disputes</h3>
            <p className="text-sm text-blue-800">
              Disputes allow you to report issues with orders or customization requests. 
              You have 5 days from the status change to file a dispute. 
              Disputes go through a negotiation period (48 hours) before being escalated to admin review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // For designers/business owners, use dashboard layout
  if (isDesigner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={session.user} showMobileMenu={true} />
        <div className="flex flex-1">
          <DashboardSidebar user={session.user} />
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // For customers, use customer header with sidebar layout (same as profile page)
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session.user} />
      
      {/* Mobile: Horizontal Tab Bar */}
      <CustomerNavigationSidebar variant="mobile" />
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
        {/* Desktop: Vertical Sidebar */}
        <CustomerNavigationSidebar variant="desktop" />
        
        {/* Right Content Area */}
        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto">
            {content}
          </div>
        </main>
      </div>
      
      <ScrollToTop />
    </div>
  );
}






