import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/supabase-storage';

// POST /api/upload/shop-images - Upload shop logo/banner to Supabase
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
      return NextResponse.json(
        { success: false, error: 'Storage service not configured' },
        { status: 500 }
      );
    }

    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id || 
                   (session.user as any).uid || 
                   (session.user as any).sub ||
                   (session.user as any).email;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('type') as string; // 'logo', 'banner', or 'thumbnail'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!imageType || !['logo', 'banner', 'thumbnail'].includes(imageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image type. Must be logo, banner, or thumbnail' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${imageType}_${timestamp}.${fileExt}`;
    const filePath = `shop-images/${userId}/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase using admin client (bypasses RLS)
    console.log('Uploading to Supabase:', { bucket: 'shop-profiles', path: filePath });
    const { data, error } = await supabaseAdmin.storage
      .from('shop-profiles')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      console.error('Upload details:', { bucket: 'shop-profiles', path: filePath, contentType: file.type, size: buffer.length });
      return NextResponse.json(
        { success: false, error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('shop-profiles')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrlData.publicUrl,
        path: filePath,
        fileName: fileName,
        type: imageType,
      },
      message: 'Image uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/upload/shop-images - Delete shop image from Supabase
export async function DELETE(request: NextRequest) {
  try {
    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
      return NextResponse.json(
        { success: false, error: 'Storage service not configured' },
        { status: 500 }
      );
    }

    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Delete from Supabase using admin client (bypasses RLS)
    console.log('Deleting from Supabase:', { bucket: 'shop-profiles', path: filePath });
    const { error } = await supabaseAdmin.storage
      .from('shop-profiles')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { success: false, error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Delete successful');

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete image'
      },
      { status: 500 }
    );
  }
}

