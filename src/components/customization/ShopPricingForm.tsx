'use client';

import { useState, useEffect } from 'react';

interface ShopPricingFormProps {
  customizationRequestId: string;
  currentDesignFee: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ShopPricingForm({
  customizationRequestId,
  currentDesignFee,
  onSuccess,
  onCancel
}: ShopPricingFormProps) {
  const [printingCost, setPrintingCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productCost, setProductCost] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [colorAdjustment, setColorAdjustment] = useState(0);

  useEffect(() => {
    loadProductInfo();
  }, [customizationRequestId]);

  const loadProductInfo = async () => {
    try {
      setLoading(true);
      // Fetch customization request to get product info
      const response = await fetch(`/api/customizations/${customizationRequestId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const request = data.data;
        
        // Fetch product to get base price
        const productResponse = await fetch(`/api/products/${request.productId}`);
        const productData = await productResponse.json();
        
        if (productData.success && productData.product) {
          const base = productData.product.price || 0;
          const colorAdj = request.colorPriceAdjustment || 0;
          const calculatedProductCost = base + colorAdj;
          
          setBasePrice(base);
          setColorAdjustment(colorAdj);
          setProductCost(calculatedProductCost);
        }
      }
    } catch (error) {
      console.error('Error loading product info:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = currentDesignFee + productCost + (parseFloat(printingCost) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!printingCost || parseFloat(printingCost) <= 0) {
      alert('Please set printing/production cost');
      return;
    }

    try {
      setSubmitting(true);
      // Product cost is calculated automatically by the API (base + color)
      // We only send printing cost
      const response = await fetch(`/api/customizations/${customizationRequestId}/shop-pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCost: 0, // Will be calculated by API from product base + color
          printingCost: parseFloat(printingCost) || 0
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Shop pricing added successfully!');
        onSuccess();
      } else {
        alert(data.error || 'Failed to add shop pricing');
      }
    } catch (error) {
      console.error('Error adding shop pricing:', error);
      alert('Failed to add shop pricing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Add Shop Costs</h3>
      <p className="text-sm text-gray-600 mb-6">
        Set the product and printing costs for this customization order.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Design Fee (Read-only) */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Design Fee (Set by Designer):</span>
            <span className="text-lg font-semibold">₱{currentDesignFee.toFixed(2)}</span>
          </div>
        </div>

        {/* Product Cost (Auto-calculated, Read-only) */}
        {loading ? (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Loading product information...</p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Cost (Auto-calculated)
            </label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Price:</span>
                <span>₱{basePrice.toFixed(2)}</span>
              </div>
              {colorAdjustment !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Color Adjustment:</span>
                  <span className={colorAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {colorAdjustment >= 0 ? '+' : ''}₱{colorAdjustment.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-blue-300 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Product Cost:</span>
                  <span className="text-lg font-bold text-blue-600">₱{productCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This is automatically calculated from the product's base price and selected color.
            </p>
          </div>
        )}

        {/* Printing Cost */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Printing Cost (₱) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={printingCost}
            onChange={(e) => setPrintingCost(e.target.value)}
            placeholder="e.g., 200"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Cost of printing/producing the design on the product
          </p>
        </div>

        {/* Total Cost Summary */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Design Fee:</span>
            <span>₱{currentDesignFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Product Cost:</span>
            <span>₱{(parseFloat(productCost) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Printing Cost:</span>
            <span>₱{(parseFloat(printingCost) || 0).toFixed(2)}</span>
          </div>
          <div className="border-t border-blue-300 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Cost:</span>
              <span className="text-xl font-bold text-blue-600">₱{totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Add Shop Costs'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

