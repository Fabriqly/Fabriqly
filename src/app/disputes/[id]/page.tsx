'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { DisputeDetailView } from '@/components/disputes/DisputeDetailView';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';

export default function DisputeDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const disputeId = params?.id as string;

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

  if (!session?.user || !disputeId) {
    return null;
  }

  const isDesigner = session.user.role === 'designer' || session.user.role === 'business_owner';

  const content = (
    <div className="w-full">
      <Link href={isDesigner ? "/dashboard/disputes" : "/disputes"}>
        <Button variant="outline" className="mb-4 md:mb-6 w-full md:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Disputes
        </Button>
      </Link>
      <DisputeDetailView disputeId={disputeId} />
    </div>
  );

  // For designers/business owners, use dashboard layout
  if (isDesigner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardHeader user={session.user} showMobileMenu={true} />
        <div className="flex flex-1">
          <DashboardSidebar user={session.user} />
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
            <div className="container mx-auto px-4 py-8">
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For customers, use customer header with sidebar layout (same as disputes list page)
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






