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

// GET /api/products - List products with filters
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

    // Build Firestore query constraints
    const constraints = [];
    
    if (filters.categoryId) {
      constraints.push({ field: 'categoryId', operator: '==' as const, value: filters.categoryId });
    }
    
    if (filters.businessOwnerId) {
      constraints.push({ field: 'businessOwnerId', operator: '==' as const, value: filters.businessOwnerId });
    }
    
    if (filters.status) {
      constraints.push({ field: 'status', operator: '==' as const, value: filters.status });
    }
    
    if (filters.isCustomizable !== undefined) {
      constraints.push({ field: 'isCustomizable', operator: '==' as const, value: filters.isCustomizable });
    }
    
    if (filters.isDigital !== undefined) {
      constraints.push({ field: 'isDigital', operator: '==' as const, value: filters.isDigital });
    }
    
    if (filters.minPrice !== undefined) {
      constraints.push({ field: 'price', operator: '>=' as const, value: filters.minPrice });
    }
    
    if (filters.maxPrice !== undefined) {
      constraints.push({ field: 'price', operator: '<=' as const, value: filters.maxPrice });
    }

    // Get products with pagination
    const result = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCTS,
      constraints,
      { field: filters.sortBy!, direction: filters.sortOrder! },
      filters.limit! + 1 // Get one extra to check if there are more
    );

    const hasMore = result.length > filters.limit!;
    const products = hasMore ? result.slice(0, filters.limit!) : result;

    // For now, return basic products. In a real implementation, you'd populate with categories and images
    const productsWithDetails: ProductWithDetails[] = await Promise.all(
      products.map(async (product) => {
        // Get category
        const category = await FirebaseAdminService.getDocument(
          Collections.PRODUCT_CATEGORIES,
          product.categoryId
        );

        // Get images
        const images = await FirebaseAdminService.queryDocuments(
          Collections.PRODUCT_IMAGES,
          [{ field: 'productId', operator: '==' as const, value: product.id }],
          { field: 'sortOrder', direction: 'asc' }
        );

        return {
          ...product,
          category: category || { id: '', name: 'Unknown', slug: 'unknown', isActive: true, createdAt: new Date(), updatedAt: new Date() },
          images: images || [],
          variants: [] // TODO: Implement variants
        };
      })
    );

    const response: ProductSearchResult = {
      products: productsWithDetails,
      total: productsWithDetails.length, // This would be the actual total count in production
      hasMore,
      filters
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
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
    
    // Validate required fields
    if (!body.name || !body.description || !body.categoryId || body.price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, categoryId, price' },
        { status: 400 }
      );
    }

    // Generate SKU if not provided
    const sku = body.sku || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const productData: Omit<Product, 'id'> = {
      name: body.name,
      description: body.description,
      shortDescription: body.shortDescription,
      categoryId: body.categoryId,
      price: body.price,
      stockQuantity: body.stockQuantity || 0,
      sku,
      businessOwnerId: session.user.id,
      status: body.status || 'active',
      isCustomizable: body.isCustomizable || false,
      isDigital: body.isDigital || false,
      weight: body.weight,
      dimensions: body.dimensions,
      tags: body.tags || [],
      specifications: body.specifications,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const product = await FirebaseAdminService.createDocument(
      Collections.PRODUCTS,
      productData
    );

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

