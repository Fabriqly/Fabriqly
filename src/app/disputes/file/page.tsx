'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Package, Palette, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface EligibleItem {
  id: string;
  type: 'order' | 'customization';
  title: string;
  status: string;
  date: string;
  amount?: number;
}

export default function FileDisputeSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [eligibleOrders, setEligibleOrders] = useState<EligibleItem[]>([]);
  const [eligibleCustomizations, setEligibleCustomizations] = useState<EligibleItem[]>([]);
  const [error, setError] = useState('');

  // Check if query params are provided (for direct links)
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const customizationRequestId = searchParams.get('customizationRequestId');

    if (orderId) {
      router.replace(`/disputes/file/order/${orderId}`);
      return;
    } else if (customizationRequestId) {
      router.replace(`/disputes/file/customization/${customizationRequestId}`);
      return;
    }
  }, [router, searchParams]);

  // Load eligible items
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      loadEligibleItems();
    }
  }, [sessionStatus, session]);

  const loadEligibleItems = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch orders (shipped and delivered statuses)
      const ordersResponse = await fetch('/api/orders?status=shipped');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.orders || [];
        
        // Also fetch delivered orders
        const deliveredResponse = await fetch('/api/orders?status=delivered');
        if (deliveredResponse.ok) {
          const deliveredData = await deliveredResponse.json();
          orders.push(...(deliveredData.orders || []));
        }
        
        // Check eligibility for each order
        const eligible: EligibleItem[] = [];
        for (const order of orders) {
          try {
            const eligibilityResponse = await fetch('/api/disputes/check-eligibility', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id })
            });
            
            if (eligibilityResponse.ok) {
              const eligibilityData = await eligibilityResponse.json();
              if (eligibilityData.data?.canFile) {
                const createdAt = order.createdAt?.toDate?.() || order.createdAt || new Date();
                eligible.push({
                  id: order.id,
                  type: 'order',
                  title: `Order #${order.orderNumber || order.id.slice(0, 8)}`,
                  status: order.status,
                  date: new Date(createdAt).toLocaleDateString(),
                  amount: order.totalAmount
                });
              }
            }
          } catch (err) {
            console.error(`Error checking eligibility for order ${order.id}:`, err);
          }
        }
        setEligibleOrders(eligible);
      }

      // Fetch customization requests (in_progress and awaiting_customer_approval statuses)
      const customizationsResponse = await fetch('/api/customizations?status=in_progress');
      if (customizationsResponse.ok) {
        const customizationsData = await customizationsResponse.json();
        const customizations = customizationsData.data || [];
        
        // Also fetch awaiting_customer_approval
        const awaitingResponse = await fetch('/api/customizations?status=awaiting_customer_approval');
        if (awaitingResponse.ok) {
          const awaitingData = await awaitingResponse.json();
          customizations.push(...(awaitingData.data || []));
        }
        
        // Check eligibility for each customization
        const eligible: EligibleItem[] = [];
        for (const customization of customizations) {
          try {
            const eligibilityResponse = await fetch('/api/disputes/check-eligibility', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customizationRequestId: customization.id })
            });
            
            if (eligibilityResponse.ok) {
              const eligibilityData = await eligibilityResponse.json();
              if (eligibilityData.data?.canFile) {
                const createdAt = customization.requestedAt?.toDate?.() || customization.createdAt || new Date();
                eligible.push({
                  id: customization.id,
                  type: 'customization',
                  title: customization.productName || `Customization Request #${customization.id.slice(0, 8)}`,
                  status: customization.status,
                  date: new Date(createdAt).toLocaleDateString(),
                  amount: customization.agreedPrice
                });
              }
            }
          } catch (err) {
            console.error(`Error checking eligibility for customization ${customization.id}:`, err);
          }
        }
        setEligibleCustomizations(eligible);
      }
    } catch (err: any) {
      console.error('Error loading eligible items:', err);
      setError('Failed to load eligible items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  const isDesigner = session.user.role === 'designer' || session.user.role === 'business_owner';
  const totalEligible = eligibleOrders.length + eligibleCustomizations.length;

  const content = (
    <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/disputes">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Disputes
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">File a New Dispute</h1>
          <p className="text-gray-600">Select an order or customization request to file a dispute for</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {totalEligible === 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Eligible Items</h2>
            <p className="text-gray-600 mb-6">
              You don't have any orders or customization requests that are eligible for dispute filing.
              Disputes can only be filed within 5 days of status changes.
            </p>
            <Link href="/disputes">
              <Button>Return to Disputes</Button>
            </Link>
          </div>
        )}

        {totalEligible > 0 && (
          <div className="space-y-6">
            {/* Orders Section */}
            {eligibleOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Orders ({eligibleOrders.length})
                </h2>
                <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                  {eligibleOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/disputes/file/order/${order.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{order.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Status: {order.status} • Date: {order.date}
                            {order.amount && ` • Amount: ₱${order.amount.toLocaleString()}`}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          File Dispute
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Customizations Section */}
            {eligibleCustomizations.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Customization Requests ({eligibleCustomizations.length})
                </h2>
                <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                  {eligibleCustomizations.map((customization) => (
                    <Link
                      key={customization.id}
                      href={`/disputes/file/customization/${customization.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{customization.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Status: {customization.status} • Date: {customization.date}
                            {customization.amount && ` • Amount: ₱${customization.amount.toLocaleString()}`}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          File Dispute
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
          <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
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






