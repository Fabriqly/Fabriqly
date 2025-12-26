'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ProductWithDetails } from '@/types/products';
import { Cart, CartItem, AddToCartRequest } from '@/types/cart';
import { useSession } from 'next-auth/react';

// Cart State Interface
interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  couponCode: string | null;
  discountAmount: number;
  discountScope?: 'product' | 'category' | 'order' | 'shipping'; // Store discount scope
}

// Cart Actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: Cart | null }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'SET_COUPON'; payload: { code: string; discountAmount: number; discountScope?: 'product' | 'category' | 'order' | 'shipping' } | null }
  | { type: 'REMOVE_COUPON' };

// Cart Context Interface
interface CartContextType {
  state: CartState;
  addItem: (item: AddToCartRequest) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  closeCart: () => void;
  getItemCount: () => number;
  getTotalAmount: () => number;
  isItemInCart: (productIdOrDesignId: string, variants: Record<string, string>, colorId?: string, selectedDesign?: { name: string; price: number }, selectedSize?: { name: string; price: number }) => boolean;
  refreshCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => Promise<void>;
  calculateDiscount: () => number;
}

// Initial State
const initialState: CartState = {
  cart: null,
  isOpen: false,
  loading: false,
  error: null,
  couponCode: null,
  discountAmount: 0,
};

