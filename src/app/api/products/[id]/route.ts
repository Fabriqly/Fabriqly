import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Product, 
  UpdateProductData, 
  ProductWithDetails 
} from '@/types/products';

interface RouteParams {
  params: {
    id: string;
  };
}

// Cache for frequently accessed data with TTL and size limits
const categoryCache = new Map();
const imageCache = new Map();
const businessOwnerCache = new Map();
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

// GET /api/products/[id] - Get single product with full details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const productId = params.id;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching product:', productId);

    // Fetch product
    const product = await FirebaseAdminService.getDocument(
      Collections.PRODUCTS,
      productId
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Product found:', product.name);

    // Fetch related data in parallel for better performance
    const [category, images, businessOwner, productColors] = await Promise.all([
      fetchProductCategory(product.categoryId),
      fetchProductImages(productId),
      fetchBusinessOwner(product.businessOwnerId),
      fetchProductColors(productId)
    ]);

    console.log('Related data fetched:', {
      category: category?.name,
      imagesCount: images.length,
      businessOwner: businessOwner?.name,
      colorsCount: productColors.length
    });

    const productWithDetails: ProductWithDetails = {
      ...product,
      category: category || createDefaultCategory(),
      images: images,
      variants: [], // TODO: Implement variants when needed
      businessOwner,
      productColors
    };

    return NextResponse.json({ product: productWithDetails });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch product', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const productId = params.id;
    
    if (!session || !['business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Business owner or admin access required' },
        { status: 401 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('Updating product:', productId);

    // Check if product exists
    const existingProduct = await FirebaseAdminService.getDocument(
      Collections.PRODUCTS,
      productId
    );

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check ownership (business owners can only edit their own products)
    if (session.user.role === 'business_owner' && existingProduct.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only edit your own products' },
        { status: 403 }
      );
    }

    const body: UpdateProductData = await request.json();
    console.log('Update data received:', body);

    // Enhanced validation
    const validationErrors = [];
    
    if (body.name !== undefined && (!body.name || body.name.trim().length === 0)) {
      validationErrors.push('Product name cannot be empty');
    }
    
    if (body.description !== undefined && (!body.description || body.description.trim().length === 0)) {
      validationErrors.push('Product description cannot be empty');
    }
    
    if (body.categoryId !== undefined && (!body.categoryId || body.categoryId.trim().length === 0)) {
      validationErrors.push('Category cannot be empty');
    }
    
    if (body.price !== undefined && (body.price < 0)) {
      validationErrors.push('Price must be a positive number');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Verify category exists if being updated
    if (body.categoryId && body.categoryId !== existingProduct.categoryId) {
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
    }

    // Check for duplicate SKU if being updated
    if (body.sku && body.sku !== existingProduct.sku) {
      const existingSku = await FirebaseAdminService.queryDocuments(
        Collections.PRODUCTS,
        [{ field: 'sku', operator: '==', value: body.sku }]
      );

      if (existingSku.length > 0) {
        return NextResponse.json(
          { error: 'Product SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data - only include fields that are being updated
    const updateData: Partial<Product> = {
      updatedAt: new Date()
    };

    // Update fields only if they're provided
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription?.trim() || '';
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId.trim();
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.stockQuantity !== undefined) updateData.stockQuantity = Number(body.stockQuantity);
    if (body.sku !== undefined) updateData.sku = body.sku.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isCustomizable !== undefined) updateData.isCustomizable = Boolean(body.isCustomizable);
    if (body.isDigital !== undefined) updateData.isDigital = Boolean(body.isDigital);
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags.filter(tag => tag.trim().length > 0) : [];
    
    // Handle optional fields
    if (body.weight !== undefined) {
      if (body.weight > 0) {
        updateData.weight = Number(body.weight);
      } else {
        updateData.weight = null; // Remove weight if set to 0 or negative
      }
    }
    
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
    if (body.specifications !== undefined) updateData.specifications = body.specifications;
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle?.trim() || '';
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription?.trim() || '';

    console.log('Updating product with data:', updateData);

    // Update the product
    const updatedProduct = await FirebaseAdminService.updateDocument(
      Collections.PRODUCTS,
      productId,
      updateData
    );

    console.log('Product updated successfully');

    // Clear relevant caches
    categoryCache.clear();
    imageCache.clear();
    businessOwnerCache.clear();

    // Fetch the complete updated product with details
    const [category, images, businessOwner] = await Promise.all([
      fetchProductCategory(updatedProduct.categoryId),
      fetchProductImages(productId),
      fetchBusinessOwner(updatedProduct.businessOwnerId)
    ]);

    const productWithDetails: ProductWithDetails = {
      ...updatedProduct,
      category: category || createDefaultCategory(),
      images: images,
      variants: [],
      businessOwner
    };

    return NextResponse.json({ product: productWithDetails });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update product', 
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const productId = params.id;
    
    if (!session || !['business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Business owner or admin access required' },
        { status: 401 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting product:', productId);

    // Check if product exists
    const existingProduct = await FirebaseAdminService.getDocument(
      Collections.PRODUCTS,
      productId
    );

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check ownership (business owners can only delete their own products)
    if (session.user.role === 'business_owner' && existingProduct.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own products' },
        { status: 403 }
      );
    }

    // Delete related data first
    await Promise.all([
      deleteProductImages(productId),
      deleteProductColors(productId)
    ]);

    // Delete the product
    await FirebaseAdminService.deleteDocument(Collections.PRODUCTS, productId);

    console.log('Product deleted successfully');

    // Clear caches
    categoryCache.clear();
    imageCache.clear();
    businessOwnerCache.clear();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete product', 
        details: error.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions with caching
async function fetchProductCategory(categoryId: string) {
  try {
    if (!categoryId) return null;
    
    const cached = getCacheWithTTL(categoryCache, categoryId);
    if (cached) {
      return cached;
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
    }
    
    return transformedCategory;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

async function fetchProductImages(productId: string) {
  try {
    const cached = getCacheWithTTL(imageCache, productId);
    if (cached) {
      return cached;
    }
    
    const allImages = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_IMAGES,
      [],
      { field: 'sortOrder', direction: 'asc' },
      undefined
    );
    
    const images = allImages.filter(image => image.productId === productId);
    setCacheWithTTL(imageCache, productId, images);
    
    return images;
  } catch (error) {
    console.error('Error fetching product images:', error);
    return [];
  }
}

async function fetchBusinessOwner(businessOwnerId: string) {
  try {
    if (!businessOwnerId) return null;
    
    const cached = getCacheWithTTL(businessOwnerCache, businessOwnerId);
    if (cached) {
      return cached;
    }
    
    const businessOwner = await FirebaseAdminService.getDocument(
      Collections.USERS,
      businessOwnerId
    );
    
    if (businessOwner) {
      // Map the user document to the expected businessOwner structure
      const mappedBusinessOwner = {
        id: businessOwnerId,
        name: businessOwner.displayName || 
              `${businessOwner.profile?.firstName || ''} ${businessOwner.profile?.lastName || ''}`.trim() ||
              businessOwner.email,
        businessName: businessOwner.profile?.businessName || businessOwner.displayName
      };
      
      setCacheWithTTL(businessOwnerCache, businessOwnerId, mappedBusinessOwner);
      return mappedBusinessOwner;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching business owner:', error);
    return null;
  }
}

async function fetchProductColors(productId: string) {
  try {
    const allProductColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [],
      undefined,
      undefined
    );
    
    return allProductColors.filter(pc => pc.productId === productId);
  } catch (error) {
    console.error('Error fetching product colors:', error);
    return [];
  }
}

async function deleteProductImages(productId: string) {
  try {
    const images = await fetchProductImages(productId);
    await Promise.all(
      images.map(image => 
        FirebaseAdminService.deleteDocument(Collections.PRODUCT_IMAGES, image.id)
      )
    );
  } catch (error) {
    console.error('Error deleting product images:', error);
  }
}

async function deleteProductColors(productId: string) {
  try {
    const productColors = await fetchProductColors(productId);
    await Promise.all(
      productColors.map(pc => 
        FirebaseAdminService.deleteDocument(Collections.PRODUCT_COLORS, pc.id)
      )
    );
  } catch (error) {
    console.error('Error deleting product colors:', error);
  }
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