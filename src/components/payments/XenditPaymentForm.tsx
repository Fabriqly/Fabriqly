'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, CreditCard } from 'lucide-react';

interface XenditPaymentFormProps {
  orderId: string;
  orderIds?: string[]; // For multiple orders
  amount: number;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
}

export default function XenditPaymentForm({
  orderId,
  orderIds,
  amount,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
}: XenditPaymentFormProps) {
  // Use orderIds if provided, otherwise use single orderId
  const allOrderIds = orderIds || [orderId];
  
  // Debug: Log the amount being used
  console.log('[XenditPaymentForm] Component rendered with amount:', amount, 'orderIds:', allOrderIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleCreateInvoice = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        orderId: allOrderIds[0], // Primary order ID for backward compatibility
        orderIds: allOrderIds, // All order IDs
        totalAmount: amount, // Combined total amount
        paymentMethod: 'invoice',
      };
      console.log('[XenditPaymentForm] Creating invoice with amount:', amount, 'requestData:', requestData);
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      if (result.success) {
        // Redirect to Xendit invoice page
        window.location.href = result.invoice.invoice_url;
      } else {
        throw new Error(result.error || 'Invoice creation failed');
      }
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      setError(error.message || 'Invoice creation failed');
      onPaymentError(error.message || 'Invoice creation failed');
    } finally {
      setLoading(false);
    }
  };

  // Removed unused helper functions

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Method - Xendit */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pay using Xendit</h3>
                  <p className="text-sm text-gray-600">Secure payment processing powered by Xendit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateInvoice}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${new Intl.NumberFormat('en-PH', {
                  style: 'currency',
                  currency: 'PHP',
                  minimumFractionDigits: 2
                }).format(amount)}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
