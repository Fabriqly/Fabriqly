import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

/**
 * POST /api/upload/user-profile - Upload user profile picture
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
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

    // File size limit - 5MB for profile pictures
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
    const fileName = `${session.user.id}_${timestamp}_${sanitizedOriginalName}`;

    // Upload to Supabase Storage
    const uploadResult = await SupabaseStorageService.uploadFileFromServer(
      Buffer.from(await file.arrayBuffer()),
      fileName,
      file.type,
      {
        bucket: StorageBuckets.DESIGNS, // Using designs bucket for user profile images
        folder: `user-profiles/${session.user.id}`,
        upsert: false
      }
    );

    console.log('User profile image uploaded:', uploadResult);

    return NextResponse.json(
      ResponseBuilder.success({ url: uploadResult.url }, 'Image uploaded successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading user profile image:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}


