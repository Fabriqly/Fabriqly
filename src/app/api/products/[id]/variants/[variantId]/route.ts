import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { ResponseBuilder } from '@/utils/ResponseBuilder';

/**
 * PUT /api/products/[id]/variants/[variantId] - Update a variant
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    const { id: productId, variantId } = await params;
    const body = await request.json();

    // Verify variant exists
    const variant = await FirebaseAdminService.getDocument(Collections.PRODUCT_VARIANTS, variantId);
    if (!variant) {
      return NextResponse.json(
        ResponseBuilder.error('Variant not found'),
        { status: 404 }
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

    // Check ownership
    if (product.businessOwnerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        ResponseBuilder.error('Unauthorized - You do not own this product'),
        { status: 403 }
      );
    }

    // Check if updating to a duplicate variant (if name/value changed)
    if (body.variantName || body.variantValue) {
      const newVariantName = body.variantName?.trim() || variant.variantName;
      const newVariantValue = body.variantValue?.trim() || variant.variantValue;

      if (newVariantName !== variant.variantName || newVariantValue !== variant.variantValue) {
        const existingVariants = await FirebaseAdminService.queryDocuments(
          Collections.PRODUCT_VARIANTS,
          [
            { field: 'productId', operator: '==', value: productId },
            { field: 'variantName', operator: '==', value: newVariantName },
            { field: 'variantValue', operator: '==', value: newVariantValue }
          ]
        );

        if (existingVariants && existingVariants.length > 0 && existingVariants[0].id !== variantId) {
          return NextResponse.json(
            ResponseBuilder.error(`Variant "${newVariantName}: ${newVariantValue}" already exists for this product`),
            { status: 400 }
          );
        }
      }
    }

    // Build update data
    const updateData: any = {
      updatedAt: Timestamp.now() as any
    };

    if (body.variantName !== undefined) updateData.variantName = body.variantName.trim();
    if (body.variantValue !== undefined) updateData.variantValue = body.variantValue.trim();
    if (body.priceAdjustment !== undefined) updateData.priceAdjustment = Number(body.priceAdjustment);
    if (body.stock !== undefined) updateData.stock = Number(body.stock);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    
    if (body.sku !== undefined) {
      if (body.sku.trim()) {
        updateData.sku = body.sku.trim();
      } else {
        updateData.sku = FieldValue.delete();
      }
    }

    await FirebaseAdminService.updateDocument(
      Collections.PRODUCT_VARIANTS,
      variantId,
      updateData
    );

    const updatedVariant = await FirebaseAdminService.getDocument(Collections.PRODUCT_VARIANTS, variantId);

    return NextResponse.json(
      ResponseBuilder.success({ variant: updatedVariant })
    );
  } catch (error: any) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      ResponseBuilder.error('Failed to update variant', error.message),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/variants/[variantId] - Delete a variant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        ResponseBuilder.error('Authentication required'),
        { status: 401 }
      );
    }

    const { id: productId, variantId } = await params;

    // Verify variant exists
    const variant = await FirebaseAdminService.getDocument(Collections.PRODUCT_VARIANTS, variantId);
    if (!variant) {
      return NextResponse.json(
        ResponseBuilder.error('Variant not found'),
        { status: 404 }
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

    // Check ownership
    if (product.businessOwnerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        ResponseBuilder.error('Unauthorized - You do not own this product'),
        { status: 403 }
      );
    }

    // Delete variant
    await FirebaseAdminService.deleteDocument(Collections.PRODUCT_VARIANTS, variantId);

    return NextResponse.json(
      ResponseBuilder.success({ message: 'Variant deleted successfully' })
    );
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      ResponseBuilder.error('Failed to delete variant', error.message),
      { status: 500 }
    );
  }
}

