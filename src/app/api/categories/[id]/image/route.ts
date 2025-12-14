import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/categories/[id]/image - Upload category image
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Allow temporary uploads for new categories
    const isTemporaryUpload = categoryId.startsWith('temp-');

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const uploadResult = await SupabaseStorageService.uploadFileFromServer(
      Buffer.from(await file.arrayBuffer()),
      fileName,
      file.type,
      {
        bucket: StorageBuckets.CATEGORIES,
        folder: categoryId,
        upsert: false
      }
    );

    console.log('Category image uploaded:', uploadResult);

    return NextResponse.json(
      ResponseBuilder.success({
        imageUrl: uploadResult.url,
        storagePath: uploadResult.path,
        storageBucket: StorageBuckets.CATEGORIES,
        fileName: fileName,
        size: uploadResult.size,
        contentType: uploadResult.contentType
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading category image:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

// DELETE /api/categories/[id]/image - Delete category image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get('storagePath');
    
    if (!storagePath) {
      return NextResponse.json(
        { error: 'Storage path is required' },
        { status: 400 }
      );
    }

    // Delete from Supabase Storage
    await SupabaseStorageService.deleteFile(StorageBuckets.CATEGORIES, storagePath);

    console.log('Category image deleted:', storagePath);

    return NextResponse.json(
      ResponseBuilder.success({ message: 'Image deleted successfully' })
    );
  } catch (error) {
    console.error('Error deleting category image:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}
