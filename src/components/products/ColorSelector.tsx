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
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Colors</h3>
        <p className="text-sm text-gray-600">
          Select a color to see pricing and availability
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {productColors.map((productColor) => {
          const isSelected = selectedColor === productColor.colorId;
          const isAvailable = productColor.isAvailable;
          const totalPrice = getTotalPrice(productColor.priceAdjustment);

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
                relative group p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : isAvailable 
                    ? 'border-gray-200 hover:border-gray-300 hover:shadow-md' 
                    : 'border-gray-100 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {/* Color Swatch */}
              <div 
                className="w-full h-16 rounded-md mb-2 shadow-sm"
                style={{ backgroundColor: productColor.color.hexCode }}
              />

              {/* Color Info */}
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {productColor.color.colorName}
                </div>
                
                {/* Price */}
                <div className="text-xs text-gray-600 mt-1">
                  {productColor.priceAdjustment !== 0 && (
                    <span className={productColor.priceAdjustment > 0 ? 'text-red-600' : 'text-green-600'}>
                      {productColor.priceAdjustment > 0 ? '+' : ''}${productColor.priceAdjustment.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Total Price */}
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  ${totalPrice.toFixed(2)}
                </div>

                {/* Stock Info */}
                {productColor.stockQuantity !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    {productColor.stockQuantity > 0 
                      ? `${productColor.stockQuantity} in stock`
                      : 'Out of stock'
                    }
                  </div>
                )}
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Unavailable Indicator */}
              {!isAvailable && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Hover Effect */}
              {isAvailable && !isSelected && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Color Details */}
      {selectedColor && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          {(() => {
            const selectedProductColor = productColors.find(pc => pc.colorId === selectedColor);
            if (!selectedProductColor) return null;

            return (
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-200"
                  style={{ backgroundColor: selectedProductColor.color.colorName }}
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Selected: {selectedProductColor.color.colorName}
                  </h4>
                  <div className="text-sm text-gray-600">
                    Base Price: ${basePrice.toFixed(2)}
                    {selectedProductColor.priceAdjustment !== 0 && (
                      <span className="ml-2">
                        {selectedProductColor.priceAdjustment > 0 ? '+' : ''}
                        ${selectedProductColor.priceAdjustment.toFixed(2)} color adjustment
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    Total: ${getTotalPrice(selectedProductColor.priceAdjustment).toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
