import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ProductImage } from '@/types/products';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/products/[id]/images - Upload product images
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { error: 'Forbidden - You can only upload images for your own products' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const altText = formData.get('altText') as string;
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const uploadedImages: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `File ${file.name} is not an image` },
          { status: 400 }
        );
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 5MB` },
          { status: 400 }
        );
      }

      try {
        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `products/${productId}/${timestamp}-${i}.${fileExtension}`;

        // Upload to Firebase Storage (this would need Firebase Admin Storage setup)
        // For now, we'll simulate the upload and store the URL
        const imageUrl = `https://storage.googleapis.com/your-bucket/${fileName}`;
        const thumbnailUrl = `https://storage.googleapis.com/your-bucket/thumbnails/${fileName}`;

        // Get current sort order
        const existingImages = await FirebaseAdminService.queryDocuments(
          Collections.PRODUCT_IMAGES,
          [{ field: 'productId', operator: '==' as const, value: productId }]
        );

        const sortOrder = existingImages.length + i;

        // Create image document
        const imageData: Omit<ProductImage, 'id'> = {
          productId,
          imageUrl,
          thumbnailUrl,
          altText: altText || file.name,
          isPrimary: isPrimary && i === 0, // Only first image can be primary
          sortOrder,
          createdAt: new Date()
        };

        const image = await FirebaseAdminService.createDocument(
          Collections.PRODUCT_IMAGES,
          imageData
        );

        uploadedImages.push(image as ProductImage);

        // If this is the primary image, update other images to not be primary
        if (isPrimary && i === 0) {
          const otherImages = existingImages.filter(img => img.isPrimary);
          for (const otherImage of otherImages) {
            await FirebaseAdminService.updateDocument(
              Collections.PRODUCT_IMAGES,
              otherImage.id,
              { isPrimary: false }
            );
          }
        }
      } catch (error) {
        console.error(`Error uploading image ${file.name}:`, error);
        return NextResponse.json(
          { error: `Failed to upload image ${file.name}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      images: uploadedImages,
      message: `Successfully uploaded ${uploadedImages.length} image(s)`
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/products/[id]/images - Get product images
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const images = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_IMAGES,
      [{ field: 'productId', operator: '==' as const, value: productId }],
      { field: 'sortOrder', direction: 'asc' }
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

