'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Package, ArrowRight, Loader } from 'lucide-react';
import { CartSkeleton } from './CartSkeleton';

interface CartDropdownProps {
  onClose?: () => void;
}

export function CartDropdown({ onClose }: CartDropdownProps) {
  const { state, refreshCart } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.loading) {
      setLoading(true);
    } else if (!state.cart) {
      setLoading(true);
      refreshCart().then(() => setLoading(false)).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cart, state.loading]);

  const recentItems = state.cart?.items
    ?.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 4) || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
        {state.cart && state.cart.totalItems > 0 && (
          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            {state.cart.totalItems} {state.cart.totalItems === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-4">
            <CartSkeleton />
          </div>
        ) : !state.cart || state.cart.items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-medium text-gray-600 mb-2">Your cart is empty</p>
            <p className="text-xs text-gray-500">Add some products to get started!</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.productId}`}
                onClick={onClose}
                className="flex space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Qty: {item.quantity}
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatPrice(item.totalPrice)}
                  </p>
                </div>
              </Link>
            ))}
            {state.cart.items.length > 4 && (
              <div className="text-center text-xs text-gray-500 pt-2">
                +{state.cart.items.length - 4} more {state.cart.items.length - 4 === 1 ? 'item' : 'items'}
              </div>
            )}
          </div>
        )}
      </div>

      {state.cart && state.cart.items.length > 0 && (
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(state.cart.totalAmount)}
            </span>
          </div>
          <Link
            href="/cart"
            onClick={onClose}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <span>View Full Cart</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

