import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ProductVariant } from '@/types/products';

/**
 * GET /api/products/[id]/variants - Get all variants for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        ResponseBuilder.error('Product ID is required'),
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await FirebaseAdminService.getDocument(Collections.PRODUCTS, productId);
    if (!product) {
      return NextResponse.json(
        ResponseBuilder.error('Product not found'),
        { status: 404 }
      );
    }

    // Get all variants for this product
    const variants = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_VARIANTS,
      [{ field: 'productId', operator: '==', value: productId }],
      { field: 'variantName', direction: 'asc' }
    );

    return NextResponse.json(
      ResponseBuilder.success({ variants: variants || [] })
    );
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      ResponseBuilder.error('Failed to fetch variants', error.message),
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/variants - Create a new variant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.variantName || !body.variantValue) {
      return NextResponse.json(
        ResponseBuilder.error('Variant name and value are required'),
        { status: 400 }
      );
    }

    // Verify product exists and user owns it
    const product = await FirebaseAdminService.getDocument(Collections.PRODUCTS, productId);
    if (!product) {
      return NextResponse.json(
        ResponseBuilder.error('Product not found'),
        { status: 404 }
      );
    }

    // Check ownership (business owner or admin)
    if (product.businessOwnerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        ResponseBuilder.error('Unauthorized - You do not own this product'),
        { status: 403 }
      );
    }

    // Check if variant already exists
    const existingVariants = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_VARIANTS,
      [
        { field: 'productId', operator: '==', value: productId },
        { field: 'variantName', operator: '==', value: body.variantName.trim() },
        { field: 'variantValue', operator: '==', value: body.variantValue.trim() }
      ]
    );

    if (existingVariants && existingVariants.length > 0) {
      return NextResponse.json(
        ResponseBuilder.error(`Variant "${body.variantName}: ${body.variantValue}" already exists for this product`),
        { status: 400 }
      );
    }

    // Create variant
    const variantData: Omit<ProductVariant, 'id'> = {
      productId,
      variantName: body.variantName.trim(),
      variantValue: body.variantValue.trim(),
      priceAdjustment: Number(body.priceAdjustment) || 0,
      stock: Number(body.stock) || 0,
      sku: body.sku?.trim() || '',
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any
    };

    const variantId = await FirebaseAdminService.createDocument(
      Collections.PRODUCT_VARIANTS,
      variantData
    );

    const variant = await FirebaseAdminService.getDocument(Collections.PRODUCT_VARIANTS, variantId);

    return NextResponse.json(
      ResponseBuilder.created({ variant }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      ResponseBuilder.error('Failed to create variant', error.message),
      { status: 500 }
    );
  }
}

