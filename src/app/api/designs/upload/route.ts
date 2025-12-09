import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

// POST /api/designs/upload - Upload design files
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to upload designs
    if (!['designer', 'business_owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Only designers, business owners, and admins can upload designs' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'design', 'thumbnail', or 'preview'
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!type || !['design', 'thumbnail', 'preview'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be design, thumbnail, or preview' },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    if (type === 'thumbnail' || type === 'preview') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Thumbnail and preview files must be images' },
          { status: 400 }
        );
      }
    }

    // Validate file size (20MB limit for design files, 5MB for images)
    const maxSize = type === 'design' ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must be less than ${type === 'design' ? '20MB' : '5MB'}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;

    // Read file buffer once (can't read File.arrayBuffer() twice)
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage using server-side method (use private bucket for watermarking)
    // Try private bucket first, fallback to public for backward compatibility
    const usePrivateBucket = true // Set to true to enable watermarking for new uploads
    let bucket = usePrivateBucket ? StorageBuckets.DESIGNS_PRIVATE : StorageBuckets.DESIGNS
    
    let uploadResult;
    try {
      uploadResult = await SupabaseStorageService.uploadFileFromServer(
        fileBuffer,
        fileName,
        file.type,
        {
          bucket: bucket,
          folder: `designs/${timestamp}`,
          upsert: false
        }
      );
    } catch (error: any) {
      // If private bucket doesn't exist, fallback to public bucket
      const isBucketNotFound = error.message?.includes('Bucket not found') || 
                               error.message?.includes('not found') ||
                               (error.__isStorageError && error.statusCode === '404');
      
      if (isBucketNotFound && bucket === StorageBuckets.DESIGNS_PRIVATE) {
        console.warn(`Private bucket ${bucket} not found, falling back to public bucket ${StorageBuckets.DESIGNS}`);
        bucket = StorageBuckets.DESIGNS;
        
        // Retry with public bucket using same buffer
        uploadResult = await SupabaseStorageService.uploadFileFromServer(
          fileBuffer,
          fileName,
          file.type,
          {
            bucket: bucket,
            folder: `designs/${timestamp}`,
            upsert: false
          }
        );
      } else {
        throw error;
      }
    }

    console.log(`${type} file uploaded:`, uploadResult);

    // For private buckets, generate a signed URL for immediate preview
    // (Designer should be able to see their own uploads)
    let displayUrl = uploadResult.url;
    if (bucket === StorageBuckets.DESIGNS_PRIVATE) {
      try {
        const signedUrl = await SupabaseStorageService.getSignedUrl(bucket, uploadResult.path, 3600);
        displayUrl = signedUrl;
        console.log(`Generated signed URL for ${type} preview`);
      } catch (signedUrlError) {
        console.warn('Failed to generate signed URL, using public URL:', signedUrlError);
        // Fallback to public URL (won't work for private buckets, but at least we tried)
      }
    }

    return NextResponse.json(
      ResponseBuilder.success({
        url: displayUrl,
        path: uploadResult.path,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        fileName: fileName,
        storageBucket: bucket, // Include bucket info for future reference
        storagePath: uploadResult.path // Include path for watermarking
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading design file:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}
