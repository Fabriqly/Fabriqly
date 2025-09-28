'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle, 
  Package, 
  Mail, 
  ArrowRight,
  Home,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderIds, setOrderIds] = useState<string[]>([]);

  useEffect(() => {
    const ordersParam = searchParams.get('orders');
    if (ordersParam) {
      setOrderIds(ordersParam.split(','));
    } else {
      // Redirect to orders page if no order IDs provided
      router.push('/orders');
    }
  }, [searchParams, router]);

  const formatOrderId = (id: string) => {
    return `#${id.slice(-8)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order{orderIds.length > 1 ? 's have' : ' has'} been successfully placed and is being processed.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Order{orderIds.length > 1 ? 's' : ''} Placed:</h2>
            <div className="space-y-1">
              {orderIds.map((orderId, index) => (
                <p key={index} className="text-sm text-gray-600">
                  {formatOrderId(orderId)}
                </p>
              ))}
            </div>
          </div>

          {/* What's Next */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What's next?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 mt-0.5 text-blue-500" />
                <p>You'll receive an email confirmation shortly with your order details.</p>
              </div>
              <div className="flex items-start space-x-2">
                <Package className="w-4 h-4 mt-0.5 text-blue-500" />
                <p>We'll start processing your order and prepare it for shipment.</p>
              </div>
              <div className="flex items-start space-x-2">
                <ArrowRight className="w-4 h-4 mt-0.5 text-blue-500" />
                <p>You can track your order status in your account dashboard.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/orders" className="flex-1">
              <Button className="w-full">
                <Package className="w-4 h-4 mr-2" />
                View My Orders
              </Button>
            </Link>
            
            <Link href="/products" className="flex-1">
              <Button variant="outline" className="w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Home Link */}
          <div className="mt-6">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center space-x-1">
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
