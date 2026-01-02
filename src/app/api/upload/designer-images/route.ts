import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SupabaseStorageService, StorageBuckets } from '@/lib/supabase-storage';

// POST /api/upload/designer-images - Upload designer profile logo/banner to Supabase
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = (formData.get('type') as string) || 'profile'; // 'profile' | 'banner'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!['profile', 'banner'].includes(imageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image type. Must be profile or banner' },
        { status: 400 }
      );
    }

    // Validate file type - only images
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size - 5MB limit
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    const userId =
      (session.user as any).id ||
      (session.user as any).uid ||
      (session.user as any).sub ||
      (session.user as any).email;

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${userId}_${imageType}_${timestamp}.${fileExt}`;

    // Store under designer-profiles/{userId}/{imageType}
    const folder = `designer-profiles/${userId}/${imageType}`;

    // Upload using server-side storage (bypasses RLS) to DESIGNS bucket
    const uploadResult = await SupabaseStorageService.uploadFileFromServer(
      Buffer.from(await file.arrayBuffer()),
      fileName,
      file.type,
      {
        bucket: StorageBuckets.DESIGNS,
        folder,
        upsert: false
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          url: uploadResult.url,
          path: uploadResult.path,
          type: imageType
        },
        message: 'Image uploaded successfully'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading designer image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image'
      },
      { status: 500 }
    );
  }
}



