'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { 
  CreditCard, 
  MapPin, 
  User, 
  Lock,
  ArrowLeft,
  Package,
  Truck,
  Shield
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface PaymentInfo {
  method: 'card' | 'paypal' | 'apple_pay';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });

  const [billingAddress, setBillingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartState.cart || cartState.cart.items.length === 0) {
      router.push('/products');
    }
  }, [cartState.cart?.items.length, router]);

  // Load user data if available
  useEffect(() => {
    if (user?.profile) {
      setShippingAddress(prev => ({
        ...prev,
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || '',
        ...user.profile.address,
      }));
    }
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculateSubtotal = () => {
    return cartState.cart?.items.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08; // 8% tax
  };

  const calculateShipping = () => {
    return 9.99; // Fixed shipping cost
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  const handleAddressChange = (field: keyof Address, value: string, type: 'shipping' | 'billing') => {
    if (type === 'shipping') {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
      if (useSameAddress) {
        setBillingAddress(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePaymentChange = (field: keyof PaymentInfo, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      'firstName', 'lastName', 'address1', 'city', 'state', 'zipCode', 'phone'
    ];

    for (const field of requiredFields) {
      if (!shippingAddress[field as keyof Address]) {
        setError(`Please fill in ${field}`);
        return false;
      }
    }

    if (paymentInfo.method === 'card') {
      if (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv || !paymentInfo.cardholderName) {
        setError('Please fill in all payment details');
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Group items by business owner
      const ordersByBusinessOwner = cartState.cart?.items.reduce((acc, item) => {
        if (!acc[item.businessOwnerId]) {
          acc[item.businessOwnerId] = [];
        }
        acc[item.businessOwnerId].push(item);
        return acc;
      }, {} as Record<string, typeof cartState.cart.items>) || {};

      // Create orders for each business owner
      const orderPromises = Object.entries(ordersByBusinessOwner).map(async ([businessOwnerId, items]) => {
        const orderData = {
          businessOwnerId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            customizations: {
              ...item.selectedVariants,
              colorId: item.selectedColorId,
            },
          })),
          shippingAddress,
          billingAddress: useSameAddress ? shippingAddress : billingAddress,
          paymentMethod: paymentInfo.method,
          notes: orderNotes,
          shippingCost: calculateShipping(),
        };

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create order');
        }

        return response.json();
      });

      const orders = await Promise.all(orderPromises);
      
      // Clear cart and redirect to success page
      clearCart();
      router.push(`/orders/success?orders=${orders.map(o => o.order.id).join(',')}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cartState.cart || cartState.cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CartSidebar />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shopping
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Shipping Address</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={shippingAddress.firstName}
                  onChange={(e) => handleAddressChange('firstName', e.target.value, 'shipping')}
                  required
                />
                <Input
                  label="Last Name"
                  value={shippingAddress.lastName}
                  onChange={(e) => handleAddressChange('lastName', e.target.value, 'shipping')}
                  required
                />
                <Input
                  label="Company (Optional)"
                  value={shippingAddress.company}
                  onChange={(e) => handleAddressChange('company', e.target.value, 'shipping')}
                />
                <Input
                  label="Phone"
                  value={shippingAddress.phone}
                  onChange={(e) => handleAddressChange('phone', e.target.value, 'shipping')}
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Address Line 1"
                    value={shippingAddress.address1}
                    onChange={(e) => handleAddressChange('address1', e.target.value, 'shipping')}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Address Line 2 (Optional)"
                    value={shippingAddress.address2}
                    onChange={(e) => handleAddressChange('address2', e.target.value, 'shipping')}
                  />
                </div>
                <Input
                  label="City"
                  value={shippingAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value, 'shipping')}
                  required
                />
                <Input
                  label="State"
                  value={shippingAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value, 'shipping')}
                  required
                />
                <Input
                  label="ZIP Code"
                  value={shippingAddress.zipCode}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value, 'shipping')}
                  required
                />
                <Input
                  label="Country"
                  value={shippingAddress.country}
                  onChange={(e) => handleAddressChange('country', e.target.value, 'shipping')}
                  required
                />
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Billing Address</h2>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useSameAddress}
                    onChange={(e) => setUseSameAddress(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Same as shipping address</span>
                </label>
              </div>
              
              {!useSameAddress && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={billingAddress.firstName}
                    onChange={(e) => handleAddressChange('firstName', e.target.value, 'billing')}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={billingAddress.lastName}
                    onChange={(e) => handleAddressChange('lastName', e.target.value, 'billing')}
                    required
                  />
                  <Input
                    label="Company (Optional)"
                    value={billingAddress.company}
                    onChange={(e) => handleAddressChange('company', e.target.value, 'billing')}
                  />
                  <Input
                    label="Phone"
                    value={billingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value, 'billing')}
                    required
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Address Line 1"
                      value={billingAddress.address1}
                      onChange={(e) => handleAddressChange('address1', e.target.value, 'billing')}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Address Line 2 (Optional)"
                      value={billingAddress.address2}
                      onChange={(e) => handleAddressChange('address2', e.target.value, 'billing')}
                    />
                  </div>
                  <Input
                    label="City"
                    value={billingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value, 'billing')}
                    required
                  />
                  <Input
                    label="State"
                    value={billingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value, 'billing')}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    value={billingAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value, 'billing')}
                    required
                  />
                  <Input
                    label="Country"
                    value={billingAddress.country}
                    onChange={(e) => handleAddressChange('country', e.target.value, 'billing')}
                    required
                  />
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Payment Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'card', label: 'Credit Card', icon: CreditCard },
                      { value: 'paypal', label: 'PayPal', icon: CreditCard },
                      { value: 'apple_pay', label: 'Apple Pay', icon: CreditCard },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handlePaymentChange('method', value)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          paymentInfo.method === value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentInfo.method === 'card' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Cardholder Name"
                        value={paymentInfo.cardholderName}
                        onChange={(e) => handlePaymentChange('cardholderName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        label="Card Number"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>
                    <Input
                      label="Expiry Date"
                      value={paymentInfo.expiryDate}
                      onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                      placeholder="MM/YY"
                      required
                    />
                    <Input
                      label="CVV"
                      value={paymentInfo.cvv}
                      onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                      placeholder="123"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Order Notes (Optional)</h2>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Any special instructions for your order..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {cartState.cart?.items.map((item) => (
                  <div key={item.id} className="flex space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={item.product.images[0].imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Checkout image failed to load:', item.product.images[0].imageUrl);
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${item.product.images && item.product.images.length > 0 ? 'hidden' : ''}`}>
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(calculateShipping())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="flex items-center justify-center space-x-4 mt-6 pt-4 border-t">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Lock className="w-3 h-3" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Shield className="w-3 h-3" />
                  <span>Protected</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Truck className="w-3 h-3" />
                  <span>Fast Delivery</span>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6"
                size="lg"
              >
                {loading ? 'Processing...' : `Place Order - ${formatPrice(calculateTotal())}`}
              </Button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
