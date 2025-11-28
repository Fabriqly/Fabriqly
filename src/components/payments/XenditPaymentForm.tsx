'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Alert, AlertDescription } from '../ui/Alert';
import { Loader2, CreditCard, Building, Smartphone, Store, QrCode } from 'lucide-react';

interface PaymentMethod {
  type: string;
  name: string;
  description: string;
  supported_currencies: string[];
  configuration?: any;
}

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [authenticationId, setAuthenticationId] = useState<string | null>(null);

  // Card form state
  const [cardData, setCardData] = useState({
    account_number: '',
    expiry_month: '',
    expiry_year: '',
    cvn: '',
    cardholder_name: '',
  });

  // Virtual account state
  const [selectedBank, setSelectedBank] = useState<string>('');

  // E-wallet state
  const [selectedEwallet, setSelectedEwallet] = useState<string>('');

  // Retail outlet state
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods');
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods);
      } else {
        setError('Failed to load payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
    }
  };

  const createCardToken = async () => {
    try {
      const response = await fetch('/api/payments/create-card-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: cardData.account_number,
          expiry_month: cardData.expiry_month,
          expiry_year: cardData.expiry_year,
          cvn: cardData.cvn,
          is_multiple_use: false,
          should_authenticate: true,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCardToken(data.cardToken.id);
        setAuthenticationId(data.cardToken.authentication_id);
        return data.cardToken.id;
      } else {
        throw new Error(data.error || 'Failed to create card token');
      }
    } catch (error: any) {
      console.error('Error creating card token:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let paymentData: any = {
        orderId,
        paymentMethod: selectedMethod,
      };

      switch (selectedMethod) {
        case 'card':
          if (!cardData.account_number || !cardData.expiry_month || !cardData.expiry_year || !cardData.cvn) {
            throw new Error('Please fill in all card details');
          }
          
          const token = await createCardToken();
          paymentData.cardToken = token;
          break;

        case 'virtual_account':
          if (!selectedBank) {
            throw new Error('Please select a bank');
          }
          paymentData.bankCode = selectedBank;
          break;

        case 'ewallet':
          if (!selectedEwallet) {
            throw new Error('Please select an e-wallet');
          }
          paymentData.ewalletChannel = selectedEwallet;
          break;

        case 'retail_outlet':
          if (!selectedOutlet) {
            throw new Error('Please select a retail outlet');
          }
          paymentData.bankCode = selectedOutlet;
          break;

        case 'qr_code':
          // No additional data needed for QR code
          break;

        default:
          throw new Error('Invalid payment method');
      }

      const response = await fetch('/api/payments/create-payment-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      
      if (result.success) {
        onPaymentSuccess(result);
      } else {
        throw new Error(result.error || 'Payment request failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed');
      onPaymentError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

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

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'virtual_account':
        return <Building className="w-5 h-5" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5" />;
      case 'retail_outlet':
        return <Store className="w-5 h-5" />;
      case 'qr_code':
        return <QrCode className="w-5 h-5" />;
      default:
        return null;
    }
  };

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

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Choose Payment Method</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.type}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMethod === method.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMethod(method.type)}
                >
                  <div className="flex items-center space-x-3">
                    {getPaymentMethodIcon(method.type)}
                    <div>
                      <h3 className="font-medium">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Payment Form */}
          {selectedMethod === 'card' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Card Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="cardholder_name">Cardholder Name</Label>
                  <Input
                    id="cardholder_name"
                    value={cardData.cardholder_name}
                    onChange={(e) => setCardData({ ...cardData, cardholder_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="account_number">Card Number</Label>
                  <Input
                    id="account_number"
                    value={formatCardNumber(cardData.account_number)}
                    onChange={(e) => setCardData({ ...cardData, account_number: e.target.value.replace(/\s/g, '') })}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_month">Expiry Month</Label>
                  <Input
                    id="expiry_month"
                    value={cardData.expiry_month}
                    onChange={(e) => setCardData({ ...cardData, expiry_month: e.target.value })}
                    placeholder="12"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry_year">Expiry Year</Label>
                  <Input
                    id="expiry_year"
                    value={cardData.expiry_year}
                    onChange={(e) => setCardData({ ...cardData, expiry_year: e.target.value })}
                    placeholder="2025"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="cvn">CVN</Label>
                  <Input
                    id="cvn"
                    value={cardData.cvn}
                    onChange={(e) => setCardData({ ...cardData, cvn: e.target.value })}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Virtual Account Form */}
          {selectedMethod === 'virtual_account' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Select Bank</h3>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a bank" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods
                    .find(m => m.type === 'virtual_account')
                    ?.configuration?.supported_banks?.map((bank: any) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* E-wallet Form */}
          {selectedMethod === 'ewallet' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Select E-wallet</h3>
              <Select value={selectedEwallet} onValueChange={setSelectedEwallet}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an e-wallet" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods
                    .find(m => m.type === 'ewallet')
                    ?.configuration?.supported_channels?.map((channel: any) => (
                      <SelectItem key={channel.code} value={channel.code}>
                        {channel.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Retail Outlet Form */}
          {selectedMethod === 'retail_outlet' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Select Retail Outlet</h3>
              <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a retail outlet" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods
                    .find(m => m.type === 'retail_outlet')
                    ?.configuration?.supported_outlets?.map((outlet: any) => (
                      <SelectItem key={outlet.code} value={outlet.code}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handlePayment}
              disabled={loading || !selectedMethod}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
            
            <Button
              variant="outline"
              onClick={handleCreateInvoice}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay using Xendit'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
