import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

/**
 * POST /api/upload/featured-customer - Upload featured customer/patron photo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    // Check if user is a designer
    if (session.user.role !== 'designer' && session.user.role !== 'admin') {
      return NextResponse.json(
        ResponseBuilder.error({ 
          message: 'Forbidden - Only designers can upload featured customer photos', 
          statusCode: 403 
        }),
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const designerId = formData.get('designerId') as string;
    
    if (!file) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'File is required', statusCode: 400 }),
        { status: 400 }
      );
    }

    // Validate file type - only images
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Only image files are allowed', statusCode: 400 }),
        { status: 400 }
      );
    }

    // File size limit - 5MB for customer photos
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        ResponseBuilder.error({ 
          message: 'File size must be less than 5MB',
          statusCode: 400 
        }),
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `customer_${timestamp}_${sanitizedOriginalName}`;
    // Use session user ID if designerId is not provided or is 'temp' (for new profiles)
    const finalDesignerId = designerId && designerId !== 'temp' ? designerId : session.user.id;
    const folder = `featured-customers/${finalDesignerId}`;

    // Upload to Supabase Storage using server-side upload (bypasses RLS)
    // Using DESIGNS bucket (same as user-profile) since it's already configured and public
    const uploadResult = await SupabaseStorageService.uploadFileFromServer(
      Buffer.from(await file.arrayBuffer()),
      fileName,
      file.type,
      {
        bucket: StorageBuckets.DESIGNS,
        folder: folder,
        upsert: false
      }
    );

    console.log('Featured customer photo uploaded:', uploadResult);

    return NextResponse.json(
      ResponseBuilder.success({ url: uploadResult.url }, 'Image uploaded successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading featured customer photo:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

