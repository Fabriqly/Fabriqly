import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/products/[id]/publish - Publish a draft product
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { id: productId } = await params;
    
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

    console.log('Publishing product:', productId);

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

    // Check ownership (business owners can only publish their own products)
    if (session.user.role === 'business_owner' && existingProduct.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only publish your own products' },
        { status: 403 }
      );
    }

    // Check if product is in draft status
    if (existingProduct.status !== 'draft') {
      return NextResponse.json(
        { error: 'Product is not in draft status' },
        { status: 400 }
      );
    }

    // Update product status to active
    const updatedProduct = await FirebaseAdminService.updateDocument(
      Collections.PRODUCTS,
      productId,
      {
        status: 'active',
        updatedAt: new Date()
      }
    );

    console.log('Product published successfully');

    // Log activity
    try {
      console.log('Logging product publication activity...');
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'product_published',
        title: 'Product Published',
        description: `Product "${existingProduct.name}" has been published and is now live`,
        priority: 'medium',
        status: 'active',
        actorId: session.user.id,
        targetId: productId,
        targetType: 'product',
        targetName: existingProduct.name,
        metadata: {
          productName: existingProduct.name,
          sku: existingProduct.sku,
          categoryId: existingProduct.categoryId,
          businessOwnerId: existingProduct.businessOwnerId,
          publishedBy: session.user.role,
          publishedAt: new Date().toISOString(),
          previousStatus: 'draft',
          newStatus: 'active'
        }
      });
      console.log('✅ Product publication activity logged successfully');
    } catch (activityError) {
      console.error('❌ Error logging product publication activity:', activityError);
      // Don't fail the publication if activity logging fails
    }

    return NextResponse.json({ 
      product: updatedProduct,
      message: 'Product published successfully'
    });
  } catch (error: any) {
    console.error('Error publishing product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to publish product', 
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
