'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerNavigationSidebar } from '@/components/layout/CustomerNavigationSidebar';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { Button } from '@/components/ui/Button';
import { CartPageSkeleton } from '@/components/cart/CartSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2,
  ArrowRight,
  Package,
  Trash,
  AlertTriangle,
  Store,
  X,
  User,
  ImageIcon
} from 'lucide-react';
import { ShopProfile } from '@/types/shop-profile';
import { CartItem } from '@/types/cart';
import { WatermarkedImage } from '@/components/ui/WatermarkedImage';
import { DesignWithDetails } from '@/types/enhanced-products';

interface GroupedCartItem extends CartItem {
  shop?: ShopProfile;
  designer?: DesignWithDetails['designer'];
}

interface ShopGroup {
  shop: ShopProfile | null;
  businessOwnerId?: string;
  designerId?: string;
  designer?: DesignWithDetails['designer'];
  groupType: 'product' | 'design';
  items: GroupedCartItem[];
}

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, removeItem, updateQuantity, refreshCart, getTotalAmount } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [stockWarnings, setStockWarnings] = useState<Record<string, { available: number; requested: number }>>({});
  const [inactiveWarnings, setInactiveWarnings] = useState<Record<string, { status: string }>>({});
  const [shopProfiles, setShopProfiles] = useState<Record<string, ShopProfile | null>>({});
  const [loadingShops, setLoadingShops] = useState(true);
  const [groupedItems, setGroupedItems] = useState<ShopGroup[]>([]);

  // Load cart on mount
  useEffect(() => {
    if (user?.id && !state.cart && !state.loading) {
      refreshCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Group items by shop and load shop profiles
  useEffect(() => {
    if (!state.cart?.items || state.cart.items.length === 0) {
      setGroupedItems([]);
      setLoadingShops(false);
      return;
    }

    const loadShopProfiles = async () => {
      setLoadingShops(true);
      
      // Separate product and design items
      // Also log items for debugging
      console.log('[Cart] All cart items:', state.cart.items.map(item => ({
        id: item.id,
        itemType: item.itemType,
        productId: item.productId,
        designId: item.designId,
        businessOwnerId: item.businessOwnerId,
        designerId: item.designerId,
        productName: item.product?.name,
        designName: item.design?.name
      })));
      
      // Filter items - handle both explicit itemType and inferred types
      const productItems = state.cart.items.filter(item => {
        const isProduct = item.itemType === 'product' || (item.productId && !item.designId && item.itemType !== 'design');
        if (!isProduct && item.productId) {
          console.warn('[Cart] Item has productId but itemType is not "product":', {
            id: item.id,
            itemType: item.itemType,
            productId: item.productId
          });
        }
        return isProduct;
      });
      
      const designItems = state.cart.items.filter(item => {
        const isDesign = item.itemType === 'design' || (item.designId && !item.productId);
        if (!isDesign && item.designId) {
          console.warn('[Cart] Item has designId but itemType is not "design":', {
            id: item.id,
            itemType: item.itemType,
            designId: item.designId
          });
        }
        return isDesign;
      });
      
      // Check for items that don't match either category
      const unclassifiedItems = state.cart.items.filter(item => 
        !productItems.includes(item) && !designItems.includes(item)
      );
      
      if (unclassifiedItems.length > 0) {
        console.warn('[Cart] Unclassified items (neither product nor design):', unclassifiedItems.map(item => ({
          id: item.id,
          itemType: item.itemType,
          productId: item.productId,
          designId: item.designId
        })));
        // Try to classify them based on available fields
        unclassifiedItems.forEach(item => {
          if (item.productId && !item.designId) {
            productItems.push(item);
            console.log('[Cart] Classified unclassified item as product:', item.id);
          } else if (item.designId && !item.productId) {
            designItems.push(item);
            console.log('[Cart] Classified unclassified item as design:', item.id);
          }
        });
      }
      
      console.log('[Cart] Product items:', productItems.length, 'Design items:', designItems.length);
      
      const uniqueOwnerIds = [...new Set(productItems.map(item => item.businessOwnerId).filter(Boolean))];
      const uniqueDesignerIds = [...new Set(designItems.map(item => item.designerId).filter(Boolean))];
      
      const shopMap: Record<string, ShopProfile | null> = {};
      const designerMap: Record<string, DesignWithDetails['designer'] | null> = {};

      // Fetch shop profiles for all unique business owners
      await Promise.all(
        uniqueOwnerIds.map(async (ownerId) => {
          try {
            const response = await fetch(`/api/shop-profiles/user/${ownerId}`);
            const data = await response.json();
            if (data.success && data.data) {
              shopMap[ownerId] = data.data;
            } else {
              shopMap[ownerId] = null;
            }
          } catch (error) {
            console.error(`Error loading shop for owner ${ownerId}:`, error);
            shopMap[ownerId] = null;
          }
        })
      );

      // Fetch designer profiles for all unique designers
      // Note: designerId in cart items is the profile ID, not userId
      await Promise.all(
        uniqueDesignerIds.map(async (designerId) => {
          try {
            const response = await fetch(`/api/designer-profiles/${designerId}`);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              // If not JSON (likely HTML 404 page), try by userId
              const userResponse = await fetch(`/api/designer-profiles?userId=${designerId}`);
              if (userResponse.ok) {
                const userContentType = userResponse.headers.get('content-type');
                if (userContentType && userContentType.includes('application/json')) {
                  const userData = await userResponse.json();
                  if (userData.profiles && userData.profiles.length > 0) {
                    designerMap[designerId] = userData.profiles[0];
                    return;
                  }
                }
              }
              designerMap[designerId] = null;
              return;
            }
            
            if (!response.ok) {
              designerMap[designerId] = null;
              return;
            }
            
            const data = await response.json();
            if (data.profile) {
              designerMap[designerId] = data.profile;
            } else {
              designerMap[designerId] = null;
            }
          } catch (error) {
            console.error(`Error loading designer for ${designerId}:`, error);
            designerMap[designerId] = null;
          }
        })
      );

      setShopProfiles(shopMap);

      // Group product items by businessOwnerId
      const productGroups = productItems.reduce((acc, item) => {
        // Handle missing businessOwnerId - use a fallback key
        const ownerId = item.businessOwnerId || 'unknown-owner';
        
        // Log warning if businessOwnerId is missing
        if (!item.businessOwnerId) {
          console.warn('[Cart] Product item missing businessOwnerId:', {
            itemId: item.id,
            productId: item.productId,
            productName: item.product?.name
          });
        }
        
        if (!acc[ownerId]) {
          acc[ownerId] = {
            shop: shopMap[ownerId] || null,
            businessOwnerId: ownerId === 'unknown-owner' ? undefined : ownerId,
            groupType: 'product' as const,
            items: []
          };
        }
        acc[ownerId].items.push({ ...item, shop: shopMap[ownerId] || undefined });
        return acc;
      }, {} as Record<string, ShopGroup>);

      // Group design items by designerId
      const designGroups = designItems.reduce((acc, item) => {
        // Handle missing designerId - use a fallback key
        const designerId = item.designerId || 'unknown-designer';
        
        // Log warning if designerId is missing
        if (!item.designerId) {
          console.warn('[Cart] Design item missing designerId:', {
            itemId: item.id,
            designId: item.designId,
            designName: item.design?.name
          });
        }
        
        if (!acc[designerId]) {
          acc[designerId] = {
            designer: designerMap[designerId] || null,
            designerId: designerId === 'unknown-designer' ? undefined : designerId,
            groupType: 'design' as const,
            items: []
          };
        }
        acc[designerId].items.push({ ...item, designer: designerMap[designerId] || undefined });
        return acc;
      }, {} as Record<string, ShopGroup>);

      // Combine both groups
      const allGroups = [...Object.values(productGroups), ...Object.values(designGroups)];
      
      // Verify all items are included
      const groupedItemIds = new Set(allGroups.flatMap(group => group.items.map(item => item.id)));
      const allItemIds = new Set(state.cart.items.map(item => item.id));
      const missingItems = state.cart.items.filter(item => !groupedItemIds.has(item.id));
      
      // Debug: Log the comparison
      if (missingItems.length > 0) {
        console.log('[Cart] Grouping verification:', {
          totalItems: state.cart.items.length,
          groupedItems: groupedItemIds.size,
          missingItems: missingItems.length,
          groupedItemIds: Array.from(groupedItemIds),
          allItemIds: Array.from(allItemIds)
        });
      }
      
      if (missingItems.length > 0) {
        console.error('[Cart] Some items were not grouped:', missingItems.map(item => ({
          id: item.id,
          itemType: item.itemType,
          productId: item.productId,
          designId: item.designId,
          businessOwnerId: item.businessOwnerId,
          designerId: item.designerId,
          productName: item.product?.name,
          designName: item.design?.name
        })));
        
        // Add missing items to fallback groups
        const missingProductItems = missingItems.filter(item => item.itemType === 'product');
        const missingDesignItems = missingItems.filter(item => item.itemType === 'design');
        
        if (missingProductItems.length > 0) {
          // Group missing product items by businessOwnerId if available, otherwise use fallback
          const missingProductGroups = missingProductItems.reduce((acc, item) => {
            const ownerId = item.businessOwnerId || 'unknown-owner';
            if (!acc[ownerId]) {
              acc[ownerId] = {
                shop: null,
                businessOwnerId: ownerId === 'unknown-owner' ? undefined : ownerId,
                groupType: 'product' as const,
                items: []
              };
            }
            acc[ownerId].items.push({ ...item, shop: undefined });
            return acc;
          }, {} as Record<string, ShopGroup>);
          
          allGroups.push(...Object.values(missingProductGroups));
        }
        
        if (missingDesignItems.length > 0) {
          // Group missing design items by designerId if available, otherwise use fallback
          const missingDesignGroups = missingDesignItems.reduce((acc, item) => {
            const designerId = item.designerId || 'unknown-designer';
            if (!acc[designerId]) {
              acc[designerId] = {
                designer: null,
                designerId: designerId === 'unknown-designer' ? undefined : designerId,
                groupType: 'design' as const,
                items: []
              };
            }
            acc[designerId].items.push({ ...item, designer: undefined });
            return acc;
          }, {} as Record<string, ShopGroup>);
          
          allGroups.push(...Object.values(missingDesignGroups));
        }
      }
      
      console.log('[Cart] Grouped items:', allGroups.map(group => ({
        type: group.groupType,
        itemCount: group.items.length,
        businessOwnerId: group.businessOwnerId,
        designerId: group.designerId
      })));
      
      setGroupedItems(allGroups);
      setLoadingShops(false);
    };

    loadShopProfiles();
  }, [state.cart?.items]);

  // Check stock availability
  useEffect(() => {
    const checkStock = async () => {
      if (!state.cart?.items || state.cart.items.length === 0) {
        setStockWarnings({});
        setInactiveWarnings({});
        return;
      }

      try {
        // Only validate stock for product items (designs don't have stock)
        const productItems = state.cart.items.filter(item => item.itemType === 'product');
        const stockValidationRequest = {
          items: productItems.map(item => ({
            productId: item.productId!,
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
    // Find the item to check if it's a design
    const item = state.cart?.items.find(i => i.id === itemId);
    const isDesign = item?.itemType === 'design';
    
    // Designs are digital products - quantity should always be 1
    if (isDesign) {
      return; // Don't allow quantity changes for designs
    }
    
    if (newQuantity < 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleItemSelect = (itemId: string) => {
    const item = state.cart?.items.find(cartItem => cartItem.id === itemId);
    if (!item) return;

    // Designs don't have stock/inactive warnings
    if (item.itemType === 'product' && (inactiveWarnings[item.productId!] || stockWarnings[item.productId!])) {
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
      const validItems = state.cart?.items.filter(item => 
        item.itemType === 'design' || (!inactiveWarnings[item.productId!] && !stockWarnings[item.productId!])
      ) || [];
      setSelectedItems(new Set(validItems.map(item => item.id)));
    }
  };

  const handleSelectShopItems = (group: ShopGroup) => {
    const shopItemIds = group.items.map(item => item.id);
    const validShopItems = group.items.filter(item => 
      item.itemType === 'design' || (!inactiveWarnings[item.productId!] && !stockWarnings[item.productId!])
    );
    const validShopItemIds = validShopItems.map(item => item.id);
    
    // Check if all valid items from this shop are already selected
    const allSelected = validShopItemIds.every(id => selectedItems.has(id));
    
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      // Deselect all items from this shop
      shopItemIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all valid items from this shop
      validShopItemIds.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const isShopAllSelected = (group: ShopGroup) => {
    const validShopItems = group.items.filter(item => 
      item.itemType === 'design' || (!inactiveWarnings[item.productId!] && !stockWarnings[item.productId!])
    );
    if (validShopItems.length === 0) return false;
    return validShopItems.every(item => selectedItems.has(item.id));
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
    
    const selectedCartItems = state.cart?.items.filter(item => selectedItems.has(item.id)) || [];
    
      const hasInvalidItems = selectedCartItems.some(item => 
        item.itemType === 'product' && (inactiveWarnings[item.productId!] || stockWarnings[item.productId!])
      );
    
    if (hasInvalidItems) {
      alert('Cannot proceed to checkout with inactive or out-of-stock items. Please remove them from your selection.');
      return;
    }
    
    sessionStorage.setItem('bulkCheckoutItems', JSON.stringify(selectedCartItems));
    router.push('/checkout?bulk=true');
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

  const getShopName = (group: ShopGroup) => {
    if (group.groupType === 'design') {
      if (group.designer) {
        return group.designer.businessName || group.designer.displayName || 'Designer';
      }
      return 'Designer';
    }
    if (group.shop) {
      return group.shop.shopName || group.shop.businessName || 'Shop';
    }
    return 'Shop';
  };

  if (state.loading || loadingShops) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader user={user} />
        {/* Mobile: Horizontal Tab Bar */}
        <CustomerNavigationSidebar variant="mobile" />
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
          {/* Desktop: Vertical Sidebar */}
          <CustomerNavigationSidebar variant="desktop" />
          <main className="flex-1 w-full">
            <CartPageSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={user} />
      
      {/* Mobile: Horizontal Tab Bar */}
      <CustomerNavigationSidebar variant="mobile" />
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
        {/* Desktop: Vertical Sidebar */}
        <CustomerNavigationSidebar variant="desktop" />

        {/* Right Content Area */}
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Shopping Cart</h1>
              {state.cart && state.cart.items.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === state.cart.items.length && state.cart.items.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs md:text-sm text-gray-600">
                      Select All ({selectedItems.size} selected)
                    </span>
                  </div>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center justify-center space-x-1 text-red-600 hover:text-red-700 text-xs md:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                      <span>Delete Selected</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Empty Cart */}
            {!state.cart || state.cart.items.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12 text-center">
                <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6">Add some products to get started!</p>
                <Link href="/explore" className="inline-block">
                  <Button className="w-full sm:w-auto">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              /* Shop Groups */
              <div className="space-y-4 md:space-y-6">
                {groupedItems.map((group, groupIndex) => {
                  // Create unique key for both product and design groups
                  const groupKey = group.businessOwnerId || group.designerId || `group-${groupIndex}`;
                  const isDesignGroup = group.groupType === 'design';
                  
                  return (
                  <div key={groupKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Shop/Designer Header */}
                    <div className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={isShopAllSelected(group)}
                        onChange={() => handleSelectShopItems(group)}
                        className="rounded border-gray-300 cursor-pointer"
                      />
                      {isDesignGroup ? (
                        <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      ) : (
                        <Store className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {isDesignGroup ? (
                          <h3 className="font-semibold text-xs md:text-sm text-gray-900 truncate">
                            {group.designer?.businessName || group.designer?.displayName || 'Designer'}
                          </h3>
                        ) : group.shop?.username ? (
                          <Link 
                            href={`/shops/${group.shop.username}`}
                            className="font-semibold text-xs md:text-sm text-gray-900 hover:text-blue-600 transition-colors truncate block"
                          >
                            {getShopName(group)}
                          </Link>
                        ) : (
                          <h3 className="font-semibold text-xs md:text-sm text-gray-900 truncate">{getShopName(group)}</h3>
                        )}
                      </div>
                    </div>

                    {/* Items from this shop/designer */}
                    <div className="divide-y divide-gray-100">
                      {group.items.map((item) => {
                        const isInvalid = item.itemType === 'product' && (inactiveWarnings[item.productId!] || stockWarnings[item.productId!]);
                        const isDesign = item.itemType === 'design';
                        return (
                          <div
                            key={item.id}
                            className={`flex space-x-2 md:space-x-4 p-3 md:p-4 ${isInvalid ? 'opacity-60 bg-gray-50' : ''}`}
                          >
                            {/* Checkbox */}
                            <div className="flex-shrink-0 flex items-start pt-1">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleItemSelect(item.id)}
                                disabled={!!isInvalid}
                                className={`rounded border-gray-300 ${
                                  isInvalid
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }`}
                              />
                            </div>

                            {/* Product/Design Image */}
                            <div className="flex-shrink-0">
                              {isDesign ? (
                                <Link href={`/explore/designs/${item.designId}`}>
                                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                    {(() => {
                                      // Debug logging
                                      console.log('Rendering design image:', {
                                        designId: item.designId,
                                        hasStoragePath: !!item.design?.storagePath,
                                        hasStorageBucket: !!item.design?.storageBucket,
                                        storagePath: item.design?.storagePath,
                                        storageBucket: item.design?.storageBucket,
                                        thumbnailUrl: item.design?.thumbnailUrl
                                      });
                                      
                                      // Try to use storagePath/storageBucket if available
                                      if (item.design?.storagePath && item.design?.storageBucket && item.designId) {
                                        return (
                                          <WatermarkedImage
                                            storagePath={item.design.storagePath}
                                            storageBucket={item.design.storageBucket}
                                            designId={item.designId}
                                            isFree={false}
                                            designType={item.design.designType}
                                            alt={item.design.name || 'Design'}
                                            className="w-full h-full object-cover"
                                            fallbackSrc={item.design.thumbnailUrl}
                                          />
                                        );
                                      }
                                      // Fallback to thumbnailUrl if storage info not available
                                      if (item.design?.thumbnailUrl) {
                                        return (
                                          <img
                                            src={item.design.thumbnailUrl}
                                            alt={item.design.name || 'Design'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              console.error('Design thumbnail failed to load:', item.design?.thumbnailUrl);
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        );
                                      }
                                      // Final fallback
                                      return (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </Link>
                              ) : (
                                <Link href={`/products/${item.productId}`}>
                                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                    {item.product?.images && item.product.images.length > 0 ? (
                                      <img
                                        src={item.product.images[0].imageUrl}
                                        alt={item.product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              )}
                            </div>

                            {/* Product/Design Details */}
                            <div className="flex-1 min-w-0">
                              {isDesign ? (
                                <Link href={`/explore/designs/${item.designId}`}>
                                  <h4 className="font-medium text-xs md:text-sm text-gray-900 truncate hover:text-blue-600 cursor-pointer">
                                    {item.design?.name || 'Design'}
                                  </h4>
                                </Link>
                              ) : (
                                <Link href={`/products/${item.productId}`}>
                                  <h4 className="font-medium text-xs md:text-sm text-gray-900 truncate hover:text-blue-600 cursor-pointer">
                                    {item.product?.name || 'Product'}
                                  </h4>
                                </Link>
                              )}
                              
                              {/* Design and Size */}
                              {(item.selectedDesign || item.selectedSize) && (
                                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                  {item.selectedDesign && (
                                    <span className="block">Design: {item.selectedDesign.name}</span>
                                  )}
                                  {item.selectedSize && (
                                    <span className="block">Size: {item.selectedSize.name}</span>
                                  )}
                                </div>
                              )}

                              {/* Legacy Variants */}
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

                              {/* Warnings */}
                              {!isDesign && inactiveWarnings[item.productId!] && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <p className="text-xs text-red-600">
                                    Product is {inactiveWarnings[item.productId!].status}
                                  </p>
                                </div>
                              )}

                              {!isDesign && stockWarnings[item.productId!] && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <p className="text-xs text-red-600">
                                    Only {stockWarnings[item.productId!].available} available
                                  </p>
                                </div>
                              )}

                              {isDesign && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="capitalize">{item.design?.designType || 'Design'}</span>
                                  {item.design?.designType === 'premium' && (
                                    <span className="ml-1 text-indigo-600">Premium</span>
                                  )}
                                </div>
                              )}

                              {/* Quantity and Price Controls */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-3">
                                <div className="flex items-center space-x-2">
                                  {isDesign ? (
                                    // Designs are digital - quantity is always 1
                                    <span className="text-xs md:text-sm font-medium w-6 md:w-8 text-center text-gray-600">
                                      1
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                        disabled={!!isInvalid}
                                        className={`p-1 rounded ${
                                          isInvalid
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'hover:bg-gray-100'
                                        }`}
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="text-xs md:text-sm font-medium w-6 md:w-8 text-center">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                        disabled={!!isInvalid}
                                        className={`p-1 rounded ${
                                          isInvalid
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'hover:bg-gray-100'
                                        }`}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <span className="text-xs md:text-sm font-medium">
                                    {formatPrice(item.totalPrice)}
                                  </span>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1 hover:bg-red-50 text-red-500 rounded"
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column - Order Summary (Fixed Bottom on Mobile, Sticky on Desktop) */}
          {state.cart && state.cart.items.length > 0 && (
            <div className="lg:col-span-1">
              {/* Mobile: Fixed Bottom Bar */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-lg font-bold text-gray-900 ml-2">
                      {formatPrice(getSelectedTotalAmount())}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <Button 
                  onClick={handleBulkCheckout}
                  disabled={selectedItems.size === 0}
                  className="w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {selectedItems.size > 0 
                      ? `Checkout Selected (${selectedItems.size})` 
                      : 'Select Items to Checkout'}
                  </span>
                  {selectedItems.size > 0 && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
              
              {/* Desktop: Sticky Sidebar */}
              <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                {selectedItems.size === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Select items to see order summary</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900 font-medium">
                        {formatPrice(getSelectedTotalAmount())}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="text-gray-900 font-medium">
                        {selectedItems.size}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(getSelectedTotalAmount())}
                        </span>
                      </div>
                    </div>
                    
                    {/* Checkout Button */}
                    <Button 
                      onClick={handleBulkCheckout}
                      className="w-full flex items-center justify-center space-x-2 mt-6"
                    >
                      <span>Checkout Selected ({selectedItems.size})</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    
                    {/* Continue Shopping */}
                    <Link href="/explore">
                      <Button 
                        variant="outline" 
                        className="w-full mt-3"
                      >
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Spacer for mobile fixed bottom bar */}
        {state.cart && state.cart.items.length > 0 && (
          <div className="lg:hidden h-32"></div>
        )}
          </div>
      </main>
    </div>
      
      <ScrollToTop />
    </div>
  );
}

