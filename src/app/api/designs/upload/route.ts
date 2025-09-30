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

    // Upload to Supabase Storage using server-side method
    const uploadResult = await SupabaseStorageService.uploadFileFromServer(
      Buffer.from(await file.arrayBuffer()),
      fileName,
      file.type,
      {
        bucket: StorageBuckets.DESIGNS,
        folder: `designs/${timestamp}`,
        upsert: false
      }
    );

    console.log(`${type} file uploaded:`, uploadResult);

    return NextResponse.json(
      ResponseBuilder.success({
        url: uploadResult.url,
        path: uploadResult.path,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
        fileName: fileName
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
