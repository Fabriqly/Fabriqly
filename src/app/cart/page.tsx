'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { Button } from '@/components/ui/Button';
import { CartPageSkeleton } from '@/components/cart/CartSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  ArrowRight,
  Package,
  Trash,
  AlertTriangle,
  Store,
  X
} from 'lucide-react';
import { ShopProfile } from '@/types/shop-profile';
import { CartItem } from '@/types/cart';

interface GroupedCartItem extends CartItem {
  shop?: ShopProfile;
}

interface ShopGroup {
  shop: ShopProfile | null;
  businessOwnerId: string;
  items: GroupedCartItem[];
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, removeItem, updateQuantity, refreshCart, getTotalAmount } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [stockWarnings, setStockWarnings] = useState<Record<string, { available: number; requested: number }>>({});
  const [inactiveWarnings, setInactiveWarnings] = useState<Record<string, { status: string }>>({});
  const [shopProfiles, setShopProfiles] = useState<Record<string, ShopProfile | null>>({});
  const [loadingShops, setLoadingShops] = useState(true);
  const [groupedItems, setGroupedItems] = useState<ShopGroup[]>([]);

  // Load cart on mount
  useEffect(() => {
    if (user?.id && !state.cart && !state.loading) {
      refreshCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Group items by shop and load shop profiles
  useEffect(() => {
    if (!state.cart?.items || state.cart.items.length === 0) {
      setGroupedItems([]);
      setLoadingShops(false);
      return;
    }

    const loadShopProfiles = async () => {
      setLoadingShops(true);
      const uniqueOwnerIds = [...new Set(state.cart.items.map(item => item.businessOwnerId))];
      const shopMap: Record<string, ShopProfile | null> = {};

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

      setShopProfiles(shopMap);

      // Group items by businessOwnerId
      const grouped = state.cart.items.reduce((acc, item) => {
        const ownerId = item.businessOwnerId;
        if (!acc[ownerId]) {
          acc[ownerId] = {
            shop: shopMap[ownerId] || null,
            businessOwnerId: ownerId,
            items: []
          };
        }
        acc[ownerId].items.push({ ...item, shop: shopMap[ownerId] || undefined });
        return acc;
      }, {} as Record<string, ShopGroup>);

      setGroupedItems(Object.values(grouped));
      setLoadingShops(false);
    };

    loadShopProfiles();
  }, [state.cart?.items]);

  // Check stock availability
  useEffect(() => {
    const checkStock = async () => {
      if (!state.cart?.items || state.cart.items.length === 0) {
        setStockWarnings({});
        setInactiveWarnings({});
        return;
      }

      try {
        const stockValidationRequest = {
          items: state.cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        };

        const response = await fetch('/api/cart/validate-stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stockValidationRequest),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const stockWarnings: Record<string, { available: number; requested: number }> = {};
          const inactiveWarnings: Record<string, { status: string }> = {};
          
          if (data.data.outOfStockItems) {
            data.data.outOfStockItems.forEach((item: any) => {
              stockWarnings[item.productId] = {
                available: item.availableQuantity,
                requested: item.requestedQuantity
              };
            });
          }
          
          if (data.data.inactiveItems) {
            data.data.inactiveItems.forEach((item: any) => {
              inactiveWarnings[item.productId] = {
                status: item.status
              };
            });
          }
          
          setStockWarnings(stockWarnings);
          setInactiveWarnings(inactiveWarnings);
        }
      } catch (error) {
        console.error('Error checking stock:', error);
      }
    };

    checkStock();
  }, [state.cart?.items]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleItemSelect = (itemId: string) => {
    const item = state.cart?.items.find(cartItem => cartItem.id === itemId);
    if (!item) return;

    if (inactiveWarnings[item.productId] || stockWarnings[item.productId]) {
      return;
    }

    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === state.cart?.items.length) {
      setSelectedItems(new Set());
    } else {
      const validItems = state.cart?.items.filter(item => 
        !inactiveWarnings[item.productId] && !stockWarnings[item.productId]
      ) || [];
      setSelectedItems(new Set(validItems.map(item => item.id)));
    }
  };

  const handleSelectShopItems = (group: ShopGroup) => {
    const shopItemIds = group.items.map(item => item.id);
    const validShopItems = group.items.filter(item => 
      !inactiveWarnings[item.productId] && !stockWarnings[item.productId]
    );
    const validShopItemIds = validShopItems.map(item => item.id);
    
    // Check if all valid items from this shop are already selected
    const allSelected = validShopItemIds.every(id => selectedItems.has(id));
    
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      // Deselect all items from this shop
      shopItemIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all valid items from this shop
      validShopItemIds.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const isShopAllSelected = (group: ShopGroup) => {
    const validShopItems = group.items.filter(item => 
      !inactiveWarnings[item.productId] && !stockWarnings[item.productId]
    );
    if (validShopItems.length === 0) return false;
    return validShopItems.every(item => selectedItems.has(item.id));
  };

  const handleBulkDelete = async () => {
    const itemsToDelete = Array.from(selectedItems);
    for (const itemId of itemsToDelete) {
      await removeItem(itemId);
    }
    setSelectedItems(new Set());
  };

  const handleBulkCheckout = () => {
    if (selectedItems.size === 0) return;
    
    const selectedCartItems = state.cart?.items.filter(item => selectedItems.has(item.id)) || [];
    
    const hasInvalidItems = selectedCartItems.some(item => 
      inactiveWarnings[item.productId] || stockWarnings[item.productId]
    );
    
    if (hasInvalidItems) {
      alert('Cannot proceed to checkout with inactive or out-of-stock items. Please remove them from your selection.');
      return;
    }
    
    sessionStorage.setItem('bulkCheckoutItems', JSON.stringify(selectedCartItems));
    router.push('/checkout?bulk=true');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const getSelectedTotalAmount = () => {
    if (!state.cart?.items || selectedItems.size === 0) return 0;
    
    return state.cart.items
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getShopName = (group: ShopGroup) => {
    if (group.shop) {
      return group.shop.shopName || group.shop.businessName || 'Shop';
    }
    return 'Shop';
  };

  if (state.loading || loadingShops) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader user={user} />
        <div className="flex gap-8 p-8">
          <CustomerNavigationSidebar />
          <main className="flex-1">
            <CartPageSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={user} />
      
      <div className="flex gap-8 p-8">
        {/* Left Sidebar - Navigation */}
        <CustomerNavigationSidebar />

        {/* Right Content Area */}
        <main className="flex-1">
          <div className="max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Shopping Cart</h1>
              {state.cart && state.cart.items.length > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === state.cart.items.length && state.cart.items.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">
                      Select All ({selectedItems.size} selected)
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                    >
                      <Trash className="w-4 h-4" />
                      <span>Delete Selected</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Empty Cart */}
            {!state.cart || state.cart.items.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Add some products to get started!</p>
                <Link href="/explore">
                  <Button>
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              /* Shop Groups */
              <div className="space-y-6">
                {groupedItems.map((group, groupIndex) => (
                  <div key={group.businessOwnerId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Shop Header */}
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={isShopAllSelected(group)}
                        onChange={() => handleSelectShopItems(group)}
                        className="rounded border-gray-300 cursor-pointer"
                      />
                      <Store className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        {group.shop?.username ? (
                          <Link 
                            href={`/shops/${group.shop.username}`}
                            className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {getShopName(group)}
                          </Link>
                        ) : (
                          <h3 className="font-semibold text-sm text-gray-900">{getShopName(group)}</h3>
                        )}
                      </div>
                    </div>

                    {/* Items from this shop */}
                    <div className="divide-y divide-gray-100">
                      {group.items.map((item) => {
                        const isInvalid = inactiveWarnings[item.productId] || stockWarnings[item.productId];
                        return (
                          <div
                            key={item.id}
                            className={`flex space-x-4 p-4 ${isInvalid ? 'opacity-60 bg-gray-50' : ''}`}
                          >
                            {/* Checkbox */}
                            <div className="flex-shrink-0 flex items-start pt-1">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleItemSelect(item.id)}
                                disabled={!!(inactiveWarnings[item.productId] || stockWarnings[item.productId])}
                                className={`rounded border-gray-300 ${
                                  !!(inactiveWarnings[item.productId] || stockWarnings[item.productId])
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }`}
                              />
                            </div>

                            {/* Product Image */}
                            <div className="flex-shrink-0">
                              <Link href={`/products/${item.productId}`}>
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                  {item.product.images && item.product.images.length > 0 ? (
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
                              </Link>
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <Link href={`/products/${item.productId}`}>
                                <h4 className="font-medium text-sm text-gray-900 truncate hover:text-blue-600 cursor-pointer">
                                  {item.product.name}
                                </h4>
                              </Link>
                              
                              {/* Variants */}
                              {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {Object.entries(item.selectedVariants).map(([key, value]) => (
                                    <span key={key} className="block">
                                      {key}: {value}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Color */}
                              {item.selectedColorId && (
                                <div className="text-xs text-gray-500">
                                  Color: {item.selectedColorName || item.selectedColorId}
                                </div>
                              )}

                              {/* Warnings */}
                              {inactiveWarnings[item.productId] && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <p className="text-xs text-red-600">
                                    Product is {inactiveWarnings[item.productId].status}
                                  </p>
                                </div>
                              )}

                              {stockWarnings[item.productId] && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <p className="text-xs text-red-600">
                                    Only {stockWarnings[item.productId].available} available
                                  </p>
                                </div>
                              )}

                              {/* Quantity and Price Controls */}
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    disabled={!!(inactiveWarnings[item.productId] || stockWarnings[item.productId])}
                                    className={`p-1 rounded ${
                                      !!(inactiveWarnings[item.productId] || stockWarnings[item.productId])
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="text-sm font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    disabled={!!(inactiveWarnings[item.productId] || stockWarnings[item.productId])}
                                    className={`p-1 rounded ${
                                      !!(inactiveWarnings[item.productId] || stockWarnings[item.productId])
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-medium">
                                    {formatPrice(item.totalPrice)}
                                  </span>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1 hover:bg-red-50 text-red-500 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Order Summary (Fixed Bottom on Mobile, Sticky on Desktop) */}
          {state.cart && state.cart.items.length > 0 && (
            <div className="lg:col-span-1">
              {/* Mobile: Fixed Bottom Bar */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-lg font-bold text-gray-900 ml-2">
                      {formatPrice(getSelectedTotalAmount())}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <Button 
                  onClick={handleBulkCheckout}
                  disabled={selectedItems.size === 0}
                  className="w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {selectedItems.size > 0 
                      ? `Checkout Selected (${selectedItems.size})` 
                      : 'Select Items to Checkout'}
                  </span>
                  {selectedItems.size > 0 && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
              
              {/* Desktop: Sticky Sidebar */}
              <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                {selectedItems.size === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Select items to see order summary</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900 font-medium">
                        {formatPrice(getSelectedTotalAmount())}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedItems.size}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(getSelectedTotalAmount())}
                        </span>
                      </div>
                    </div>
                    
                    {/* Checkout Button */}
                    <Button 
                      onClick={handleBulkCheckout}
                      className="w-full flex items-center justify-center space-x-2 mt-6"
                    >
                      <span>Checkout Selected ({selectedItems.size})</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Continue Shopping */}
                    <Link href="/explore">
                      <Button 
                        variant="outline" 
                        className="w-full mt-3"
                      >
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Spacer for mobile fixed bottom bar */}
        {state.cart && state.cart.items.length > 0 && (
          <div className="lg:hidden h-32"></div>
        )}
          </div>
      </main>
    </div>
      
      <ScrollToTop />
    </div>
  );
}