// Cart Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'SET_CART':
      return {
        ...state,
        cart: action.payload,
        loading: false,
        error: null,
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };

    case 'SET_COUPON':
      return {
        ...state,
        couponCode: action.payload?.code || null,
        discountAmount: action.payload?.discountAmount || 0,
        discountScope: action.payload?.discountScope,
      };

    case 'REMOVE_COUPON':
      return {
        ...state,
        couponCode: null,
        discountAmount: 0,
        discountScope: undefined,
      };

    default:
      return state;
  }
}

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider Component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { data: session } = useSession();

  // Load cart from database when user is authenticated
  // OPTIMIZED: Only load cart when cart is actually needed (when opened or when adding items)
  useEffect(() => {
    if (session?.user?.id) {
      // Try to load from cache first
      const CACHE_KEY = `cart_cache_${session.user.id}`;
      const CACHE_TIMESTAMP_KEY = `cart_cache_timestamp_${session.user.id}`;
      const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
      
      if (typeof window !== 'undefined') {
        try {
          const cachedData = sessionStorage.getItem(CACHE_KEY);
          const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);
          
          if (cachedData && cachedTimestamp) {
            const timestamp = parseInt(cachedTimestamp, 10);
            const now = Date.now();
            
            // If cache is still valid, use it
            if (now - timestamp < CACHE_DURATION) {
              const parsedCart = JSON.parse(cachedData);
              dispatch({ type: 'SET_CART', payload: parsedCart });
              return; // Use cached data, skip API call
            }
          }
        } catch (error) {
          console.error('Error loading cached cart:', error);
        }
      }

      // Only load cart if it's likely to be needed soon
      // This prevents unnecessary API calls on every page load
      const shouldLoadCart = typeof window !== 'undefined' && (
        window.location.pathname.includes('/checkout') ||
        window.location.pathname.includes('/cart') ||
        localStorage.getItem('cartNeedsRefresh') === 'true'
      );

      if (shouldLoadCart) {
        refreshCart(true); // Force refresh to get latest data
        localStorage.removeItem('cartNeedsRefresh');
      }
    } else {
      // Clear cart and cache when user logs out
      dispatch({ type: 'SET_CART', payload: null });
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(`cart_cache_${session?.user?.id}`);
          sessionStorage.removeItem(`cart_cache_timestamp_${session?.user?.id}`);
        } catch (error) {
          console.error('Error clearing cart cache:', error);
        }
      }
    }
  }, [session?.user?.id]);

  const refreshCart = async (forceRefresh = false) => {
    if (!session?.user?.id) return;

    const CACHE_KEY = `cart_cache_${session.user.id}`;
    const CACHE_TIMESTAMP_KEY = `cart_cache_timestamp_${session.user.id}`;
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    // Try to load from cache first (unless force refresh)
    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          
          // If cache is still valid, use it
          if (now - timestamp < CACHE_DURATION) {
            const parsedCart = JSON.parse(cachedData);
            dispatch({ type: 'SET_CART', payload: parsedCart });
            return; // Use cached data, skip API call
          }
        }
      } catch (error) {
        console.error('Error loading cached cart:', error);
      }
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        
        // Cache the cart data
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
            sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          } catch (error) {
            console.error('Error caching cart:', error);
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to load cart' });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  // Context Methods
  const addItem = async (item: AddToCartRequest) => {
    if (!session?.user?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Authentication required' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Auto-detect itemType if not provided (backward compatibility)
      const requestItem: AddToCartRequest = {
        ...item,
        itemType: item.itemType || (item.productId ? 'product' : item.designId ? 'design' : 'product')
      };
      
      console.log('[CartContext] Adding item to cart:', requestItem);
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestItem),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        
        // Update cache with new cart data
        if (typeof window !== 'undefined' && session?.user?.id) {
          try {
            const CACHE_KEY = `cart_cache_${session.user.id}`;
            const CACHE_TIMESTAMP_KEY = `cart_cache_timestamp_${session.user.id}`;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
            sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          } catch (error) {
            console.error('Error caching cart:', error);
          }
        }
        
        // Refresh cart to get latest data
        await refreshCart(false);
      } else {
        const errorMessage = data.error?.message || data.error || 'Failed to add item to cart';
        console.error('[CartContext] Error adding item:', errorMessage, data);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    } catch (error: any) {
      console.error('[CartContext] Error adding item to cart:', error);
      const errorMessage = error?.message || 'Failed to add item to cart';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeItem = async (itemId: string) => {
    if (!session?.user?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Authentication required' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        
        // Update cache with new cart data
        if (typeof window !== 'undefined' && session?.user?.id) {
          try {
            const CACHE_KEY = `cart_cache_${session.user.id}`;
            const CACHE_TIMESTAMP_KEY = `cart_cache_timestamp_${session.user.id}`;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
            sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          } catch (error) {
            console.error('Error caching cart:', error);
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to remove item from cart' });
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!session?.user?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Authentication required' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        
        // Update cache with new cart data
        if (typeof window !== 'undefined' && session?.user?.id) {
          try {
            const CACHE_KEY = `cart_cache_${session.user.id}`;
            const CACHE_TIMESTAMP_KEY = `cart_cache_timestamp_${session.user.id}`;
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
            sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          } catch (error) {
            console.error('Error caching cart:', error);
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to update item quantity' });
      }
    } catch (error) {
      console.error('Error updating item quantity:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update item quantity' });
    }
  };

  const clearCart = async () => {
    if (!session?.user?.id) {
      dispatch({ type: 'SET_ERROR', payload: 'Authentication required' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
        
        // Clear cache after clearing cart
        if (typeof window !== 'undefined' && session?.user?.id) {
          try {
            const CACHE_KEY = `cart_cache_${session.user.id}`;
            const CACHE_TIMESTAMP_KEY = `cart_cache_timestamp_${session.user.id}`;
            sessionStorage.removeItem(CACHE_KEY);
            sessionStorage.removeItem(CACHE_TIMESTAMP_KEY);
          } catch (error) {
            console.error('Error clearing cart cache:', error);
          }
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to clear cart' });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    }
  };

  const toggleCart = () => {
    // OPTIMIZED: Load cart when opening if not already loaded
    if (session?.user?.id && !state.cart && !state.loading) {
      refreshCart();
    }
    dispatch({ type: 'TOGGLE_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const getItemCount = () => state.cart?.totalItems || 0;

  const getTotalAmount = () => {
    const baseAmount = state.cart?.totalAmount || 0;
    return Math.max(0, baseAmount - state.discountAmount);
  };

  const calculateDiscount = () => state.discountAmount;

  const applyCoupon = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    if (!state.cart || state.cart.items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const productIds = state.cart.items.map(item => item.productId);
      const orderAmount = state.cart.totalAmount;
      // Use dynamic shipping cost if available, otherwise default to 9.99
      // This should match the checkout page's calculateShipping() function
      const shippingCost = 9.99; // Default shipping cost - could be made dynamic
      
      // Prepare cart items for applicableAmount calculation
      const cartItems = state.cart.items.map(item => ({
        productId: item.productId,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      }));
      
      console.log('[CartContext] Applying coupon:', {
        code,
        orderAmount,
        shippingCost,
        productIds: productIds.length,
        cartItemsCount: cartItems.length
      });

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId: session.user.id,
          orderAmount,
          productIds,
          shippingCost, // Pass shipping cost for scope-aware calculation
          cartItems, // Pass cart items for applicableAmount calculation
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data.isValid) {
        const discountAmount = data.data.discountAmount || 0;
        const discountScope = data.data.discount?.scope; // Get discount scope from validation
        console.log('[CartContext] Coupon validated successfully:', {
          code,
          discountAmount,
          discountScope
        });
        dispatch({
          type: 'SET_COUPON',
          payload: { code, discountAmount, discountScope },
        });
        return { success: true };
      } else {
        const error = data.error || data.data?.error || 'Invalid coupon code';
        dispatch({ type: 'SET_ERROR', payload: error });
        return { success: false, error };
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to apply coupon' });
      return { success: false, error: 'Failed to apply coupon' };
    }
  };

  const removeCoupon = async () => {
    dispatch({ type: 'REMOVE_COUPON' });
  };

  const isItemInCart = (productIdOrDesignId: string, variants: Record<string, string>, colorId?: string, selectedDesign?: { name: string; price: number }, selectedSize?: { name: string; price: number }) => {
    if (!state.cart) return false;
    
    // Check if it's a design (designs have simple IDs: design-{designId})
    const designItemId = `design-${productIdOrDesignId}`;
    if (state.cart.items.some(item => item.id === designItemId)) {
      return true;
    }
    
    // Check if it's a product (products have complex IDs with variants)
    const designId = selectedDesign?.name || 'no-design';
    const sizeId = selectedSize?.name || 'no-size';
    const productItemId = `product-${productIdOrDesignId}-${JSON.stringify(variants)}-${colorId || 'default'}-${designId}-${sizeId}`;
    return state.cart.items.some(item => item.id === productItemId);
  };

  const contextValue: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    closeCart,
    getItemCount,
    getTotalAmount,
    isItemInCart,
    refreshCart,
    applyCoupon,
    removeCoupon,
    calculateDiscount,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Custom Hook
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
