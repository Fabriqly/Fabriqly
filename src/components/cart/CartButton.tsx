'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { CartDropdown } from './CartDropdown';

interface CartButtonProps {
  className?: string;
  showCount?: boolean;
}

export function CartButton({ className = '', showCount = true }: CartButtonProps) {
  const { getItemCount } = useCart();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemCount = getItemCount();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleClick = (e: React.MouseEvent) => {
    // On mobile (< 768px), redirect to cart page
    if (window.innerWidth < 768) {
      router.push('/cart');
      return;
    }

    // On desktop, toggle dropdown
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        className={`relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors ${className}`}
        aria-label="Shopping Cart"
      >
        <ShoppingCart className="w-5 h-5" />
        {showCount && itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>
      
      {/* Desktop Dropdown - Hidden on mobile */}
      {isDropdownOpen && (
        <div className="hidden md:block">
          <CartDropdown onClose={() => setIsDropdownOpen(false)} />
        </div>
      )}
    </div>
  );
}


