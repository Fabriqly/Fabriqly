import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ServiceContainer } from '@/container/ServiceContainer';
import { ProductService } from '@/services/ProductService';
import { 
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters,
  ProductSearchResult
} from '@/types/products';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

// GET /api/products - Get products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const statusParam = searchParams.get('status');
    const filters: ProductFilters = {
      categoryId: searchParams.get('categoryId') || undefined,
      businessOwnerId: searchParams.get('businessOwnerId') || undefined,
      status: statusParam === 'all' ? undefined : (statusParam as any) || undefined,
      isCustomizable: searchParams.get('isCustomizable') === 'true' ? true : 
                     searchParams.get('isCustomizable') === 'false' ? false : undefined,
      isDigital: searchParams.get('isDigital') === 'true' ? true : 
                searchParams.get('isDigital') === 'false' ? false : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined
    };

    const sortBy = (searchParams.get('sortBy') as any) || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') as any) || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');

    const productService = ServiceContainer.getInstance().get<ProductService>('productService');
    const products = await productService.getProductsWithDetails({
      filters,
      sortBy,
      sortOrder,
      limit
    });

    const result: ProductSearchResult = {
      products,
      total: products.length,
      hasMore: products.length === limit,
      filters
    };

    return NextResponse.json(ResponseBuilder.success(result));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
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
    const productService = ServiceContainer.getInstance().get<ProductService>('productService');

    const product = await productService.createProduct(body, session.user.id);

    return NextResponse.json(ResponseBuilder.created(product), { status: 201 });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}
