'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import XenditPaymentForm from '@/components/payments/XenditPaymentForm';
import { DiscountSummary } from '@/components/promotions/DiscountSummary';
import { CouponSelectionModal } from '@/components/promotions/CouponSelectionModal';
import { 
  CreditCard, 
  MapPin, 
  User, 
  Lock,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  Edit,
  Check,
  X,
  Store,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { AddressListModal } from '@/components/customization/AddressListModal';
import { ShippingAddressModal } from '@/components/customization/ShippingAddressModal';
import { ShopProfile } from '@/types/shop-profile';
import { CartItem } from '@/types/cart';
import { WatermarkedImage } from '@/components/ui/WatermarkedImage';

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
  const { state: cartState, clearCart, applyCoupon, removeCoupon } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkCheckoutItems, setBulkCheckoutItems] = useState<any[]>(() => {
    // Initialize bulk checkout items immediately on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isBulk = urlParams.get('bulk') === 'true';
      if (isBulk) {
        const storedItems = sessionStorage.getItem('bulkCheckoutItems');
        if (storedItems) {
          try {
            const items = JSON.parse(storedItems);
            if (items && Array.isArray(items) && items.length > 0) {
              console.log('[Checkout] Initialized bulk checkout items from sessionStorage:', items);
              return items; // Return items immediately
            }
          } catch (e) {
            console.error('[Checkout] Error parsing bulk checkout items in initial state:', e);
          }
        }
      }
    }
    return [];
  });
  const [isBulkCheckout, setIsBulkCheckout] = useState(() => {
    // Initialize bulk checkout state immediately on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isBulk = urlParams.get('bulk') === 'true';
      if (isBulk) {
        const storedItems = sessionStorage.getItem('bulkCheckoutItems');
        if (storedItems) {
          try {
            const items = JSON.parse(storedItems);
            if (items && Array.isArray(items) && items.length > 0) {
              console.log('[Checkout] Initialized bulk checkout mode from sessionStorage');
              return true; // Will be confirmed in useEffect
            }
          } catch (e) {
            // Ignore parse errors, will be handled in useEffect
          }
        }
      }
    }
    return false;
  });

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
  
  // Address selection modals
  const [showAddressListModal, setShowAddressListModal] = useState(false);
  const [showShippingAddressModal, setShowShippingAddressModal] = useState(false);
  const [showBillingAddressModal, setShowBillingAddressModal] = useState(false);
  const [isSelectingBilling, setIsSelectingBilling] = useState(false);
  const [addressRefreshTrigger, setAddressRefreshTrigger] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  
  // Shop grouping for Order Review
  const [shopProfiles, setShopProfiles] = useState<Record<string, ShopProfile | null>>({});
  const [loadingShops, setLoadingShops] = useState(true);
  const [groupedItems, setGroupedItems] = useState<Array<{
    shop?: ShopProfile | null;
    designer?: any;
    businessOwnerId?: string;
    designerId?: string;
    groupType: 'product' | 'design';
    items: (CartItem & { shop?: ShopProfile })[];
  }>>([]);
  const [orderReviewExpanded, setOrderReviewExpanded] = useState(true);

  // Check for bulk checkout items
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const checkBulkCheckout = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isBulk = urlParams.get('bulk') === 'true';
      
      console.log('[Checkout] Checking bulk checkout:', { isBulk, search: window.location.search });
      
      // Only set bulk checkout if explicitly requested via URL parameter
      // AND there are stored items in sessionStorage
      if (isBulk) {
        const storedItems = sessionStorage.getItem('bulkCheckoutItems');
        console.log('[Checkout] Bulk checkout requested, stored items:', storedItems);
        
        if (storedItems) {
          try {
            const items = JSON.parse(storedItems);
            console.log('[Checkout] Parsed bulk checkout items:', items);
            
            if (items && Array.isArray(items) && items.length > 0) {
              setBulkCheckoutItems(items);
              setIsBulkCheckout(true);
              console.log('[Checkout] Set bulk checkout mode with', items.length, 'items');
              // Don't clear immediately - wait until order is created to prevent issues on refresh
            } else {
              // If no valid items, reset to regular checkout
              console.log('[Checkout] No valid items, resetting to regular checkout');
              setIsBulkCheckout(false);
              setBulkCheckoutItems([]);
            }
          } catch (error) {
            console.error('[Checkout] Error parsing bulk checkout items:', error);
            setIsBulkCheckout(false);
            setBulkCheckoutItems([]);
          }
        } else {
          // No stored items, reset to regular checkout
          console.log('[Checkout] No stored items found, resetting to regular checkout');
          setIsBulkCheckout(false);
          setBulkCheckoutItems([]);
        }
      } else {
        // Not a bulk checkout, ensure we're in regular mode
        // Also clear any leftover bulk items from sessionStorage
        console.log('[Checkout] Not bulk checkout, clearing sessionStorage');
        sessionStorage.removeItem('bulkCheckoutItems');
        setIsBulkCheckout(false);
        setBulkCheckoutItems([]);
      }
    };

    // Check immediately
    checkBulkCheckout();

    // Also listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', checkBulkCheckout);
    
    // Cleanup
    return () => {
      window.removeEventListener('popstate', checkBulkCheckout);
    };
  }, []); // Keep empty deps, but check on mount and listen to navigation


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

  // Group items by shop and load shop profiles
  useEffect(() => {
    const items = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
    if (items.length === 0) {
      setGroupedItems([]);
      setLoadingShops(false);
      return;
    }

    const loadShopProfiles = async () => {
      setLoadingShops(true);
      
      // Separate product and design items
      const productItems = items.filter((item: any) => item.itemType === 'product');
      const designItems = items.filter((item: any) => item.itemType === 'design');
      
      const uniqueOwnerIds = [...new Set(productItems.map((item: any) => item.businessOwnerId).filter(Boolean))];
      const uniqueDesignerIds = [...new Set(designItems.map((item: any) => item.designerId).filter(Boolean))];
      
      const shopMap: Record<string, ShopProfile | null> = {};
      const designerMap: Record<string, any> = {};

      // Fetch shop profiles for all unique business owners
      await Promise.all(
        uniqueOwnerIds.map(async (ownerId) => {
          try {
            const response = await fetch(`/api/shop-profiles/user/${ownerId}`);
            const data = await response.json();
            if (data.success && data.data) {
              shopMap[ownerId] = data.data;
            } else {
              shopMap[ownerId] = null;
            }
          } catch (error) {
            console.error(`Error loading shop for owner ${ownerId}:`, error);
            shopMap[ownerId] = null;
          }
        })
      );

      // Fetch designer profiles for all unique designers
      // Note: designerId in cart items is the profile ID, not userId
      await Promise.all(
        uniqueDesignerIds.map(async (designerId) => {
          try {
            // Try by profile ID first
            const response = await fetch(`/api/designer-profiles/${designerId}`);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              // If not JSON (likely HTML 404 page), try by userId
              const userResponse = await fetch(`/api/designer-profiles?userId=${designerId}`);
              if (userResponse.ok) {
                const userContentType = userResponse.headers.get('content-type');
                if (userContentType && userContentType.includes('application/json')) {
                  const userData = await userResponse.json();
                  if (userData.profiles && userData.profiles.length > 0) {
                    designerMap[designerId] = userData.profiles[0];
                    return;
                  }
                }
              }
              designerMap[designerId] = null;
              return;
            }
            
            if (!response.ok) {
              designerMap[designerId] = null;
              return;
            }
            
            const data = await response.json();
            if (data.profile) {
              designerMap[designerId] = data.profile;
            } else {
              designerMap[designerId] = null;
            }
          } catch (error) {
            console.error(`Error loading designer for ${designerId}:`, error);
            designerMap[designerId] = null;
          }
        })
      );

      setShopProfiles(shopMap);

      // Group product items by businessOwnerId
      const productGroups = productItems.reduce((acc: Record<string, any>, item: any) => {
        const ownerId = item.businessOwnerId;
        if (!acc[ownerId]) {
          acc[ownerId] = {
            shop: shopMap[ownerId] || null,
            businessOwnerId: ownerId,
            groupType: 'product' as const,
            items: []
          };
        }
        acc[ownerId].items.push({ ...item, shop: shopMap[ownerId] || undefined });
        return acc;
      }, {});

      // Group design items by designerId
      const designGroups = designItems.reduce((acc: Record<string, any>, item: any) => {
        const designerId = item.designerId;
        if (!acc[designerId]) {
          acc[designerId] = {
            designer: designerMap[designerId] || null,
            designerId: designerId,
            groupType: 'design' as const,
            items: []
          };
        }
        acc[designerId].items.push(item);
        return acc;
      }, {});

      // Combine both groups
      setGroupedItems([...Object.values(productGroups), ...Object.values(designGroups)]);
      setLoadingShops(false);
    };

    loadShopProfiles();
  }, [isBulkCheckout, bulkCheckoutItems, cartState.cart?.items]);

  // Handle address selection from AddressListModal
  const handleAddressSelect = (address: any) => {
    const addressData = {
      firstName: address.firstName,
      lastName: address.lastName,
      company: '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone,
    };
    
    if (isSelectingBilling) {
      setBillingAddress(addressData);
    } else {
      setShippingAddress(addressData);
      setSelectedAddressId(address.id);
      if (useSameAddress) {
        setBillingAddress(addressData);
      }
    }
    
    setShowAddressListModal(false);
    setIsSelectingBilling(false);
  };

  // Handle new address submission
  const handleNewAddressSubmit = async (address: Address, saveToProfile: boolean) => {
    if (isSelectingBilling) {
      setBillingAddress(address);
      setShowBillingAddressModal(false);
    } else {
      setShippingAddress(address);
      setShowShippingAddressModal(false);
      setSelectedAddressId(null);
      if (useSameAddress) {
        setBillingAddress(address);
      }
    }
    
    if (saveToProfile && user?.id) {
      try {
        // Check if this is the first address (will be set as default)
        const existingAddressesResponse = await fetch(`/api/users/${user.id}/addresses`);
        const existingData = await existingAddressesResponse.json();
        const isFirstAddress = !existingData.data || existingData.data.length === 0;
        
        const response = await fetch(`/api/users/${user.id}/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: address,
            setAsDefault: isFirstAddress // Set as default if it's the first address
          }),
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          console.log('[Checkout] Address saved successfully:', responseData);
          // Increment refresh trigger to reload address list
          setAddressRefreshTrigger(prev => prev + 1);
          // Reopen address list modal so user can see the saved address
          if (!isSelectingBilling) {
            setShowAddressListModal(true);
          }
        } else {
          console.error('[Checkout] Error saving address:', responseData.error);
          alert(`Failed to save address: ${responseData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('[Checkout] Error saving address:', error);
        alert('Failed to save address. Please try again.');
      }
    }
    
    setIsSelectingBilling(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getShopName = (group: { shop: ShopProfile | null; businessOwnerId: string }) => {
    if (group.shop) {
      return group.shop.shopName || group.shop.businessName || 'Shop';
    }
    return 'Shop';
  };

  const { calculateDiscount } = useCart();

  const calculateSubtotal = () => {
    if (isBulkCheckout) {
      return bulkCheckoutItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    return cartState.cart?.items.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const discountScope = cartState.discountScope;
    
    // Tax is calculated on subtotal after product/order discounts
    // Shipping discounts don't affect tax
    const taxableAmount = (discountScope === 'shipping') 
      ? subtotal 
      : Math.max(0, subtotal - discount);
    return taxableAmount * 0.08; // 8% tax
  };

  const calculateShipping = () => {
    // Only calculate shipping for product items (designs are digital, no shipping)
    const itemsToCheck = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
    const hasProducts = itemsToCheck.some((item: any) => item.itemType === 'product');
    return hasProducts ? 9.99 : 0; // Fixed shipping cost for products only
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    const shipping = calculateShipping();
    
    // If discount is for shipping, apply it to shipping instead of subtotal
    const discountScope = cartState.discountScope;
    if (discountScope === 'shipping') {
      // Shipping discount: subtract from shipping
      const shippingAfterDiscount = Math.max(0, shipping - discount);
      return Math.max(0, subtotal + tax + shippingAfterDiscount);
    } else {
      // Product/category/order discount: subtract from subtotal
      return Math.max(0, subtotal - discount + tax + shipping);
    }
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
    // Check if cart contains only designs (no shipping needed)
    const items = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
    const hasProducts = items.some((item: any) => item.itemType === 'product');
    const isDesignOnly = !hasProducts && items.some((item: any) => item.itemType === 'design');
    
    // Skip shipping address validation for design-only orders
    if (isDesignOnly) {
      // Designs are digital - no shipping address needed
      return true;
    }
    
    // For orders with products, shipping address is required
    if (!shippingAddress.address1) {
      setError('Please select a shipping address');
      return false;
    }
    
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
      if (!billingAddress.address1) {
        setError('Please select a billing address');
        return false;
      }
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

    // Only validate product items - designs don't need stock validation
    const productItems = itemsToProcess.filter((item: any) => item.itemType === 'product');
    
    // If no product items, skip validation
    if (productItems.length === 0) {
      console.log('No product items to validate, skipping stock validation');
      return true;
    }

    const stockValidationRequest = {
      items: productItems.map(item => ({
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

      // Group items by business owner (for products) or designer (for designs)
      const itemsToProcess = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
      
      // Separate products and designs
      const productItems = itemsToProcess.filter((item: any) => item.itemType === 'product');
      const designItems = itemsToProcess.filter((item: any) => item.itemType === 'design');
      
      // Group products by business owner
      const ordersByBusinessOwner = productItems.reduce((acc: Record<string, any[]>, item: any) => {
        const ownerId = item.businessOwnerId;
        if (!acc[ownerId]) {
          acc[ownerId] = [];
        }
        acc[ownerId].push(item);
        return acc;
      }, {});

      // Group designs by designer
      const ordersByDesigner = designItems.reduce((acc: Record<string, any[]>, item: any) => {
        const designerId = item.designerId;
        if (!acc[designerId]) {
          acc[designerId] = [];
        }
        acc[designerId].push(item);
        return acc;
      }, {});

      // Create orders for each business owner (products)
      const productOrderPromises = Object.entries(ordersByBusinessOwner).map(async ([businessOwnerId, items]) => {
        const orderData = {
          businessOwnerId,
          items: items.map((item: any) => ({
            itemType: 'product' as const,
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            customizations: {
              ...item.selectedVariants,
              colorId: item.selectedColorId,
              selectedColorName: item.selectedColorName,
              selectedDesign: item.selectedDesign,
              selectedSize: item.selectedSize,
            },
          })),
          shippingAddress,
          couponCode: cartState.couponCode || undefined,
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

      // Create orders for each designer (designs - no shipping)
      const designOrderPromises = Object.entries(ordersByDesigner).map(async ([designerId, items]) => {
        // For design-only orders, we don't need a shipping address
        // Create a minimal address structure if needed, or use null
        const minimalAddress = shippingAddress.address1 ? shippingAddress : {
          firstName: user?.name?.split(' ')[0] || '',
          lastName: user?.name?.split(' ')[1] || '',
          address1: 'Digital Delivery',
          city: 'N/A',
          state: 'N/A',
          zipCode: '00000',
          country: 'N/A',
          phone: user?.phone || ''
        };
        
        const orderData = {
          businessOwnerId: designerId, // Use designerId as businessOwnerId for design orders
          items: items.map((item: any) => ({
            itemType: 'design' as const,
            designId: item.designId,
            quantity: item.quantity,
            price: item.unitPrice,
            designName: item.design?.name,
            designType: item.design?.designType,
            storagePath: item.design?.storagePath,
            storageBucket: item.design?.storageBucket,
          })),
          shippingAddress: minimalAddress, // Minimal address for design orders (not used but required by schema)
          couponCode: cartState.couponCode || undefined,
          billingAddress: useSameAddress ? minimalAddress : (billingAddress.address1 ? billingAddress : minimalAddress),
          paymentMethod: 'xendit',
          notes: orderNotes,
          shippingCost: 0, // Digital designs have no shipping cost
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
          throw new Error(errorData.error || 'Failed to create design order');
        }

        return response.json();
      });

      // Create all orders (products and designs)
      const allOrderPromises = [...productOrderPromises, ...designOrderPromises];
      const orders = await Promise.all(allOrderPromises);
      console.log('[Checkout] Orders created:', orders.map(o => ({
        id: o.order.id,
        totalAmount: o.order.totalAmount,
        discountAmount: o.order.discountAmount,
        appliedCouponCode: o.order.appliedCouponCode
      })));
      setCreatedOrders(orders);
      setCurrentStep('payment');
      
      // Clear bulk checkout items from sessionStorage after order is created
      if (isBulkCheckout) {
        sessionStorage.removeItem('bulkCheckoutItems');
        console.log('[Checkout] Cleared bulk checkout items from sessionStorage after order creation');
      }
      
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
      <Header title="Checkout" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Back to Cart Button */}
            <div className="mb-2">
              <Link href="/cart">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cart
                </Button>
              </Link>
            </div>
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
              <div className="space-y-4">
            {/* Order Review Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => setOrderReviewExpanded(!orderReviewExpanded)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900">Order Review</h2>
                {orderReviewExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              {orderReviewExpanded && (
                <div className="px-6 pb-6 border-t border-gray-200">
                  {loadingShops ? (
                    <div className="space-y-4 pt-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                          <div className="space-y-3">
                            <div className="flex space-x-4">
                              <div className="w-16 h-16 bg-gray-200 rounded"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : groupedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No items to review</p>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-4">
                      {groupedItems.map((group) => {
                        const groupKey = group.businessOwnerId || group.designerId || 'unknown';
                        const isDesignGroup = group.groupType === 'design';
                        
                        return (
                        <div key={groupKey} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                          {/* Shop/Designer Header */}
                          <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-gray-100">
                            {isDesignGroup ? (
                              <User className="w-4 h-4 text-gray-600" />
                            ) : (
                              <Store className="w-4 h-4 text-gray-600" />
                            )}
                            <h3 className="font-semibold text-sm text-gray-900">
                              {isDesignGroup ? (
                                group.designer?.businessName || group.designer?.displayName || 'Designer'
                              ) : group.shop?.username ? (
                                <Link 
                                  href={`/shops/${group.shop.username}`}
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  {getShopName(group)}
                                </Link>
                              ) : (
                                getShopName(group)
                              )}
                            </h3>
                          </div>

                          {/* Items from this shop/designer */}
                          <div className="space-y-4">
                            {group.items.map((item) => {
                              const isDesign = item.itemType === 'design';
                              
                              return (
                              <div key={item.id} className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                                {/* Product/Design Image */}
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  {isDesign ? (
                                    // Design item - show watermarked image
                                    item.design?.storagePath && item.design?.storageBucket ? (
                                      <WatermarkedImage
                                        storagePath={item.design.storagePath}
                                        storageBucket={item.design.storageBucket}
                                        designId={item.designId}
                                        isFree={false}
                                        designType={item.design?.designType}
                                        alt={item.design?.name || 'Design'}
                                        className="w-full h-full object-cover"
                                        fallbackSrc={item.design?.thumbnailUrl}
                                      />
                                    ) : item.design?.thumbnailUrl ? (
                                      <img
                                        src={item.design.thumbnailUrl}
                                        alt={item.design.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )
                                  ) : item.product?.images && item.product.images.length > 0 ? (
                                    <img
                                      src={item.product.images[0].imageUrl}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                {/* Product/Design Details */}
                                <div className="flex-1 min-w-0 w-full sm:w-auto">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-gray-900 mb-1 flex-1">
                                      {isDesign 
                                        ? (item.design?.name || `Design ${item.designId?.slice(-8)}`)
                                        : (item.product?.name || `Product ${item.productId?.slice(-8)}`)
                                      }
                                    </h4>
                                    {isDesign && item.design?.designType && (
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        item.design.designType === 'premium' 
                                          ? 'bg-purple-100 text-purple-700' 
                                          : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {item.design.designType}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Variant Info (for products) */}
                                  {!isDesign && (item.selectedDesign || item.selectedSize || (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) || item.selectedColorId) && (
                                    <div className="text-sm text-gray-400 mb-2 space-y-0.5">
                                      {item.selectedDesign && (
                                        <div>Design: {item.selectedDesign.name}</div>
                                      )}
                                      {item.selectedSize && (
                                        <div>Size: {item.selectedSize.name}</div>
                                      )}
                                      {item.selectedVariants && Object.entries(item.selectedVariants).map(([key, value]) => (
                                        <div key={key}>{key}: {value}</div>
                                      ))}
                                      {item.selectedColorId && (
                                        <div>Color: {item.selectedColorName || item.selectedColorId}</div>
                                      )}
                                    </div>
                                  )}

                                  {/* Price and Quantity Row */}
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 space-y-1 sm:space-y-0">
                                    <div className="flex items-center space-x-4 text-sm">
                                      <span className="text-gray-600">
                                        {formatPrice(item.unitPrice)}
                                      </span>
                                      <span className="text-gray-500">
                                        x{item.quantity}
                                      </span>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                      {formatPrice(item.totalPrice)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )})}
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shipping Address - Only show for orders with physical products */}
            {(() => {
              const items = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
              const hasProducts = items.some((item: any) => item.itemType === 'product');
              const isDesignOnly = !hasProducts && items.some((item: any) => item.itemType === 'design');
              
              // Hide shipping address section for design-only orders
              if (isDesignOnly) {
                return null;
              }
              
              return (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold">Shipping Address</h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddressListModal(true)}
                    >
                      {shippingAddress.address1 ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Change Address
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Choose Address
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {shippingAddress.address1 ? (
                    <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-gray-900">
                              {shippingAddress.firstName} {shippingAddress.lastName}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 ml-6">
                            <p>{shippingAddress.address1}</p>
                            {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                            <p>
                              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                            </p>
                            <p>{shippingAddress.country}</p>
                            <p className="text-gray-500">📱 {shippingAddress.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No shipping address selected</p>
                      <Button
                        onClick={() => setShowAddressListModal(true)}
                        className="mx-auto"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Choose Shipping Address
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}

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
                    onChange={(e) => {
                      setUseSameAddress(e.target.checked);
                      if (e.target.checked) {
                        setBillingAddress(shippingAddress);
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Same as shipping address</span>
                </label>
              </div>
              
              {useSameAddress ? (
                <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Billing address will be the same as shipping address
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {billingAddress.address1 ? (
                    <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-gray-900">
                              {billingAddress.firstName} {billingAddress.lastName}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1 ml-6">
                            <p>{billingAddress.address1}</p>
                            {billingAddress.address2 && <p>{billingAddress.address2}</p>}
                            <p>
                              {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}
                            </p>
                            <p>{billingAddress.country}</p>
                            <p className="text-gray-500">📱 {billingAddress.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        Please provide a different billing address
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsSelectingBilling(true);
                          setShowAddressListModal(true);
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Choose Billing Address
                      </Button>
                    </>
                  )}
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

              </div>
            )}

            {currentStep === 'payment' && createdOrders.length > 0 && (
              <div className="space-y-4">
                <XenditPaymentForm
                  orderId={createdOrders[0].order.id}
                  orderIds={createdOrders.map(o => o.order.id)}
                  amount={(() => {
                    // Calculate the total from orders (should include discount)
                    const orderTotal = createdOrders.reduce((sum, order) => {
                      console.log('[Checkout] Order totalAmount:', order.order.totalAmount, 'discountAmount:', order.order.discountAmount, 'appliedCouponCode:', order.order.appliedCouponCode);
                      return sum + order.order.totalAmount;
                    }, 0);
                    
                    // Also calculate from cart state for comparison (this is what's shown in the summary)
                    const calculatedTotal = calculateTotal();
                    console.log('[Checkout] Payment amount - Order total:', orderTotal, 'Calculated total (from cart):', calculatedTotal);
                    
                    // Use the calculated total from cart state to match what's shown in the order summary
                    // This ensures the payment amount matches what the user sees
                    // The order's totalAmount should match this, but if there's a discrepancy, use the calculated value
                    return calculatedTotal;
                  })()}
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

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm lg:sticky lg:top-4 lg:h-fit">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              {/* Coupon Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Have a coupon code?
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCouponModal(true)}
                  >
                    Browse Discounts
                  </Button>
                </div>
                {cartState.couponCode && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Coupon Applied: {cartState.couponCode}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await removeCoupon();
                        }}
                        className="text-green-700 hover:text-green-900"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Totals */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(calculateDiscount())}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {(() => {
                      const shipping = calculateShipping();
                      const shippingDiscount = cartState.discountScope === 'shipping' ? calculateDiscount() : 0;
                      const finalShipping = Math.max(0, shipping - shippingDiscount);
                      // Show "Free" for design-only orders
                      const itemsToCheck = isBulkCheckout ? bulkCheckoutItems : cartState.cart?.items || [];
                      const hasProducts = itemsToCheck.some((item: any) => item.itemType === 'product');
                      if (!hasProducts && itemsToCheck.some((item: any) => item.itemType === 'design')) {
                        return <span className="text-green-600 font-medium">Free (Digital)</span>;
                      }
                      return formatPrice(finalShipping);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(calculateTax())}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 mt-2">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {/* Continue to Payment Button */}
              {currentStep === 'address' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleCreateOrders}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Orders...' : 'Continue to Payment'}
                  </Button>
                </div>
              )}

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

      {/* Address Selection Modals */}
      {showAddressListModal && user?.id && (
        <AddressListModal
          userId={user.id}
          onSelect={handleAddressSelect}
          onAddNew={() => {
            setShowAddressListModal(false);
            if (isSelectingBilling) {
              setShowBillingAddressModal(true);
            } else {
              setShowShippingAddressModal(true);
            }
          }}
          onClose={() => {
            setShowAddressListModal(false);
            setIsSelectingBilling(false);
          }}
          refreshTrigger={addressRefreshTrigger}
        />
      )}

      {showShippingAddressModal && (
        <ShippingAddressModal
          onSubmit={handleNewAddressSubmit}
          onClose={() => setShowShippingAddressModal(false)}
          userName={user?.name}
          userId={user?.id}
        />
      )}

      {showBillingAddressModal && (
        <ShippingAddressModal
          onSubmit={handleNewAddressSubmit}
          onClose={() => {
            setShowBillingAddressModal(false);
            setIsSelectingBilling(false);
          }}
          userName={user?.name}
          userId={user?.id}
        />
      )}

      {/* Coupon Selection Modal */}
      {showCouponModal && (
        <CouponSelectionModal
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          onSelect={async (couponCode, discountId) => {
            console.log('[Checkout] Coupon selected:', { couponCode, discountId });
            if (couponCode) {
              // Apply the coupon code
              console.log('[Checkout] Applying coupon code:', couponCode);
              const result = await applyCoupon(couponCode);
              console.log('[Checkout] Coupon apply result:', result);
              if (result.success) {
                setShowCouponModal(false);
              } else {
                // Show error if coupon application failed
                setError(result.error || 'Failed to apply coupon');
              }
            } else if (discountId) {
              // For discounts without coupons, we can't apply them directly
              // They need a coupon code to be applied
              setError('This discount requires a coupon code. Please enter the coupon code for this discount.');
            } else {
              setError('Please select a discount or enter a coupon code');
            }
          }}
          orderAmount={calculateSubtotal()}
          shippingCost={calculateShipping()}
          productIds={isBulkCheckout 
            ? bulkCheckoutItems.filter((item: any) => item.itemType === 'product').map((item: any) => item.productId)
            : cartState.cart?.items.filter((item: any) => item.itemType === 'product').map((item: any) => item.productId) || []}
          categoryIds={[]} // Could be fetched from products if needed
          currentCouponCode={cartState.couponCode}
        />
      )}
    </div>
  );
}

