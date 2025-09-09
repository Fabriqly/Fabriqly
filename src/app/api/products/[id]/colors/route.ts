import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  ProductColor, 
  CreateProductColorData, 
  UpdateProductColorData 
} from '@/types/enhanced-products';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/products/[id]/colors - Get all colors for a product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product colors
    const productColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [{ field: 'productId', operator: '==' as const, value: productId }]
    );

    // Get color details for each product color
    const colorsWithDetails = await Promise.all(
      productColors.map(async (productColor) => {
        const color = await FirebaseAdminService.getDocument(
          Collections.COLORS,
          productColor.colorId
        );

        return {
          ...productColor,
          color: color || { id: '', colorName: 'Unknown Color', hexCode: '#000000', rgbCode: 'rgb(0,0,0)', isActive: true, createdAt: new Date() }
        };
      })
    );

    return NextResponse.json({ productColors: colorsWithDetails });
  } catch (error) {
    console.error('Error fetching product colors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const productId = params.id;
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

    // Check if user owns the product or is admin
    if (product.shopId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only add colors to your own products' },
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

    // Check if product-color combination already exists
    const existingProductColor = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [
        { field: 'productId', operator: '==' as const, value: productId },
        { field: 'colorId', operator: '==' as const, value: body.colorId }
      ]
    );

    if (existingProductColor.length > 0) {
      return NextResponse.json(
        { error: 'This color is already added to the product' },
        { status: 400 }
      );
    }

    const productColorData: Omit<ProductColor, 'id'> = {
      productId,
      colorId: body.colorId,
      priceAdjustment: body.priceAdjustment || 0,
      isAvailable: body.isAvailable !== false, // Default to true
      stockQuantity: body.stockQuantity,
      createdAt: new Date()
    };

    const productColor = await FirebaseAdminService.createDocument(
      Collections.PRODUCT_COLORS,
      productColorData
    );

    // Return with color details
    const productColorWithDetails = {
      ...productColor,
      color
    };

    return NextResponse.json({ productColor: productColorWithDetails }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
