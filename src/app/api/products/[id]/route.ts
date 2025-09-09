import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Product, UpdateProductData, ProductWithDetails } from '@/types/products';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/products/[id] - Get a single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get the product
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

    // Get category
    const category = await FirebaseAdminService.getDocument(
      Collections.PRODUCT_CATEGORIES,
      product.categoryId
    );

    // Get images
    const images = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_IMAGES,
      [{ field: 'productId', operator: '==' as const, value: productId }],
      { field: 'sortOrder', direction: 'asc' }
    );

    // Get variants
    const variants = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_VARIANTS,
      [{ field: 'productId', operator: '==' as const, value: productId }],
      { field: 'variantName', direction: 'asc' }
    );

    // Get business owner info
    const businessOwner = await FirebaseAdminService.getDocument(
      Collections.USERS,
      product.businessOwnerId
    );

    const productWithDetails: ProductWithDetails = {
      ...product,
      category: category || { id: '', name: 'Unknown', slug: 'unknown', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      images: images || [],
      variants: variants || [],
      businessOwner: businessOwner ? {
        id: businessOwner.id,
        name: businessOwner.profile?.firstName && businessOwner.profile?.lastName 
          ? `${businessOwner.profile.firstName} ${businessOwner.profile.lastName}`
          : businessOwner.displayName || 'Unknown',
        businessName: businessOwner.businessName
      } : undefined
    };

    return NextResponse.json({ product: productWithDetails });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = params.id;
    const body: UpdateProductData = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get the existing product to check ownership
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

    // Check if user owns the product or is admin
    if (existingProduct.businessOwnerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own products' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove id from update data if it exists
    delete updateData.id;

    const updatedProduct = await FirebaseAdminService.updateDocument(
      Collections.PRODUCTS,
      productId,
      updateData
    );

    return NextResponse.json({ product: updatedProduct });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get the existing product to check ownership
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

    // Check if user owns the product or is admin
    if (existingProduct.businessOwnerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own products' },
        { status: 403 }
      );
    }

    // Delete associated images
    const images = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_IMAGES,
      [{ field: 'productId', operator: '==' as const, value: productId }]
    );

    for (const image of images) {
      await FirebaseAdminService.deleteDocument(
        Collections.PRODUCT_IMAGES,
        image.id
      );
    }

    // Delete associated variants
    const variants = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_VARIANTS,
      [{ field: 'productId', operator: '==' as const, value: productId }]
    );

    for (const variant of variants) {
      await FirebaseAdminService.deleteDocument(
        Collections.PRODUCT_VARIANTS,
        variant.id
      );
    }

    // Delete the product
    await FirebaseAdminService.deleteDocument(
      Collections.PRODUCTS,
      productId
    );

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

