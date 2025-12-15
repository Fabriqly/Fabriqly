import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

interface RouteParams {
  params: Promise<{
    id: string;
    imageId: string;
  }>;
}

// PUT /api/products/[id]/images/[imageId] - Update image details
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: productId, imageId } = await params;

    if (!productId || !imageId) {
      return NextResponse.json(
        { error: 'Product ID and Image ID are required' },
        { status: 400 }
      );
    }

    // Verify product exists and user owns it
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

    if (product.businessOwnerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only update images for your own products' },
        { status: 403 }
      );
    }

    // Get the image
    const image = await FirebaseAdminService.getDocument(
      Collections.PRODUCT_IMAGES,
      imageId
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    if (image.productId !== productId) {
      return NextResponse.json(
        { error: 'Image does not belong to this product' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { altText, isPrimary, sortOrder } = body;

    // If setting as primary, unset other primary images
    if (isPrimary) {
      const otherImages = await FirebaseAdminService.queryDocuments(
        Collections.PRODUCT_IMAGES,
        [
          { field: 'productId', operator: '==' as const, value: productId },
          { field: 'isPrimary', operator: '==' as const, value: true }
        ]
      );

      for (const otherImage of otherImages) {
        if (otherImage.id !== imageId) {
          await FirebaseAdminService.updateDocument(
            Collections.PRODUCT_IMAGES,
            otherImage.id,
            { isPrimary: false }
          );
        }
      }
    }

    // Update the image
    const updateData: any = {};
    if (altText !== undefined) updateData.altText = altText;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedImage = await FirebaseAdminService.updateDocument(
      Collections.PRODUCT_IMAGES,
      imageId,
      updateData
    );

    return NextResponse.json({ image: updatedImage });
  } catch (error: any) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/images/[imageId] - Delete an image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: productId, imageId } = await params;

    if (!productId || !imageId) {
      return NextResponse.json(
        { error: 'Product ID and Image ID are required' },
        { status: 400 }
      );
    }

    // Verify product exists and user owns it
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

    if (product.businessOwnerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete images for your own products' },
        { status: 403 }
      );
    }

    // Get the image
    const image = await FirebaseAdminService.getDocument(
      Collections.PRODUCT_IMAGES,
      imageId
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    if (image.productId !== productId) {
      return NextResponse.json(
        { error: 'Image does not belong to this product' },
        { status: 400 }
      );
    }

    // Delete from Supabase storage
    try {
      const { ImageCleanupService } = await import('@/services/ImageCleanupService');
      await ImageCleanupService.deleteImage(image.imageUrl, 'products');
    } catch (error) {
      console.warn('Failed to delete image from Supabase storage:', error);
      // Continue with database deletion even if storage cleanup fails
    }

    // Delete the image document
    await FirebaseAdminService.deleteDocument(
      Collections.PRODUCT_IMAGES,
      imageId
    );

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

