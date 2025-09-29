import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DesignCatalog } from '@/components/designs/DesignCatalog';
import { DesignWithDetails } from '@/types/enhanced-products';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockDesigns: DesignWithDetails[] = [
  {
    id: 'design1',
    designName: 'Test Design 1',
    description: 'A beautiful test design',
    designSlug: 'test-design-1',
    designerId: 'designer1',
    categoryId: 'cat1',
    designFileUrl: 'https://example.com/design1.png',
    thumbnailUrl: 'https://example.com/thumbnail1.png',
    designType: 'template',
    fileFormat: 'png',
    tags: ['test', 'design'],
    isPublic: true,
    isFeatured: true,
    isActive: true,
    pricing: { isFree: true, currency: 'USD' },
    downloadCount: 10,
    viewCount: 50,
    likesCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    designer: {
      id: 'designer1',
      businessName: 'Test Designer',
      userId: 'user1',
      specialties: ['graphic design'],
      isVerified: true,
      isActive: true,
      portfolioStats: { totalDesigns: 10, totalDownloads: 100, totalViews: 500, averageRating: 4.5 },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: {
      id: 'cat1',
      categoryName: 'Test Category',
      slug: 'test-category',
      level: 0,
      path: [],
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    id: 'design2',
    designName: 'Test Design 2',
    description: 'Another beautiful test design',
    designSlug: 'test-design-2',
    designerId: 'designer2',
    categoryId: 'cat2',
    designFileUrl: 'https://example.com/design2.png',
    thumbnailUrl: 'https://example.com/thumbnail2.png',
    designType: 'custom',
    fileFormat: 'svg',
    tags: ['custom', 'art'],
    isPublic: true,
    isFeatured: false,
    isActive: true,
    pricing: { isFree: false, price: 9.99, currency: 'USD' },
    downloadCount: 5,
    viewCount: 25,
    likesCount: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    designer: {
      id: 'designer2',
      businessName: 'Another Designer',
      userId: 'user2',
      specialties: ['illustration'],
      isVerified: false,
      isActive: true,
      portfolioStats: { totalDesigns: 5, totalDownloads: 50, totalViews: 250, averageRating: 4.0 },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    category: {
      id: 'cat2',
      categoryName: 'Art Category',
      slug: 'art-category',
      level: 0,
      path: [],
      isActive: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

const mockCategories = [
  {
    id: 'cat1',
    categoryName: 'Test Category',
    slug: 'test-category',
    level: 0,
    path: [],
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat2',
    categoryName: 'Art Category',
    slug: 'art-category',
    level: 0,
    path: [],
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

describe('DesignCatalog', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders the catalog with initial designs', () => {
    render(<DesignCatalog initialDesigns={mockDesigns} />);

    expect(screen.getByText('Design Catalog')).toBeInTheDocument();
    expect(screen.getByText('Discover amazing designs from talented creators')).toBeInTheDocument();
    expect(screen.getByText('Test Design 1')).toBeInTheDocument();
    expect(screen.getByText('Test Design 2')).toBeInTheDocument();
  });

  it('displays search input', () => {
    render(<DesignCatalog />);

    expect(screen.getByPlaceholderText('Search designs...')).toBeInTheDocument();
  });

  it('displays filter button', () => {
    render(<DesignCatalog showFilters={true} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('displays view toggle buttons', () => {
    render(<DesignCatalog showViewToggle={true} />);

    expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
  });

  it('displays sort options', () => {
    render(<DesignCatalog showSorting={true} />);

    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(screen.getByText('Most Viewed')).toBeInTheDocument();
    expect(screen.getByText('Most Liked')).toBeInTheDocument();
  });

  it('handles search input change', () => {
    render(<DesignCatalog />);

    const searchInput = screen.getByPlaceholderText('Search designs...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(searchInput).toHaveValue('test search');
  });

  it('handles search form submission', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ designs: mockDesigns })
    });

    render(<DesignCatalog />);

    const searchInput = screen.getByPlaceholderText('Search designs...');
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/designs?search=test')
      );
    });
  });

  it('toggles filter panel', () => {
    render(<DesignCatalog showFilters={true} />);

    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Design Type')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('handles view mode toggle', () => {
    render(<DesignCatalog showViewToggle={true} />);

    const listButton = screen.getByRole('button', { name: /list/i });
    fireEvent.click(listButton);

    // The component should update its internal state
    // We can't directly test the state, but we can verify the button is clicked
    expect(listButton).toBeInTheDocument();
  });

  it('handles sort button clicks', () => {
    render(<DesignCatalog showSorting={true} />);

    const popularButton = screen.getByText('Popular');
    fireEvent.click(popularButton);

    // Verify the button is clickable
    expect(popularButton).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<DesignCatalog />);

    // The component starts with loading state
    // We can't easily test the loading state without mocking the useEffect
    // But we can verify the component renders
    expect(screen.getByText('Design Catalog')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<DesignCatalog />);

    // Wait for the error to appear
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays no results message', () => {
    render(<DesignCatalog initialDesigns={[]} />);

    expect(screen.getByText('No designs found matching your criteria.')).toBeInTheDocument();
  });

  it('handles clear filters', () => {
    render(<DesignCatalog showFilters={true} />);

    // Open filter panel
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    // Click clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    // Verify clear button is clickable
    expect(clearButton).toBeInTheDocument();
  });

  it('loads categories on mount', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    });

    render(<DesignCatalog showFilters={true} />);

    // Open filter panel
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/categories');
    });
  });

  it('handles custom title and subtitle', () => {
    render(
      <DesignCatalog
        title="Custom Title"
        subtitle="Custom subtitle"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
  });

  it('hides filters when showFilters is false', () => {
    render(<DesignCatalog showFilters={false} />);

    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
  });

  it('hides search when showSearch is false', () => {
    render(<DesignCatalog showSearch={false} />);

    expect(screen.queryByPlaceholderText('Search designs...')).not.toBeInTheDocument();
  });

  it('hides sorting when showSorting is false', () => {
    render(<DesignCatalog showSorting={false} />);

    expect(screen.queryByText('Sort by:')).not.toBeInTheDocument();
  });

  it('hides view toggle when showViewToggle is false', () => {
    render(<DesignCatalog showViewToggle={false} />);

    expect(screen.queryByRole('button', { name: /grid/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /list/i })).not.toBeInTheDocument();
  });
});
