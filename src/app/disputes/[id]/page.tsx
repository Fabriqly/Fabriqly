'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { DisputeDetailView } from '@/components/disputes/DisputeDetailView';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
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
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
      <Link href="/disputes">
        <Button variant="outline" className="mb-6">
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
          <div className="flex-1 overflow-y-auto">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // For customers, use customer header
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session.user} />
      {content}
    </div>
  );
}






