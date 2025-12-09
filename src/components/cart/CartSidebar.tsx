'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  ArrowRight,
  Package,
  Trash,
  AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

export function CartSidebar() {
  const { state, removeItem, updateQuantity, closeCart, getTotalAmount } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [stockWarnings, setStockWarnings] = useState<Record<string, { available: number; requested: number }>>({});
  const [inactiveWarnings, setInactiveWarnings] = useState<Record<string, { status: string }>>({});

  // Check stock availability for cart items
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
    // Find the item to check if it's valid
    const item = state.cart?.items.find(cartItem => cartItem.id === itemId);
    if (!item) return;

    // Don't allow selection of inactive or out-of-stock items
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
      // Only select valid items (not inactive or out-of-stock)
      const validItems = state.cart?.items.filter(item => 
        !inactiveWarnings[item.productId] && !stockWarnings[item.productId]
      ) || [];
      setSelectedItems(new Set(validItems.map(item => item.id)));
    }
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
    
    // Create a temporary cart with only selected items
    const selectedCartItems = state.cart?.items.filter(item => selectedItems.has(item.id)) || [];
    
    // Double-check that all selected items are valid
    const hasInvalidItems = selectedCartItems.some(item => 
      inactiveWarnings[item.productId] || stockWarnings[item.productId]
    );
    
    if (hasInvalidItems) {
      alert('Cannot proceed to checkout with inactive or out-of-stock items. Please remove them from your selection.');
      return;
    }
    
    // Store selected items in sessionStorage for checkout page
    sessionStorage.setItem('bulkCheckoutItems', JSON.stringify(selectedCartItems));
    
    // Navigate to checkout
    window.location.href = '/checkout?bulk=true';
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

  if (!state.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {state.cart?.totalItems || 0} {(state.cart?.totalItems || 0) === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk Actions */}
        {state.cart && state.cart.items.length > 0 && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                  >
                    <Trash className="w-4 h-4" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {!state.cart || state.cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-4">Add some products to get started!</p>
              <Button onClick={closeCart} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.cart?.items.map((item) => {
                const isInvalid = inactiveWarnings[item.productId] || stockWarnings[item.productId];
                return (
                <div key={item.id} className={`flex space-x-3 p-3 border rounded-lg ${
                  isInvalid ? 'opacity-60 bg-gray-50' : ''
                }`}>
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
                    <Link href={`/products/${item.productId}`} onClick={closeCart}>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onLoad={() => {
                              console.log('Cart image loaded successfully:', item.product.images?.[0]?.imageUrl);
                            }}
                            onError={(e) => {
                              console.error('Cart image failed to load:', item.product.images?.[0]?.imageUrl || 'No image URL');
                              console.error('Full image data:', item.product.images?.[0]);
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
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
                    <Link href={`/products/${item.productId}`} onClick={closeCart}>
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

                    {/* Inactive Product Warning */}
                    {inactiveWarnings[item.productId] && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <p className="text-xs text-red-600">
                          Product is {inactiveWarnings[item.productId].status}
                        </p>
                      </div>
                    )}

                    {/* Stock Warning */}
                    {stockWarnings[item.productId] && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <p className="text-xs text-red-600">
                          Only {stockWarnings[item.productId].available} available
                        </p>
                      </div>
                    )}

                    {/* Price and Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
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
                          <Minus className="w-3 h-3" />
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
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {formatPrice(item.totalPrice)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.cart && state.cart.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>{formatPrice(selectedItems.size > 0 ? getSelectedTotalAmount() : getTotalAmount())}</span>
            </div>

            {/* Checkout Button */}
            {selectedItems.size > 0 ? (
              <Button 
                onClick={handleBulkCheckout}
                className="w-full flex items-center justify-center space-x-2"
              >
                <span>Checkout Selected ({selectedItems.size})</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Link href="/checkout" onClick={closeCart}>
                <Button className="w-full flex items-center justify-center space-x-2">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {/* Continue Shopping */}
            <Link href="/explore">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={closeCart}
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
