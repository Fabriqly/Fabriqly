'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DisputeList } from '@/components/disputes/DisputeList';
import { Button } from '@/components/ui/Button';
import { Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';

export default function DisputesPage() {
  const { user } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">My Disputes</h1>
                  <p className="text-gray-600">Manage and track your dispute cases</p>
                </div>
                <Link href="/disputes/file">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    File New Dispute
                  </Button>
                </Link>
              </div>
            </div>

            {/* Disputes List */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <DisputeList userId={session.user.id} showFilters={true} />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
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
        </div>
      </div>
    </div>
  );
}



