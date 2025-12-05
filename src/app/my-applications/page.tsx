'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { Button } from '@/components/ui/Button';
import { Clock, CheckCircle, XCircle, FileText, Store } from 'lucide-react';

interface Application {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName?: string;
  shopName?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: any;
  reviewedAt?: any;
  rejectionReason?: string;
  adminNotes?: string;
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [designerApplications, setDesignerApplications] = useState<Application[]>([]);
  const [shopApplications, setShopApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/my-applications');
    }

    if (searchParams.get('status') === 'success') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }

    // If user is no longer pending but has an approved application, redirect to dashboard
    if (user && (user.role === 'designer' || user.role === 'business_owner')) {
      const hasApprovedApp = [...designerApplications, ...shopApplications]
        .some(app => app.status === 'approved');
      
      if (hasApprovedApp) {
        // Show success message before redirecting
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    }
  }, [user, isLoading, router, searchParams, designerApplications, shopApplications]);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    try {
      setLoading(true);

      // Load designer applications
      const designerRes = await fetch('/api/applications/designer');
      if (designerRes.ok) {
        const designerData = await designerRes.json();
        setDesignerApplications(designerData.data || []);
      }

      // Load shop applications
      const shopRes = await fetch('/api/applications/shop');
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setShopApplications(shopData.data || []);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle Firestore Timestamp object
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle serialized Firestore Timestamp (from API)
      else if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      }
      // Handle ISO string or number
      else {
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderApplication = (app: Application, type: 'designer' | 'shop') => (
    <div key={app.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${type === 'designer' ? 'bg-purple-100' : 'bg-blue-100'}`}>
            {type === 'designer' ? (
              <FileText className={`w-6 h-6 ${type === 'designer' ? 'text-purple-600' : 'text-blue-600'}`} />
            ) : (
              <Store className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {type === 'designer' ? 'Designer Application' : 'Shop Application'}
            </h3>
            <p className="text-sm text-gray-600">
              {type === 'designer' ? app.businessName : app.shopName}
            </p>
          </div>
        </div>
        {getStatusBadge(app.status)}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Applied on:</span>
          <span className="font-medium text-gray-900">{formatDate(app.appliedAt)}</span>
        </div>

        {app.reviewedAt && (
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Reviewed on:</span>
            <span className="font-medium text-gray-900">{formatDate(app.reviewedAt)}</span>
          </div>
        )}

        {app.status === 'pending' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
            <p className="text-sm text-yellow-800">
              <Clock className="w-4 h-4 inline mr-2" />
              Your application is under review. We'll notify you once a decision has been made.
            </p>
          </div>
        )}

        {app.status === 'approved' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-sm text-green-800 mb-3">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Congratulations! Your application has been approved.
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {app.status === 'rejected' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-800 mb-2">
              <XCircle className="w-4 h-4 inline mr-2" />
              Unfortunately, your application was not approved.
            </p>
            {app.rejectionReason && (
              <div className="mt-2 p-3 bg-white rounded border border-red-200">
                <p className="text-xs text-gray-600 mb-1">Reason:</p>
                <p className="text-sm text-gray-900">{app.rejectionReason}</p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => router.push(type === 'designer' ? '/apply/designer' : '/apply/shop')}
            >
              Submit New Application
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasApplications = designerApplications.length > 0 || shopApplications.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={user} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-800 font-medium">
                Application submitted successfully! We'll review it shortly.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">
            Track the status of your designer and shop applications
          </p>
        </div>

        {/* Applications */}
        {!hasApplications ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any applications. Ready to join our community?
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/apply/designer')}>
                Apply as Designer
              </Button>
              <Button variant="outline" onClick={() => router.push('/apply/shop')}>
                Apply as Shop Owner
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Designer Applications */}
            {designerApplications.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Designer Applications</h2>
                <div className="space-y-4">
                  {designerApplications.map(app => renderApplication(app, 'designer'))}
                </div>
              </div>
            )}

            {/* Shop Applications */}
            {shopApplications.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Shop Applications</h2>
                <div className="space-y-4">
                  {shopApplications.map(app => renderApplication(app, 'shop'))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons for Customers */}
        {user.role === 'customer' && hasApplications && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Want to apply for another role?
            </h3>
            <p className="text-gray-600 mb-4">
              You can submit additional applications if you'd like to offer multiple services.
            </p>
            <div className="flex gap-4">
              {designerApplications.length === 0 && (
                <Button onClick={() => router.push('/apply/designer')}>
                  Apply as Designer
                </Button>
              )}
              {shopApplications.length === 0 && (
                <Button variant="outline" onClick={() => router.push('/apply/shop')}>
                  Apply as Shop Owner
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <ScrollToTop />
    </div>
  );
}


