import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  ProductColor, 
  CreateProductColorData, 
  UpdateProductColorData,
  Color
} from '@/types/enhanced-products';
import { Timestamp } from 'firebase/firestore';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/products/[id]/colors - Get all colors for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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

    // Get all product colors for this product
    const productColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [{ field: 'productId', operator: '==' as const, value: productId }]
    );

    // Get color details for each product color
    const productColorsWithDetails = await Promise.all(
      productColors.map(async (pc) => {
        try {
          const color = await FirebaseAdminService.getDocument(
            Collections.COLORS,
            pc.colorId
          );
          
          return {
            ...pc,
            color: color || {
              id: pc.colorId,
              colorName: 'Unknown Color',
              hexCode: '#000000',
              rgbCode: 'rgb(0, 0, 0)',
              isActive: false,
              createdAt: new Date()
            }
          };
        } catch (error) {
          console.error(`Error fetching color ${pc.colorId}:`, error);
          // Return with placeholder color data
          return {
            ...pc,
            color: {
              id: pc.colorId,
              colorName: 'Unknown Color',
              hexCode: '#000000',
              rgbCode: 'rgb(0, 0, 0)',
              isActive: false,
              createdAt: new Date()
            }
          };
        }
      })
    );

    // Filter out colors that failed to load properly and sort by creation date
    const validProductColors = productColorsWithDetails
      .filter(pc => pc.color.colorName !== 'Unknown Color')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ 
      productColors: validProductColors,
      total: validProductColors.length
    });
  } catch (error: any) {
    console.error('Error fetching product colors:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/colors - Add a color to a product
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Business owner or admin access required' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const body: CreateProductColorData = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.colorId) {
      return NextResponse.json(
        { error: 'Color ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
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

    // Check if color exists
    const color = await FirebaseAdminService.getDocument(
      Collections.COLORS,
      body.colorId
    );

    if (!color) {
      return NextResponse.json(
        { error: 'Color not found' },
        { status: 404 }
      );
    }

    // Check if color is already associated with this product
    const existingProductColor = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [
        { field: 'productId', operator: '==' as const, value: productId },
        { field: 'colorId', operator: '==' as const, value: body.colorId }
      ]
    );

    if (existingProductColor.length > 0) {
      return NextResponse.json(
        { error: 'This color is already associated with this product' },
        { status: 400 }
      );
    }

    // Create product color association
    const productColorData: Omit<ProductColor, 'id'> = {
      productId,
      colorId: body.colorId,
      priceAdjustment: body.priceAdjustment || 0,
      isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
      stockQuantity: body.stockQuantity,
      createdAt: Timestamp.now()
    };

    const productColor = await FirebaseAdminService.createDocument(
      Collections.PRODUCT_COLORS,
      productColorData
    );

    // Return the product color with color details
    const productColorWithDetails = {
      ...productColor,
      color
    };

    return NextResponse.json({ 
      productColor: productColorWithDetails,
      message: 'Color added to product successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding color to product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/colors - Remove all colors from a product (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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

    // Get all product colors for this product
    const productColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [{ field: 'productId', operator: '==' as const, value: productId }]
    );

    // Delete all product color associations
    const deletePromises = productColors.map(pc => 
      FirebaseAdminService.deleteDocument(Collections.PRODUCT_COLORS, pc.id)
    );

    await Promise.all(deletePromises);

    return NextResponse.json({ 
      message: `Removed ${productColors.length} color associations from product`,
      removedCount: productColors.length
    });
  } catch (error: any) {
    console.error('Error removing colors from product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
