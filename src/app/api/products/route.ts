import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters,
  ProductSearchResult,
  ProductWithDetails 
} from '@/types/products';

// Cache for frequently accessed data with TTL and size limits
const categoryCache = new Map();
const imageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

// Cache management functions
function setCacheWithTTL(cache: Map<any, any>, key: any, value: any) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { value, timestamp: Date.now() });
}

function getCacheWithTTL(cache: Map<any, any>, key: any) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.value;
  }
  cache.delete(key);
  return null;
}

// GET /api/products - Optimized with better caching and query strategy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: ProductFilters = {
      categoryId: searchParams.get('categoryId') || undefined,
      businessOwnerId: searchParams.get('businessOwnerId') || undefined,
      status: searchParams.get('status') as any || undefined,
      isCustomizable: searchParams.get('isCustomizable') === 'true' ? true : 
                     searchParams.get('isCustomizable') === 'false' ? false : undefined,
      isDigital: searchParams.get('isDigital') === 'true' ? true : 
                searchParams.get('isDigital') === 'false' ? false : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    console.log('Fetching products with filters:', filters);
    
    // Optimize query strategy based on most common filter
    let products: any[] = [];
    
    if (filters.businessOwnerId) {
      // Business owner specific query - most common use case
      const constraints = [
        { field: 'businessOwnerId', operator: '==', value: filters.businessOwnerId }
      ];
      
      if (filters.status) {
        constraints.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      products = await FirebaseAdminService.queryDocuments(
        Collections.PRODUCTS,
        constraints as any[],
        { field: filters.sortBy!, direction: filters.sortOrder! },
        (filters.limit! + 1) * 2 // Get extra for filtering
      );

      // Apply remaining filters in memory for better performance
      if (filters.categoryId || filters.isCustomizable !== undefined || 
          filters.isDigital !== undefined || filters.minPrice !== undefined || 
          filters.maxPrice !== undefined || filters.tags || filters.search) {
        products = applyInMemoryFilters(products, filters);
      }
    } else {
      // For public queries, use minimal constraints
      const constraints = [];
      
      if (filters.status) {
        constraints.push({ field: 'status', operator: '==', value: filters.status });
      }
      
      if (filters.categoryId) {
        constraints.push({ field: 'categoryId', operator: '==', value: filters.categoryId });
      }

      products = await FirebaseAdminService.queryDocuments(
        Collections.PRODUCTS,
        constraints as any[],
        { field: filters.sortBy!, direction: filters.sortOrder! },
        (filters.limit! + 1) * 2 // Get extra for filtering
      );

      // Apply remaining filters in memory
      products = applyInMemoryFilters(products, filters);
    }

    // Apply pagination
    const startIndex = filters.offset!;
    const endIndex = startIndex + filters.limit!;
    const hasMore = products.length > endIndex;
    const paginatedProducts = products.slice(startIndex, endIndex);

    console.log(`Fetched ${paginatedProducts.length} products, hasMore: ${hasMore}`);

    // Batch fetch related data for better performance
    const [categoriesMap, imagesMap, businessOwnersMap] = await Promise.all([
      fetchCategoriesForProducts(paginatedProducts),
      fetchImagesForProducts(paginatedProducts),
      fetchBusinessOwnersForProducts(paginatedProducts)
    ]);

    // Transform to ProductWithDetails with cached data
    const productsWithDetails: ProductWithDetails[] = paginatedProducts.map((product) => ({
      ...product,
      category: categoriesMap.get(product.categoryId) || createDefaultCategory(),
      images: imagesMap.get(product.id) || [],
      variants: [], // TODO: Implement variants when needed
      businessOwner: businessOwnersMap.get(product.businessOwnerId)
    }));

    const response: ProductSearchResult = {
      products: productsWithDetails,
      total: products.length,
      hasMore,
      filters
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (improved error handling)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Business owner or admin access required' },
        { status: 401 }
      );
    }

    const body: CreateProductData = await request.json();
    
    console.log('Creating product with data:', body);
    
    // Enhanced validation
    const validationErrors = [];
    
    if (!body.name || body.name.trim().length === 0) {
      validationErrors.push('Product name is required');
    }
    
    if (!body.description || body.description.trim().length === 0) {
      validationErrors.push('Product description is required');
    }
    
    if (!body.categoryId || body.categoryId.trim().length === 0) {
      validationErrors.push('Category is required');
    }
    
    if (body.price === undefined || body.price < 0) {
      validationErrors.push('Valid price is required');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Verify category exists
    try {
      const categoryExists = await FirebaseAdminService.getDocument(
        Collections.PRODUCT_CATEGORIES,
        body.categoryId
      );
      
      if (!categoryExists) {
        return NextResponse.json(
          { error: 'Selected category does not exist' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error validating category:', error);
      return NextResponse.json(
        { error: 'Failed to validate category' },
        { status: 400 }
      );
    }

    // Generate SKU if not provided
    const sku = body.sku?.trim() || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check for duplicate SKU
    const existingSku = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCTS,
      [{ field: 'sku', operator: '==', value: sku }]
    );

    if (existingSku.length > 0) {
      return NextResponse.json(
        { error: 'Product SKU already exists' },
        { status: 400 }
      );
    }

    const productData: Omit<Product, 'id'> = {
      name: body.name.trim(),
      description: body.description.trim(),
      shortDescription: body.shortDescription?.trim() || '',
      categoryId: body.categoryId.trim(),
      price: Number(body.price),
      stockQuantity: Number(body.stockQuantity) || 0,
      sku,
      businessOwnerId: session.user.id,
      status: body.status || 'draft', // Default to draft for new products
      isCustomizable: Boolean(body.isCustomizable),
      isDigital: Boolean(body.isDigital),
      tags: Array.isArray(body.tags) ? body.tags.filter(tag => tag.trim().length > 0) : [],
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      // Only include optional fields if they have values
      ...(body.weight !== undefined && body.weight > 0 && { weight: Number(body.weight) }),
      ...(body.dimensions && { dimensions: body.dimensions }),
      ...(body.specifications && Object.keys(body.specifications).length > 0 && { specifications: body.specifications }),
      ...(body.seoTitle && body.seoTitle.trim().length > 0 && { seoTitle: body.seoTitle.trim() }),
      ...(body.seoDescription && body.seoDescription.trim().length > 0 && { seoDescription: body.seoDescription.trim() })
    };

    console.log('Creating product with final data:', productData);

    const product = await FirebaseAdminService.createDocument(
      Collections.PRODUCTS,
      productData
    );

    console.log('Product created successfully:', product.id);

    // Clear cache for this business owner
    categoryCache.clear();
    imageCache.clear();

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create product', 
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to apply filters in memory
function applyInMemoryFilters(products: any[], filters: ProductFilters) {
  return products.filter(product => {
    if (filters.categoryId && product.categoryId !== filters.categoryId) return false;
    if (filters.isCustomizable !== undefined && product.isCustomizable !== filters.isCustomizable) return false;
    if (filters.isDigital !== undefined && product.isDigital !== filters.isDigital) return false;
    if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        product.tags && product.tags.some((productTag: string) => 
          productTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(searchLower);
      const matchesDescription = product.description.toLowerCase().includes(searchLower);
      const matchesTags = product.tags && product.tags.some((tag: string) => 
        tag.toLowerCase().includes(searchLower)
      );
      if (!matchesName && !matchesDescription && !matchesTags) return false;
    }
    return true;
  });
}

// Batch fetch categories with caching
async function fetchCategoriesForProducts(products: any[]) {
  const categoryIds = Array.from(new Set(products.map(p => p.categoryId)));
  const categoriesMap = new Map();

  for (const categoryId of categoryIds) {
    try {
      const cached = getCacheWithTTL(categoryCache, categoryId);
      if (cached) {
        categoriesMap.set(categoryId, cached);
        continue;
      }

      const category = await FirebaseAdminService.getDocument(
        Collections.PRODUCT_CATEGORIES,
        categoryId
      );
      
      const transformedCategory = category ? {
        id: category.id,
        name: category.name || category.categoryName,
        description: category.description,
        slug: category.slug,
        parentId: category.parentId || category.parentCategoryId,
        isActive: category.isActive !== false,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      } : null;
      
      if (transformedCategory) {
        setCacheWithTTL(categoryCache, categoryId, transformedCategory);
        categoriesMap.set(categoryId, transformedCategory);
      }
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
    }
  }

  return categoriesMap;
}

// Batch fetch images with caching
async function fetchImagesForProducts(products: any[]) {
  const productIds = products.map(p => p.id);
  const imagesMap = new Map();

  try {
    // Fetch all images in one query and group by productId
    const allImages = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_IMAGES,
      [],
      { field: 'sortOrder', direction: 'asc' },
      undefined
    );

    // Group images by productId
    const imagesByProduct = allImages.reduce((acc, image) => {
      if (productIds.includes((image as any).productId)) {
        if (!acc[(image as any).productId]) {
          acc[(image as any).productId] = [];
        }
        acc[(image as any).productId].push(image);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Set in map
    productIds.forEach(productId => {
      imagesMap.set(productId, imagesByProduct[productId] || []);
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    // Initialize empty arrays for all products
    productIds.forEach(productId => {
      imagesMap.set(productId, []);
    });
  }

  return imagesMap;
}

// Batch fetch business owners
async function fetchBusinessOwnersForProducts(products: any[]) {
  const businessOwnerIds = Array.from(new Set(products.map(p => p.businessOwnerId)));
  const businessOwnersMap = new Map();

  for (const businessOwnerId of businessOwnerIds) {
    try {
      const businessOwner = await FirebaseAdminService.getDocument(
        Collections.USERS,
        businessOwnerId
      );
      
      if (businessOwner) {
        businessOwnersMap.set(businessOwnerId, businessOwner);
      }
    } catch (error) {
      console.error(`Error fetching business owner ${businessOwnerId}:`, error);
    }
  }

  return businessOwnersMap;
}

function createDefaultCategory() {
  return {
    id: '',
    name: 'Uncategorized',
    slug: 'uncategorized',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}