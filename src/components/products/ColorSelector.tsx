'use client';

import React, { useState, useEffect } from 'react';
import { ProductColorWithDetails } from './ProductColorManager';
import { CheckCircle, XCircle } from 'lucide-react';

interface ColorSelectorProps {
  productColors: ProductColorWithDetails[];
  selectedColorId?: string;
  onColorSelect: (colorId: string, priceAdjustment: number) => void;
  basePrice: number;
  className?: string;
}

export function ColorSelector({ 
  productColors, 
  selectedColorId, 
  onColorSelect, 
  basePrice,
  className = ''
}: ColorSelectorProps) {
  const [selectedColor, setSelectedColor] = useState<string>(selectedColorId || '');

  useEffect(() => {
    if (selectedColorId) {
      setSelectedColor(selectedColorId);
    }
  }, [selectedColorId]);

  const handleColorSelect = (colorId: string, priceAdjustment: number) => {
    setSelectedColor(colorId);
    onColorSelect(colorId, priceAdjustment);
  };

  const getTotalPrice = (priceAdjustment: number) => {
    return basePrice + priceAdjustment;
  };

  if (productColors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap gap-3">
        {productColors.map((productColor) => {
          const isSelected = selectedColor === productColor.colorId;
          const isAvailable = productColor.isAvailable;

          return (
            <button
              key={productColor.colorId}
              onClick={() => {
                if (isAvailable) {
                  handleColorSelect(productColor.colorId, productColor.priceAdjustment);
                }
              }}
              disabled={!isAvailable}
              className={`
                relative group flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                  : isAvailable 
                    ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' 
                    : 'border-slate-100 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {/* Color Swatch */}
              <div 
                className="w-8 h-8 rounded-md border border-slate-200 shadow-sm flex-shrink-0"
                style={{ backgroundColor: productColor.color.hexCode }}
              />

              {/* Color Name and Price Modifier */}
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-indigo-900' : 'text-slate-900'
                }`}>
                  {productColor.color.colorName}
                </span>
                {productColor.priceAdjustment !== 0 && (
                  <span className={`text-xs font-medium ${
                    productColor.priceAdjustment > 0 
                      ? 'text-indigo-600' 
                      : 'text-green-600'
                  }`}>
                    {productColor.priceAdjustment > 0 ? '+' : ''}₱{productColor.priceAdjustment.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              )}

              {/* Unavailable Indicator */}
              {!isAvailable && (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
