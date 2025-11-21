'use client';

import { useState, useEffect } from 'react';

interface Shop {
  id: string;
  businessName: string;
  description?: string;
  location?: string;
  averageRating?: number;
  totalReviews?: number;
  specialties?: string[];
}

interface ProductInfo {
  name: string;
  category?: string;
  tags?: string[];
}

interface ShopSelectionModalProps {
  customizationRequestId: string;
  onSelect: () => void;
  onClose: () => void;
}

export function ShopSelectionModal({
  customizationRequestId,
  onSelect,
  onClose
}: ShopSelectionModalProps) {
  const [loading, setLoading] = useState(true);
  const [productOwnerShop, setProductOwnerShop] = useState<Shop | null>(null);
  const [designerShop, setDesignerShop] = useState<Shop | null>(null);
  const [otherShops, setOtherShops] = useState<Shop[]>([]);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [matchedShopsCount, setMatchedShopsCount] = useState(0);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadShops();
  }, [customizationRequestId]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customizations/${customizationRequestId}/shop/available`);
      const data = await response.json();

      if (data.success) {
        setProductOwnerShop(data.data.productOwnerShop);
        setDesignerShop(data.data.designerShop);
        setOtherShops(data.data.otherShops || []);
        setProductInfo(data.data.productInfo);
        setMatchedShopsCount(data.data.matchedShopsCount || 0);
        
        // Auto-select product owner's shop if available, otherwise designer's shop
        if (data.data.productOwnerShop) {
          setSelectedShopId(data.data.productOwnerShop.id);
        } else if (data.data.designerShop) {
          setSelectedShopId(data.data.designerShop.id);
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedShopId) {
      alert('Please select a printing shop');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/customizations/${customizationRequestId}/shop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopId: selectedShopId })
      });

      const data = await response.json();

      if (data.success) {
        alert('Printing shop selected successfully!');
        onSelect();
      } else {
        alert(data.error || 'Failed to select shop');
      }
    } catch (error) {
      console.error('Error selecting shop:', error);
      alert('Failed to select shop');
    } finally {
      setSubmitting(false);
    }
  };

  const ShopCard = ({ shop, isProductOwnerShop, isDesignerShop }: { shop: Shop; isProductOwnerShop?: boolean; isDesignerShop?: boolean }) => (
    <div
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
        selectedShopId === shop.id
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => setSelectedShopId(shop.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {shop.businessName}
            {isProductOwnerShop && (
              <span className="ml-2 text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-2 py-1 rounded font-semibold">
                🏆 Product Owner
              </span>
            )}
            {isDesignerShop && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Designer's Shop
              </span>
            )}
          </h4>
          {shop.description && (
            <p className="text-sm text-gray-600 mt-1">{shop.description}</p>
          )}
          
          {/* Shop Specialties */}
          {shop.specialties && shop.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {shop.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
          
          {shop.location && (
            <p className="text-sm text-gray-500 mt-1">📍 {shop.location}</p>
          )}
          {shop.averageRating && shop.averageRating > 0 && (
            <div className="flex items-center mt-2">
              <span className="text-yellow-500">★</span>
              <span className="text-sm ml-1">
                {shop.averageRating.toFixed(1)} ({shop.totalReviews} reviews)
              </span>
            </div>
          )}
        </div>
        <input
          type="radio"
          checked={selectedShopId === shop.id}
          onChange={() => setSelectedShopId(shop.id)}
          className="mt-1"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Select Printing Shop</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Info & Filter Results */}
              {productInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    🔍 Filtered for: {productInfo.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    Showing shops that can print this product type.
                    {matchedShopsCount > 0 && (
                      <span className="ml-1 font-semibold text-blue-700">
                        {matchedShopsCount} {matchedShopsCount === 1 ? 'shop' : 'shops'} found
                      </span>
                    )}
                  </p>
                  {productInfo.tags && productInfo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {productInfo.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-white text-gray-700 px-2 py-1 rounded border border-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {productOwnerShop && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    🏆 Highly Recommended (Product Owner&apos;s Shop)
                  </h3>
                  <ShopCard shop={productOwnerShop} isProductOwnerShop />
                </div>
              )}

              {designerShop && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    {productOwnerShop ? "Also Recommended (Designer's Shop)" : "Recommended (Designer's Shop)"}
                  </h3>
                  <ShopCard shop={designerShop} isDesignerShop />
                </div>
              )}

              {otherShops.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Other Available Shops
                  </h3>
                  <div className="space-y-3">
                    {otherShops.map(shop => (
                      <ShopCard key={shop.id} shop={shop} />
                    ))}
                  </div>
                </div>
              )}

              {!productOwnerShop && !designerShop && otherShops.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-2">
                    😔 No printing shops found
                  </div>
                  <p className="text-sm text-gray-400">
                    No shops currently match the requirements for "{productInfo?.name || 'this product'}".
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Try contacting a shop directly or check back later.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleSubmit}
              disabled={!selectedShopId || submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Selecting...' : 'Confirm Selection'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

