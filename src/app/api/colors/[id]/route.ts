import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Color, 
  UpdateColorData 
} from '@/types/enhanced-products';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/colors/[id] - Get single color
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const colorId = params.id;

    if (!colorId) {
      return NextResponse.json(
        { error: 'Color ID is required' },
        { status: 400 }
      );
    }

    const color = await FirebaseAdminService.getDocument(
      Collections.COLORS,
      colorId
    );

    if (!color) {
      return NextResponse.json(
        { error: 'Color not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ color });
  } catch (error: any) {
    console.error('Error fetching color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/colors/[id] - Update color (admin and business_owner)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'business_owner'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or business owner access required' },
        { status: 401 }
      );
    }

    const colorId = params.id;
    const body: UpdateColorData = await request.json();

    if (!colorId) {
      return NextResponse.json(
        { error: 'Color ID is required' },
        { status: 400 }
      );
    }

    // Check if color exists
    const existingColor = await FirebaseAdminService.getDocument(
      Collections.COLORS,
      colorId
    );

    if (!existingColor) {
      return NextResponse.json(
        { error: 'Color not found' },
        { status: 404 }
      );
    }

    // Check ownership for business owners
    if (session.user.role === 'business_owner' && existingColor.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own colors' },
        { status: 403 }
      );
    }

    // Check if color name already exists (if being updated)
    if (body.colorName && body.colorName !== existingColor.colorName) {
      const duplicateColor = await FirebaseAdminService.queryDocuments(
        Collections.COLORS,
        [{ field: 'colorName', operator: '==' as const, value: body.colorName }]
      );

      if (duplicateColor.length > 0) {
        return NextResponse.json(
          { error: 'Color with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Check if hex code already exists (if being updated)
    if (body.hexCode && body.hexCode !== existingColor.hexCode) {
      const duplicateHex = await FirebaseAdminService.queryDocuments(
        Collections.COLORS,
        [{ field: 'hexCode', operator: '==' as const, value: body.hexCode }]
      );

      if (duplicateHex.length > 0) {
        return NextResponse.json(
          { error: 'Color with this hex code already exists' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    const updatedColor = await FirebaseAdminService.updateDocument(
      Collections.COLORS,
      colorId,
      updateData
    );

    return NextResponse.json({ color: updatedColor });
  } catch (error: any) {
    console.error('Error updating color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/colors/[id] - Delete color (admin and business_owner)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'business_owner'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or business owner access required' },
        { status: 401 }
      );
    }

    const colorId = params.id;

    if (!colorId) {
      return NextResponse.json(
        { error: 'Color ID is required' },
        { status: 400 }
      );
    }

    // Check if color exists
    const existingColor = await FirebaseAdminService.getDocument(
      Collections.COLORS,
      colorId
    );

    if (!existingColor) {
      return NextResponse.json(
        { error: 'Color not found' },
        { status: 404 }
      );
    }

    // Check ownership for business owners
    if (session.user.role === 'business_owner' && existingColor.businessOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own colors' },
        { status: 403 }
      );
    }

    // Check if color is being used in any products
    const productColors = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_COLORS,
      [{ field: 'colorId', operator: '==' as const, value: colorId }]
    );

    if (productColors.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete color that is being used in products. Please remove it from all products first.' },
        { status: 400 }
      );
    }

    await FirebaseAdminService.deleteDocument(
      Collections.COLORS,
      colorId
    );

    return NextResponse.json({ message: 'Color deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
