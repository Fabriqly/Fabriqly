/**
 * Component Testing Setup for Product System
 * Tests the optimized React components with React Testing Library
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductList } from '@/components/products/ProductList';
import { ProductCard } from '@/components/products/ProductCard';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', role: 'business_owner' },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Test data
const mockProduct = {
  id: 'test-product-id',
  name: 'Test Product',
  description: 'Test product description',
  shortDescription: 'Test short description',
  categoryId: 'test-category-id',
  price: 29.99,
  stockQuantity: 10,
  sku: 'TEST-SKU-001',
  status: 'active',
  isCustomizable: true,
  isDigital: false,
  tags: ['test', 'product'],
  specifications: {
    'Material': 'Cotton',
    'Size': 'Medium'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  category: {
    id: 'test-category-id',
    name: 'Test Category',
    slug: 'test-category',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  images: [],
  variants: [],
  businessOwner: {
    id: 'test-user',
    name: 'Test Business Owner',
    email: 'test@example.com'
  }
};

const mockCategories = [
  {
    id: 'test-category-id',
    name: 'Test Category',
    slug: 'test-category',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('ProductForm Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders create mode correctly', () => {
    render(<ProductForm />);
    
    expect(screen.getByText('Add New Product')).toBeInTheDocument();
    expect(screen.getByText('Create a new product for your catalog')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Description *')).toBeInTheDocument();
    expect(screen.getByLabelText('Category *')).toBeInTheDocument();
    expect(screen.getByLabelText('Price *')).toBeInTheDocument();
  });

  test('renders edit mode correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ product: mockProduct }),
    });

    render(<ProductForm productId="test-product-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
      expect(screen.getByText('Update your product information')).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    render(<ProductForm />);
    
    const submitButton = screen.getByText('Create Product');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
    });
  });

  test('handles form submission successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ product: mockProduct }),
    });

    render(<ProductForm />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Product Name *'), {
      target: { value: 'Test Product' }
    });
    fireEvent.change(screen.getByLabelText('Full Description *'), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByLabelText('Price *'), {
      target: { value: '29.99' }
    });
    
    const submitButton = screen.getByText('Create Product');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test Product')
      });
    });
  });

  test('handles tag addition and removal', async () => {
    render(<ProductForm />);
    
    const tagInput = screen.getByPlaceholderText('Add a tag');
    const addTagButton = screen.getByText('Add Tag');
    
    // Add tag
    fireEvent.change(tagInput, { target: { value: 'test-tag' } });
    fireEvent.click(addTagButton);
    
    expect(screen.getByText('test-tag')).toBeInTheDocument();
    
    // Remove tag
    const removeButton = screen.getByRole('button', { name: /remove tag/i });
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
  });

  test('handles specification addition and removal', async () => {
    render(<ProductForm />);
    
    const specKeyInput = screen.getByPlaceholderText('Specification name');
    const specValueInput = screen.getByPlaceholderText('Specification value');
    const addSpecButton = screen.getByText('Add Spec');
    
    // Add specification
    fireEvent.change(specKeyInput, { target: { value: 'Material' } });
    fireEvent.change(specValueInput, { target: { value: 'Cotton' } });
    fireEvent.click(addSpecButton);
    
    expect(screen.getByText('Material:')).toBeInTheDocument();
    expect(screen.getByText('Cotton')).toBeInTheDocument();
    
    // Remove specification
    const removeButton = screen.getByRole('button', { name: /remove specification/i });
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('Material:')).not.toBeInTheDocument();
  });

  test('shows loading state when fetching product', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ProductForm productId="test-product-id" />);
    
    expect(screen.getByText('Loading product...')).toBeInTheDocument();
  });

  test('shows error state when product fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(<ProductForm productId="test-product-id" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Product')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });
});

describe('ProductList Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders product list correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [mockProduct],
        total: 1,
        hasMore: false,
        filters: {}
      }),
    });

    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Manage your product catalog')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [mockProduct],
        total: 1,
        hasMore: false,
        filters: {}
      }),
    });

    render(<ProductList />);
    
    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Wait for debounced search
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test')
      );
    }, { timeout: 1000 });
  });

  test('handles filter functionality', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [mockProduct],
        total: 1,
        hasMore: false,
        filters: {}
      }),
    });

    render(<ProductList />);
    
    // Open filters
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    // Set category filter
    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'test-category-id' } });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('categoryId=test-category-id')
      );
    });
  });

  test('handles view mode switching', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [mockProduct],
        total: 1,
        hasMore: false,
        filters: {}
      }),
    });

    render(<ProductList />);
    
    const listViewButton = screen.getByRole('button', { name: /list view/i });
    fireEvent.click(listViewButton);
    
    // Check if list view is active
    expect(listViewButton).toHaveClass('bg-blue-600'); // Assuming primary variant has this class
  });

  test('handles empty state', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [],
        total: 0,
        hasMore: false,
        filters: {}
      }),
    });

    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first product')).toBeInTheDocument();
    });
  });

  test('handles error state', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Products')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  test('handles product deletion', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [mockProduct],
        total: 1,
        hasMore: false,
        filters: {}
      }),
    });

    // Mock confirm dialog
    window.confirm = jest.fn(() => true);
    
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // Mock delete API call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Are you sure you want to delete')
    );
  });
});

describe('ProductCard Component', () => {
  test('renders product card correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test short description')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('Stock: 10')).toBeInTheDocument();
  });

  test('renders with actions when showActions is true', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <ProductCard 
        product={mockProduct} 
        showActions={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    
    render(
      <ProductCard 
        product={mockProduct} 
        showActions={true}
        onEdit={mockOnEdit}
      />
    );
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockProduct);
  });

  test('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    
    render(
      <ProductCard 
        product={mockProduct} 
        showActions={true}
        onDelete={mockOnDelete}
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockProduct);
  });

  test('renders tags correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('product')).toBeInTheDocument();
  });

  test('renders specifications correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Material: Cotton')).toBeInTheDocument();
    expect(screen.getByText('Size: Medium')).toBeInTheDocument();
  });
});

// Integration tests
describe('Product System Integration', () => {
  test('complete product creation flow', async () => {
    // Mock categories fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories }),
    });

    // Mock product creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ product: mockProduct }),
    });

    render(<ProductForm />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Product Name *'), {
      target: { value: 'Test Product' }
    });
    fireEvent.change(screen.getByLabelText('Full Description *'), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByLabelText('Price *'), {
      target: { value: '29.99' }
    });
    
    // Submit form
    const submitButton = screen.getByText('Create Product');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test Product')
      });
    });
  });

  test('product list with search and filters', async () => {
    // Mock initial products fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [mockProduct],
        total: 1,
        hasMore: false,
        filters: {}
      }),
    });

    // Mock categories fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories }),
    });

    // Mock search fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: [mockProduct],
        total: 1,
        hasMore: false,
        filters: { search: 'test' }
      }),
    });

    render(<ProductList />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    
    // Perform search
    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Wait for search results
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test')
      );
    }, { timeout: 1000 });
  });
});

// Performance tests
describe('Component Performance', () => {
  test('ProductForm renders without performance issues', () => {
    const startTime = performance.now();
    render(<ProductForm />);
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
  });

  test('ProductList handles large datasets efficiently', async () => {
    const largeProductList = Array.from({ length: 100 }, (_, i) => ({
      ...mockProduct,
      id: `product-${i}`,
      name: `Product ${i}`,
    }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        products: largeProductList,
        total: 100,
        hasMore: false,
        filters: {}
      }),
    });

    const startTime = performance.now();
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText('Product 0')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(500); // Should handle 100 products in less than 500ms
  });
});

export default {
  // Export test utilities for other test files
  mockProduct,
  mockCategories,
};
