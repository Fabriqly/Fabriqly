'use client';

import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

interface CartButtonProps {
  className?: string;
  showCount?: boolean;
}

export function CartButton({ className = '', showCount = true }: CartButtonProps) {
  const { toggleCart, getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <button
      onClick={toggleCart}
      className={`relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {showCount && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}


