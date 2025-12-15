import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ProductImage } from '@/types/products';
import { Timestamp } from 'firebase/firestore';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/products/[id]/images - Upload product images
export async function POST(request: NextRequest, { params }: RouteParams) {
  console.log('Image upload API called');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    console.log('Received files:', files.length);
    console.log('Product ID:', productId);

    if (!files || files.length === 0) {
      console.log('No files provided');
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
        const fileName = `${timestamp}-${i}.${fileExtension}`;

        // Upload to Supabase Storage (use private bucket for watermarking)
        // Try private bucket first, fallback to public for backward compatibility
        const usePrivateBucket = true // Set to true to enable watermarking for new uploads
        let bucket = usePrivateBucket ? StorageBuckets.PRODUCTS_PRIVATE : StorageBuckets.PRODUCTS
        
        let uploadResult;
        try {
          uploadResult = await SupabaseStorageService.uploadFileFromServer(
            Buffer.from(buffer),
            fileName,
            file.type,
            {
              bucket: bucket,
              folder: productId,
              upsert: false
            }
          );
        } catch (error: any) {
          // If private bucket doesn't exist, fallback to public bucket
          const isBucketNotFound = error.message?.includes('Bucket not found') || 
                                   error.message?.includes('not found') ||
                                   (error.__isStorageError && error.statusCode === '404');
          
          if (isBucketNotFound && bucket === StorageBuckets.PRODUCTS_PRIVATE) {
            console.warn(`Private bucket ${bucket} not found, falling back to public bucket ${StorageBuckets.PRODUCTS}`);
            bucket = StorageBuckets.PRODUCTS;
            uploadResult = await SupabaseStorageService.uploadFileFromServer(
              Buffer.from(buffer),
              fileName,
              file.type,
              {
                bucket: bucket,
                folder: productId,
                upsert: false
              }
            );
          } else {
            throw error;
          }
        }

        // Get current sort order - fetch all and filter in memory to avoid index requirements
        const allImages = await FirebaseAdminService.queryDocuments(
          Collections.PRODUCT_IMAGES,
          [], // No constraints to avoid index requirements
          undefined, // No sorting in Firestore
          undefined // No limit
        );
        const existingImages = allImages.filter(img => img.productId === productId);

        const sortOrder = existingImages.length + i;

        // For private buckets, generate a signed URL for immediate preview
        // (Shop owner should be able to see their own uploads)
        let displayUrl = uploadResult.url;
        if (bucket === StorageBuckets.PRODUCTS_PRIVATE) {
          try {
            const signedUrl = await SupabaseStorageService.getSignedUrl(bucket, uploadResult.path, 3600);
            displayUrl = signedUrl;
            console.log(`Generated signed URL for product image preview`);
          } catch (signedUrlError) {
            console.warn('Failed to generate signed URL, using public URL:', signedUrlError);
            // Fallback to public URL
          }
        }

        // Create image document
        const imageData = {
          productId,
          imageUrl: displayUrl, // Use signed URL if private bucket, otherwise public URL
          thumbnailUrl: displayUrl, // You can create thumbnails later
          altText: altText || file.name,
          isPrimary: isPrimary && i === 0, // Only first image can be primary
          sortOrder,
          createdAt: Timestamp.now(),
          // Store Supabase metadata for future operations
          storagePath: uploadResult.path,
          storageBucket: bucket
        } as Omit<ProductImage, 'id'>;

        console.log('Creating image document:', imageData);

        const image = await FirebaseAdminService.createDocument(
          Collections.PRODUCT_IMAGES,
          imageData
        );

        console.log('Created image:', image);

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

    console.log('Successfully uploaded images:', uploadedImages.length);
    
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
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get images - fetch all and filter in memory to avoid index requirements
    const allImages = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_IMAGES,
      [], // No constraints to avoid index requirements
      undefined, // No sorting in Firestore
      undefined // No limit
    );
    const images = allImages.filter(img => img.productId === productId);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

