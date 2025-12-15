import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

interface RouteParams {
  params: Promise<{
    id: string; // product ID
    colorId: string; // color ID
  }>;
}

// DELETE /api/products/[id]/colors/[colorId] - Remove specific color from product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Business owner or admin access required' },
        { status: 401 }
      );
    }

    const { id: productId, colorId } = await params;

    if (!productId || !colorId) {
      return NextResponse.json(
        { error: 'Product ID and Color ID are required' },
        { status: 400 }
      );
    }

    // Verify product exists
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

    // Check ownership for business owners
    if (session.user.role === 'business_owner' && product.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only modify your own products' },
        { status: 403 }
      );
    }

    // Find the product-color association
    const productColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [
        { field: 'productId', operator: '==' as const, value: productId },
        { field: 'colorId', operator: '==' as const, value: colorId }
      ]
    );

    if (productColors.length === 0) {
      return NextResponse.json(
        { error: 'Color association not found for this product' },
        { status: 404 }
      );
    }

    // Delete the product-color association
    await FirebaseAdminService.deleteDocument(
      Collections.PRODUCT_COLORS,
      productColors[0].id
    );

    return NextResponse.json({ 
      message: 'Color removed from product successfully',
      removedProductColorId: productColors[0].id
    });
  } catch (error: any) {
    console.error('Error removing color from product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}