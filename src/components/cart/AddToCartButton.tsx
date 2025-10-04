'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { ProductWithDetails } from '@/types/products';
import { ShoppingCart, Check, LogIn } from 'lucide-react';

interface AddToCartButtonProps {
  product: ProductWithDetails;
  quantity: number;
  selectedVariants: Record<string, string>;
  selectedColorId?: string;
  selectedColorName?: string;
  colorPriceAdjustment?: number;
  businessOwnerId: string;
  className?: string;

  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function AddToCartButton({
  product,
  quantity,
  selectedVariants,
  selectedColorId,
  selectedColorName,
  colorPriceAdjustment = 0,
  businessOwnerId,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}: AddToCartButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem, isItemInCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const calculateUnitPrice = () => {
    let unitPrice = product.price + colorPriceAdjustment;
    
    // Add variant price adjustments
    Object.entries(selectedVariants).forEach(([variantName, variantValue]) => {
      const variant = product.variants?.find(
        v => v.variantName === variantName && v.variantValue === variantValue
      );
      if (variant) {
        unitPrice += variant.priceAdjustment;
      }
    });
    
    return unitPrice;
  };

  const handleAddToCart = async () => {
    // Check if user is logged in
    if (!session?.user) {
      // Redirect to login page
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (isAdding || disabled) return;

    setIsAdding(true);
    
    try {
      await addItem({
        productId: product.id,
        quantity,
        selectedVariants,
        selectedColorId,
        selectedColorName,
        colorPriceAdjustment,
        businessOwnerId,
      });

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const itemExists = isItemInCart(product.id, selectedVariants, selectedColorId);

  // Show "Login to Purchase" for guests
  if (!session?.user) {
    return (
      <Button
        onClick={handleAddToCart}
        disabled={disabled}
        variant={variant}
        size={size}
        className={`flex items-center space-x-2 ${className}`}
      >
        <LogIn className="w-4 h-4" />
        <span>Login to Purchase</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || quantity < 1 || disabled}
      variant={variant}
      size={size}
      className={`flex items-center space-x-2 ${className} ${
        isAdded ? 'bg-green-600 hover:bg-green-700' : ''
      }`}
    >
      {isAdded ? (
        <>
          <Check className="w-4 h-4" />
          <span>Added to Cart</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          <span>
            {isAdding ? 'Adding...' : itemExists ? 'Update Cart' : 'Add to Cart'}
          </span>
        </>
      )}
    </Button>
  );
}
