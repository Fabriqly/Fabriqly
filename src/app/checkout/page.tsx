'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CartSidebar } from '@/components/cart/CartSidebar';
import XenditPaymentForm from '@/components/payments/XenditPaymentForm';
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

// Payment info is now handled by XenditPaymentForm component

export default function CheckoutPage() {
  const router = useRouter();
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkCheckoutItems, setBulkCheckoutItems] = useState<any[]>([]);
  const [isBulkCheckout, setIsBulkCheckout] = useState(false);

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
    country: 'Indonesia',
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
    country: 'Indonesia',
    phone: '',
  });

  // Payment info is now handled by XenditPaymentForm component

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [currentStep, setCurrentStep] = useState<'address' | 'payment'>('address');
  const [createdOrders, setCreatedOrders] = useState<any[]>([]);

  // Check for bulk checkout items
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isBulk = urlParams.get('bulk') === 'true';
    
    console.log('Checkout page - isBulk:', isBulk);
    
    if (isBulk) {
      const storedItems = sessionStorage.getItem('bulkCheckoutItems');
      console.log('Checkout page - storedItems:', storedItems);
      
      if (storedItems) {
        try {
          const items = JSON.parse(storedItems);
          console.log('Checkout page - parsed items:', items);
          setBulkCheckoutItems(items);
          setIsBulkCheckout(true);
          // Clear the stored items
          sessionStorage.removeItem('bulkCheckoutItems');
        } catch (error) {
          console.error('Error parsing bulk checkout items:', error);
        }
      }
    }
  }, []);


  // This effect is now handled in the main bulk checkout effect above

  // Load user data if available
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ')[1] || '',
        phone: '',
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
    if (isBulkCheckout) {
      return bulkCheckoutItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }
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

  // Payment handling is now done by XenditPaymentForm component

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

    // Check billing address if not using same address
    if (!useSameAddress) {
      for (const field of requiredFields) {
        if (!billingAddress[field as keyof Address]) {
          setError(`Please fill in billing ${field}`);
          return false;
        }
      }
    }

    // No need to validate payment details here since Xendit handles that
    return true;
  };

  const validateStock = async () => {
    const itemsToProcess = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
    
    // Skip validation if no items
    if (itemsToProcess.length === 0) {
      console.log('No items to validate, skipping stock validation');
      return true;
    }
    
    const stockValidationRequest = {
      items: itemsToProcess.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch('/api/cart/validate-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockValidationRequest),
      });

      if (!response.ok) {
        console.error('Stock validation API error:', response.status, response.statusText);
        // For now, let's skip stock validation if API fails
        console.log('Skipping stock validation due to API error');
        return true;
      }

      const data = await response.json();

      if (!data.success || !data.data.isValid) {
        const errorMessages = data.data.errors || ['Product validation failed'];
        throw new Error(errorMessages.join('. '));
      }

      return true;
    } catch (error) {
      console.error('Product validation error:', error);
      // For now, let's skip stock validation if it fails
      console.log('Skipping stock validation due to error');
      return true;
    }
  };

  const handleCreateOrders = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Debug: Log cart state
      console.log('Cart state:', cartState);
      console.log('Bulk checkout items:', bulkCheckoutItems);
      console.log('Is bulk checkout:', isBulkCheckout);
      
      // Validate product availability and stock before proceeding
      await validateStock();

      // Group items by business owner
      const itemsToProcess = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
      const ordersByBusinessOwner = itemsToProcess.reduce((acc: Record<string, any[]>, item: any) => {
        if (!acc[item.businessOwnerId]) {
          acc[item.businessOwnerId] = [];
        }
        acc[item.businessOwnerId].push(item);
        return acc;
      }, {});

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
          paymentMethod: 'xendit', // Default to Xendit
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
      setCreatedOrders(orders);
      setCurrentStep('payment');
      
    } catch (error) {
      console.error('Error creating orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to create orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    // Clear cart and redirect to success page (only for regular checkout)
    if (!isBulkCheckout) {
      clearCart();
    }
    router.push(`/orders/success?orders=${createdOrders.map(o => o.order.id).join(',')}`);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  // Show loading state while determining checkout mode
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading checkout...</h2>
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
            <Link href="/explore">
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
            {/* Progress Steps */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex items-center space-x-2 ${currentStep === 'address' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'address' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <span className="font-medium">Address & Details</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 mx-4"></div>
                <div className={`flex items-center space-x-2 ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <span className="font-medium">Payment</span>
                </div>
              </div>
            </div>

            {currentStep === 'address' && (
              <div className="space-y-8">
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
                  placeholder="Enter your first name"
                  required
                />
                <Input
                  label="Last Name"
                  value={shippingAddress.lastName}
                  onChange={(e) => handleAddressChange('lastName', e.target.value, 'shipping')}
                  placeholder="Enter your last name"
                  required
                />
                <Input
                  label="Company (Optional)"
                  value={shippingAddress.company}
                  onChange={(e) => handleAddressChange('company', e.target.value, 'shipping')}
                  placeholder="Company name (optional)"
                />
                <Input
                  label="Phone Number"
                  value={shippingAddress.phone}
                  onChange={(e) => handleAddressChange('phone', e.target.value, 'shipping')}
                  placeholder="+62 812 3456 7890"
                  required
                />
                <div className="md:col-span-2">
                  <Input
                    label="Street Address"
                    value={shippingAddress.address1}
                    onChange={(e) => handleAddressChange('address1', e.target.value, 'shipping')}
                    placeholder="123 Main Street, Building Name"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Apartment, Suite, etc. (Optional)"
                    value={shippingAddress.address2}
                    onChange={(e) => handleAddressChange('address2', e.target.value, 'shipping')}
                    placeholder="Apt 4B, Suite 200, etc."
                  />
                </div>
                <Input
                  label="City"
                  value={shippingAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value, 'shipping')}
                  placeholder="Jakarta"
                  required
                />
                <Input
                  label="State/Province"
                  value={shippingAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value, 'shipping')}
                  placeholder="DKI Jakarta"
                  required
                />
                <Input
                  label="ZIP/Postal Code"
                  value={shippingAddress.zipCode}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value, 'shipping')}
                  placeholder="12345"
                  required
                />
                <Input
                  label="Country"
                  value={shippingAddress.country}
                  onChange={(e) => handleAddressChange('country', e.target.value, 'shipping')}
                  placeholder="Indonesia"
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
                    placeholder="Enter your first name"
                    required
                  />
                  <Input
                    label="Last Name"
                    value={billingAddress.lastName}
                    onChange={(e) => handleAddressChange('lastName', e.target.value, 'billing')}
                    placeholder="Enter your last name"
                    required
                  />
                  <Input
                    label="Company (Optional)"
                    value={billingAddress.company}
                    onChange={(e) => handleAddressChange('company', e.target.value, 'billing')}
                    placeholder="Company name (optional)"
                  />
                  <Input
                    label="Phone Number"
                    value={billingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value, 'billing')}
                    placeholder="+62 812 3456 7890"
                    required
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address"
                      value={billingAddress.address1}
                      onChange={(e) => handleAddressChange('address1', e.target.value, 'billing')}
                      placeholder="123 Main Street, Building Name"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Apartment, Suite, etc. (Optional)"
                      value={billingAddress.address2}
                      onChange={(e) => handleAddressChange('address2', e.target.value, 'billing')}
                      placeholder="Apt 4B, Suite 200, etc."
                    />
                  </div>
                  <Input
                    label="City"
                    value={billingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value, 'billing')}
                    placeholder="Jakarta"
                    required
                  />
                  <Input
                    label="State/Province"
                    value={billingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value, 'billing')}
                    placeholder="DKI Jakarta"
                    required
                  />
                  <Input
                    label="ZIP/Postal Code"
                    value={billingAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value, 'billing')}
                    placeholder="12345"
                    required
                  />
                  <Input
                    label="Country"
                    value={billingAddress.country}
                    onChange={(e) => handleAddressChange('country', e.target.value, 'billing')}
                    placeholder="Indonesia"
                    required
                  />
                </div>
              )}
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

            {/* Continue to Payment Button */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Button
                onClick={handleCreateOrders}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating Orders...' : 'Continue to Payment'}
              </Button>
            </div>
              </div>
            )}

            {currentStep === 'payment' && createdOrders.length > 0 && (
              <div className="space-y-8">
                <XenditPaymentForm
                  orderId={createdOrders[0].order.id}
                  amount={createdOrders.reduce((sum, order) => sum + order.order.totalAmount, 0)}
                  customerInfo={{
                    firstName: shippingAddress.firstName,
                    lastName: shippingAddress.lastName,
                    email: user?.email || '',
                    phone: shippingAddress.phone,
                  }}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-3 mb-6">
                {(isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || []).map((item) => (
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
