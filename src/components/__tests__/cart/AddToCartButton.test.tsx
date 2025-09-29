import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { ProductWithDetails } from '@/types/products';

// Mock the cart context
jest.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    addItem: jest.fn(),
    isItemInCart: jest.fn(() => false)
  })
}));

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

describe('AddToCartButton', () => {
  const defaultProps = {
    product: mockProduct,
    quantity: 1,
    selectedVariants: {},
    businessOwnerId: 'business-1'
  };

  it('should render add to cart button', () => {
    render(<AddToCartButton {...defaultProps} />);
    
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('should show "Update Cart" when item is already in cart', () => {
    // Mock isItemInCart to return true
    jest.doMock('@/contexts/CartContext', () => ({
      useCart: () => ({
        addItem: jest.fn(),
        isItemInCart: jest.fn(() => true)
      })
    }));

    render(<AddToCartButton {...defaultProps} />);
    
    expect(screen.getByText('Update Cart')).toBeInTheDocument();
  });

  it('should call addItem when clicked', async () => {
    const mockAddItem = jest.fn();
    
    jest.doMock('@/contexts/CartContext', () => ({
      useCart: () => ({
        addItem: mockAddItem,
        isItemInCart: jest.fn(() => false)
      })
    }));

    render(<AddToCartButton {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'test-product-1',
        product: mockProduct,
        quantity: 1,
        selectedVariants: {},
        unitPrice: 25.00,
        businessOwnerId: 'business-1'
      });
    });
  });

  it('should show "Added to Cart" after successful add', async () => {
    const mockAddItem = jest.fn();
    
    jest.doMock('@/contexts/CartContext', () => ({
      useCart: () => ({
        addItem: mockAddItem,
        isItemInCart: jest.fn(() => false)
      })
    }));

    render(<AddToCartButton {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    
    await waitFor(() => {
      expect(screen.getByText('Added to Cart')).toBeInTheDocument();
    });
  });

  it('should be disabled when quantity is 0', () => {
    render(<AddToCartButton {...defaultProps} quantity={0} />);
    
    const button = screen.getByText('Add to Cart');
    expect(button).toBeDisabled();
  });

  it('should be disabled when quantity is negative', () => {
    render(<AddToCartButton {...defaultProps} quantity={-1} />);
    
    const button = screen.getByText('Add to Cart');
    expect(button).toBeDisabled();
  });

  it('should calculate price with variants', () => {
    const productWithVariants = {
      ...mockProduct,
      variants: [
        {
          variantName: 'size',
          variantValue: 'L',
          priceAdjustment: 5.00
        },
        {
          variantName: 'color',
          variantValue: 'red',
          priceAdjustment: 2.00
        }
      ]
    };

    render(
      <AddToCartButton 
        {...defaultProps} 
        product={productWithVariants}
        selectedVariants={{ size: 'L', color: 'red' }}
      />
    );
    
    // The button should show the calculated price
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('should handle color price adjustment', () => {
    render(
      <AddToCartButton 
        {...defaultProps} 
        selectedColorId="red"
        colorPriceAdjustment={3.00}
      />
    );
    
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('should show loading state when adding', async () => {
    const mockAddItem = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    jest.doMock('@/contexts/CartContext', () => ({
      useCart: () => ({
        addItem: mockAddItem,
        isItemInCart: jest.fn(() => false)
      })
    }));

    render(<AddToCartButton {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    
    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });

  it('should handle different button variants', () => {
    const { rerender } = render(<AddToCartButton {...defaultProps} variant="outline" />);
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    
    rerender(<AddToCartButton {...defaultProps} variant="ghost" />);
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('should handle different button sizes', () => {
    const { rerender } = render(<AddToCartButton {...defaultProps} size="sm" />);
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    
    rerender(<AddToCartButton {...defaultProps} size="lg" />);
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<AddToCartButton {...defaultProps} className="custom-class" />);
    
    const button = screen.getByText('Add to Cart');
    expect(button).toHaveClass('custom-class');
  });

  it('should handle error during add', async () => {
    const mockAddItem = jest.fn(() => Promise.reject(new Error('Add failed')));
    
    jest.doMock('@/contexts/CartContext', () => ({
      useCart: () => ({
        addItem: mockAddItem,
        isItemInCart: jest.fn(() => false)
      })
    }));

    // Mock console.error to avoid noise in test output
    const originalError = console.error;
    console.error = jest.fn();

    render(<AddToCartButton {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    
    await waitFor(() => {
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });

    console.error = originalError;
  });
});


