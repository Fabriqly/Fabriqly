'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DisputeFilingForm } from '@/components/disputes/DisputeFilingForm';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';

export default function FileDisputePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const type = params?.type as string; // 'order' or 'customization'
  const id = params?.id as string;
  const [eligibility, setEligibility] = useState<{ canFile: boolean; reason?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (id && session?.user?.id) {
      checkEligibility();
    }
  }, [id, type, session?.user?.id]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/disputes/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: type === 'order' ? id : undefined,
          customizationRequestId: type === 'customization' ? id : undefined
        })
      });

      const data = await response.json();
      setEligibility(data.data || { canFile: false });
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setEligibility({ canFile: false, reason: 'Error checking eligibility' });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (disputeId: string) => {
    router.push(`/disputes/${disputeId}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (status === 'loading' || loading) {
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

  if (!session?.user) {
    return null;
  }

  const isDesigner = session.user.role === 'designer' || session.user.role === 'business_owner';

  const disputesLink = isDesigner ? "/dashboard/disputes" : "/disputes";

  const errorContent = (
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <Link href={disputesLink}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </Button>
        </Link>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot File Dispute</h2>
          <p className="text-gray-600 mb-6">{eligibility?.reason || 'You are not eligible to file a dispute for this transaction.'}</p>
          <Link href={disputesLink}>
            <Button>Return to Disputes</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const formContent = (
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <Link href={disputesLink}>
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </Button>
        </Link>
        <DisputeFilingForm
          orderId={type === 'order' ? id : undefined}
          customizationRequestId={type === 'customization' ? id : undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );

  const content = eligibility && !eligibility.canFile ? errorContent : formContent;

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

  // For customers, use customer header
  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={session.user} />
      {content}
    </div>
  );
}






