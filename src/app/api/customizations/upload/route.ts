import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { Timestamp } from 'firebase/firestore';

/**
 * POST /api/customizations/upload - Upload customization files
 * Supports: customer design files, designer final files, preview images
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
    const type = formData.get('type') as string; // 'customer_design', 'designer_final', 'preview'
    
    if (!file) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'File is required', statusCode: 400 }),
        { status: 400 }
      );
    }

    if (!type || !['customer_design', 'designer_final', 'preview'].includes(type)) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Type must be customer_design, designer_final, or preview', statusCode: 400 }),
        { status: 400 }
      );
    }

    // Validate file type
    if (type === 'preview') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          ResponseBuilder.error({ message: 'Preview files must be images', statusCode: 400 }),
          { status: 400 }
        );
      }
    }

    // File size limits
    const maxSize = type === 'preview' ? 5 * 1024 * 1024 : 20 * 1024 * 1024; // 5MB for preview, 20MB for design files
    if (file.size > maxSize) {
      return NextResponse.json(
        ResponseBuilder.error({ 
          message: `File size must be less than ${type === 'preview' ? '5MB' : '20MB'}`,
          statusCode: 400 
        }),
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedOriginalName}`;

    // Upload to Supabase Storage
    const uploadResult = await SupabaseStorageService.uploadFileFromServer(
      Buffer.from(await file.arrayBuffer()),
      fileName,
      file.type,
      {
        bucket: StorageBuckets.DESIGNS, // We can use designs bucket for customizations
        folder: `customizations/${session.user.id}/${type}`,
        upsert: false
      }
    );

    console.log(`Customization ${type} file uploaded:`, uploadResult);

    // Return structured file data matching CustomizationFile interface
    const fileData = {
      url: uploadResult.url,
      path: uploadResult.path,
      fileName: fileName,
      fileSize: uploadResult.size,
      contentType: uploadResult.contentType,
      uploadedAt: Timestamp.now()
    };

    return NextResponse.json(
      ResponseBuilder.success(fileData, 'File uploaded successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading customization file:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

