import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { ProductWithDetails } from '@/types/products';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

// Test component to access cart context
const TestComponent = () => {
  const { state, addItem, removeItem, updateQuantity, clearCart, toggleCart } = useCart();
  
  return (
    <div>
      <div data-testid="cart-count">{state.totalItems}</div>
      <div data-testid="cart-total">{state.totalAmount}</div>
      <div data-testid="cart-open">{state.isOpen ? 'open' : 'closed'}</div>
      
      <button 
        data-testid="add-item" 
        onClick={() => addItem({
          productId: 'test-product-1',
          product: mockProduct,
          quantity: 2,
          selectedVariants: { color: 'red', size: 'M' },
          unitPrice: 25.00,
          businessOwnerId: 'business-1'
        })}
      >
        Add Item
      </button>
      
      <button 
        data-testid="remove-item" 
        onClick={() => removeItem('test-product-1-{"color":"red","size":"M"}-default')}
      >
        Remove Item
      </button>
      
      <button 
        data-testid="update-quantity" 
        onClick={() => updateQuantity('test-product-1-{"color":"red","size":"M"}-default', 3)}
      >
        Update Quantity
      </button>
      
      <button data-testid="clear-cart" onClick={clearCart}>
        Clear Cart
      </button>
      
      <button data-testid="toggle-cart" onClick={toggleCart}>
        Toggle Cart
      </button>
    </div>
  );
};

// Mock product data
const mockProduct: ProductWithDetails = {
  id: 'test-product-1',
  name: 'Test Product',
  description: 'A test product',
  shortDescription: 'Test product',
  categoryId: 'category-1',
  price: 25.00,
  stockQuantity: 10,
  sku: 'TEST-001',
  businessOwnerId: 'business-1',
  status: 'active',
  isCustomizable: false,
  isDigital: false,
  tags: ['test'],
  createdAt: new Date(),
  updatedAt: new Date(),
  category: {
    id: 'category-1',
    name: 'Test Category',
    description: 'A test category',
    slug: 'test-category',
    isActive: true,
    level: 0,
    path: ['Test Category'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  images: [],
  variants: []
};

describe('CartContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should provide initial cart state', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-open')).toHaveTextContent('closed');
  });

  it('should add item to cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('add-item'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('50');
  });

  it('should update quantity when adding existing item', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item twice
    act(() => {
      fireEvent.click(screen.getByTestId('add-item'));
      fireEvent.click(screen.getByTestId('add-item'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('4');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('100');
  });

  it('should remove item from cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item first
    act(() => {
      fireEvent.click(screen.getByTestId('add-item'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');

    // Remove item
    act(() => {
      fireEvent.click(screen.getByTestId('remove-item'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0');
  });

  it('should update item quantity', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item first
    act(() => {
      fireEvent.click(screen.getByTestId('add-item'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');

    // Update quantity
    act(() => {
      fireEvent.click(screen.getByTestId('update-quantity'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('75');
  });

  it('should clear cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item first
    act(() => {
      fireEvent.click(screen.getByTestId('add-item'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');

    // Clear cart
    act(() => {
      fireEvent.click(screen.getByTestId('clear-cart'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0');
  });

  it('should toggle cart open state', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-open')).toHaveTextContent('closed');

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-cart'));
    });

    expect(screen.getByTestId('cart-open')).toHaveTextContent('open');

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-cart'));
    });

    expect(screen.getByTestId('cart-open')).toHaveTextContent('closed');
  });

  it('should persist cart data to localStorage', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('add-item'));
    });

    // Check if data is stored in localStorage
    const storedCart = localStorage.getItem('fabriqly-cart');
    expect(storedCart).toBeTruthy();
    
    const cartData = JSON.parse(storedCart!);
    expect(cartData).toHaveLength(1);
    expect(cartData[0].productId).toBe('test-product-1');
    expect(cartData[0].quantity).toBe(2);
  });

  it('should load cart data from localStorage', () => {
    // Pre-populate localStorage
    const cartData = [{
      id: 'test-product-1-{"color":"red","size":"M"}-default',
      productId: 'test-product-1',
      product: mockProduct,
      quantity: 3,
      selectedVariants: { color: 'red', size: 'M' },
      unitPrice: 25.00,
      totalPrice: 75.00,
      businessOwnerId: 'business-1'
    }];
    
    localStorage.setItem('fabriqly-cart', JSON.stringify(cartData));

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('75');
  });

  it('should handle different variants as separate items', () => {
    const TestComponentWithVariants = () => {
      const { state, addItem } = useCart();
      
      return (
        <div>
          <div data-testid="cart-count">{state.totalItems}</div>
          <div data-testid="cart-total">{state.totalAmount}</div>
          
          <button 
            data-testid="add-red-item" 
            onClick={() => addItem({
              productId: 'test-product-1',
              product: mockProduct,
              quantity: 1,
              selectedVariants: { color: 'red', size: 'M' },
              unitPrice: 25.00,
              businessOwnerId: 'business-1'
            })}
          >
            Add Red Item
          </button>
          
          <button 
            data-testid="add-blue-item" 
            onClick={() => addItem({
              productId: 'test-product-1',
              product: mockProduct,
              quantity: 1,
              selectedVariants: { color: 'blue', size: 'L' },
              unitPrice: 25.00,
              businessOwnerId: 'business-1'
            })}
          >
            Add Blue Item
          </button>
        </div>
      );
    };

    render(
      <CartProvider>
        <TestComponentWithVariants />
      </CartProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('add-red-item'));
      fireEvent.click(screen.getByTestId('add-blue-item'));
    });

    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('50');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useCart must be used within a CartProvider');

    console.error = originalError;
  });
});


