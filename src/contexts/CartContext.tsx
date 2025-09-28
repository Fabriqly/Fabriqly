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
}

// Cart Actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: Cart | null }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' };

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
  isItemInCart: (productId: string, variants: Record<string, string>, colorId?: string) => boolean;
  refreshCart: () => Promise<void>;
}

// Initial State
const initialState: CartState = {
  cart: null,
  isOpen: false,
  loading: false,
  error: null,
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
  useEffect(() => {
    if (session?.user?.id) {
      refreshCart();
    } else {
      // Clear cart when user logs out
      dispatch({ type: 'SET_CART', payload: null });
    }
  }, [session?.user?.id]);

  const refreshCart = async () => {
    if (!session?.user?.id) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
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
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch({ type: 'SET_CART', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to add item to cart' });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
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
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to clear cart' });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    }
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const getItemCount = () => state.cart?.totalItems || 0;

  const getTotalAmount = () => state.cart?.totalAmount || 0;

  const isItemInCart = (productId: string, variants: Record<string, string>, colorId?: string) => {
    if (!state.cart) return false;
    const itemId = `${productId}-${JSON.stringify(variants)}-${colorId || 'default'}`;
    return state.cart.items.some(item => item.id === itemId);
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
