'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft,
  Package, 
  Truck, 
  CheckCircle,
  MapPin,
  Clock,
  Loader
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Order {
  id: string;
  trackingNumber?: string;
  carrier?: string;
  status: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: any;
    updatedBy?: string;
  }>;
  createdAt: any;
  updatedAt: any;
}

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.id as string;

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (response.ok && data.order) {
        console.log('[Tracking] Order loaded:', {
          status: data.order.status,
          statusHistory: data.order.statusHistory,
          createdAt: data.order.createdAt,
          updatedAt: data.order.updatedAt
        });
        setOrder(data.order);
      } else {
        setError(data.error || 'Failed to load tracking information');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert any timestamp format to Date
  const convertToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    try {
      // Handle Firestore Timestamp object (has toDate method)
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      // Handle serialized Firestore timestamp (has _seconds and _nanoseconds)
      else if (timestamp._seconds !== undefined) {
        const seconds = timestamp._seconds;
        const nanoseconds = timestamp._nanoseconds || 0;
        return new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      // Handle regular Date string or number
      else {
        return new Date(timestamp);
      }
    } catch (error) {
      console.error('Error converting timestamp to date:', error);
      return null;
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { id: 'pending', label: 'Order Placed', icon: CheckCircle },
      { id: 'processing', label: 'Processing', icon: Package },
      { id: 'to_ship', label: 'Ready to Ship', icon: Package },
      { id: 'shipped', label: 'Shipped', icon: Truck },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle },
    ];

    const statusOrder = ['pending', 'processing', 'to_ship', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status || '');

    // Get timestamps from status history
    const getStatusTimestamp = (status: string, stepIndex: number) => {
      // First, try to get from status history
      const historyEntry = order?.statusHistory?.find(h => h.status === status);
      if (historyEntry?.timestamp) {
        console.log(`[Tracking] Found timestamp for ${status}:`, historyEntry.timestamp);
        return historyEntry.timestamp;
      }
      
      // Fallback for orders without history:
      // - 'pending' uses createdAt
      // - current status uses updatedAt
      // - For completed intermediate statuses, estimate based on order progression
      if (status === 'pending') {
        console.log(`[Tracking] Using createdAt for pending:`, order?.createdAt);
        return order?.createdAt;
      }
      if (status === order?.status) {
        console.log(`[Tracking] Using updatedAt for current status ${status}:`, order?.updatedAt);
        return order?.updatedAt;
      }
      
      // For completed intermediate statuses, estimate dates based on order progression
      if (stepIndex <= currentIndex && order?.createdAt) {
        const createdAt = convertToDate(order.createdAt);
        const updatedAt = convertToDate(order.updatedAt);
        
        if (createdAt && updatedAt) {
          const timeDiff = updatedAt.getTime() - createdAt.getTime();
          const statusProgress = (stepIndex + 1) / (currentIndex + 1);
          const estimatedDate = new Date(createdAt.getTime() + (timeDiff * statusProgress));
          console.log(`[Tracking] Estimated timestamp for ${status}:`, estimatedDate);
          return estimatedDate;
        }
      }
      
      console.log(`[Tracking] No timestamp found for ${status}`);
      return null;
    };

    return steps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
      timestamp: getStatusTimestamp(step.id, index),
    }));
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = convertToDate(timestamp);
    
    if (!date || isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Package className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Tracking</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Package
          </h1>
          <p className="text-gray-600">Order #{orderId.substring(0, 12)}...</p>
        </div>

        {/* Tracking Information */}
        {order.trackingNumber && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                <p className="text-2xl font-bold text-gray-900 font-mono">{order.trackingNumber}</p>
              </div>
              {order.carrier && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Carrier</p>
                  <p className="text-lg font-semibold text-gray-900">{order.carrier}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tracking Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Status</h2>
          
          <div className="relative">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === statusSteps.length - 1;

              return (
                <div key={step.id} className="relative">
                  <div className="flex items-center mb-8">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      step.isCompleted 
                        ? 'bg-green-500 text-white' 
                        : step.isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Label */}
                    <div className="ml-4 flex-1">
                      <p className={`font-semibold ${
                        step.isCompleted || step.isCurrent ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {step.isCurrent && (
                        <p className="text-sm text-blue-600 mt-1">Current Status</p>
                      )}
                      {step.isCompleted && !step.isCurrent && (
                        <p className="text-sm text-green-600 mt-1">Completed</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    {(step.isCompleted || step.isCurrent) && (
                      <div className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {formatDate(step.timestamp)}
                      </div>
                    )}
                  </div>

                  {/* Connecting Line */}
                  {!isLast && (
                    <div className={`absolute left-6 top-12 w-0.5 h-8 -mt-4 ${
                      step.isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Address
          </h2>
          <div className="text-gray-700">
            <p className="font-medium">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>{order.shippingAddress.address1}</p>
            {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
            <p className="mt-2 text-sm">📞 {order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Mark as Received Button */}
        {order.status === 'shipped' && (
          <div className="mt-6">
            <Button
              onClick={async () => {
                if (!confirm('Confirm that you have received this order?')) {
                  return;
                }

                try {
                  const response = await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'delivered' }),
                  });

                  if (response.ok) {
                    alert('Thank you! Order marked as delivered.');
                    await loadOrder();
                  } else {
                    const data = await response.json();
                    alert(data.error || 'Failed to mark order as delivered');
                  }
                } catch (error) {
                  console.error('Error marking order as delivered:', error);
                  alert('Failed to mark order as delivered');
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Mark as Received
            </Button>
          </div>
        )}

        {/* Additional Info */}
        {!order.trackingNumber && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Tracking information will be available once your order has been shipped.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

