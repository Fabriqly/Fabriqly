import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { UpdateProductColorData } from '@/types/enhanced-products';

interface RouteParams {
  params: {
    id: string;
    colorId: string;
  };
}

// GET /api/products/[id]/colors/[colorId] - Get specific product color
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId, colorId } = params;

    if (!productId || !colorId) {
      return NextResponse.json(
        { error: 'Product ID and Color ID are required' },
        { status: 400 }
      );
    }

    // Get product color
    const productColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [
        { field: 'productId', operator: '==' as const, value: productId },
        { field: 'colorId', operator: '==' as const, value: colorId }
      ]
    );

    if (productColors.length === 0) {
      return NextResponse.json(
        { error: 'Product color not found' },
        { status: 404 }
      );
    }

    const productColor = productColors[0];

    // Get color details
    const color = await FirebaseAdminService.getDocument(
      Collections.COLORS,
      colorId
    );

    const productColorWithDetails = {
      ...productColor,
      color: color || { id: '', colorName: 'Unknown Color', hexCode: '#000000', rgbCode: 'rgb(0,0,0)', isActive: true, createdAt: new Date() }
    };

    return NextResponse.json({ productColor: productColorWithDetails });
  } catch (error) {
    console.error('Error fetching product color:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id]/colors/[colorId] - Update product color
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Business owner or admin access required' },
        { status: 401 }
      );
    }

    const { id: productId, colorId } = params;
    const body: UpdateProductColorData = await request.json();

    if (!productId || !colorId) {
      return NextResponse.json(
        { error: 'Product ID and Color ID are required' },
        { status: 400 }
      );
    }

    // Get existing product color
    const existingProductColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [
        { field: 'productId', operator: '==' as const, value: productId },
        { field: 'colorId', operator: '==' as const, value: colorId }
      ]
    );

    if (existingProductColors.length === 0) {
      return NextResponse.json(
        { error: 'Product color not found' },
        { status: 404 }
      );
    }

    const existingProductColor = existingProductColors[0];

    // Check if user owns the product or is admin
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

    if (product.shopId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only update colors for your own products' },
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

    const updatedProductColor = await FirebaseAdminService.updateDocument(
      Collections.PRODUCT_COLORS,
      existingProductColor.id,
      updateData
    );

    // Get color details
    const color = await FirebaseAdminService.getDocument(
      Collections.COLORS,
      colorId
    );

    const productColorWithDetails = {
      ...updatedProductColor,
      color: color || { id: '', colorName: 'Unknown Color', hexCode: '#000000', rgbCode: 'rgb(0,0,0)', isActive: true, createdAt: new Date() }
    };

    return NextResponse.json({ productColor: productColorWithDetails });
  } catch (error: any) {
    console.error('Error updating product color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/colors/[colorId] - Remove color from product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Business owner or admin access required' },
        { status: 401 }
      );
    }

    const { id: productId, colorId } = params;

    if (!productId || !colorId) {
      return NextResponse.json(
        { error: 'Product ID and Color ID are required' },
        { status: 400 }
      );
    }

    // Get existing product color
    const existingProductColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [
        { field: 'productId', operator: '==' as const, value: productId },
        { field: 'colorId', operator: '==' as const, value: colorId }
      ]
    );

    if (existingProductColors.length === 0) {
      return NextResponse.json(
        { error: 'Product color not found' },
        { status: 404 }
      );
    }

    const existingProductColor = existingProductColors[0];

    // Check if user owns the product or is admin
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

    if (product.shopId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only remove colors from your own products' },
        { status: 403 }
      );
    }

    // Delete the product color
    await FirebaseAdminService.deleteDocument(
      Collections.PRODUCT_COLORS,
      existingProductColor.id
    );

    return NextResponse.json({ message: 'Product color removed successfully' });
  } catch (error: any) {
    console.error('Error deleting product color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
