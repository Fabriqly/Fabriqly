'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { ProductWithDetails } from '@/types/products';
import { ShoppingCart, Check } from 'lucide-react';

interface AddToCartButtonProps {
  product: ProductWithDetails;
  quantity: number;
  selectedVariants: Record<string, string>;
  selectedColorId?: string;
  colorPriceAdjustment?: number;
  businessOwnerId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function AddToCartButton({
  product,
  quantity,
  selectedVariants,
  selectedColorId,
  colorPriceAdjustment = 0,
  businessOwnerId,
  className = '',
  variant = 'default',
  size = 'md'
}: AddToCartButtonProps) {
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
    if (isAdding) return;

    setIsAdding(true);
    
    try {
      await addItem({
        productId: product.id,
        quantity,
        selectedVariants,
        selectedColorId,
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

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding || quantity < 1}
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
