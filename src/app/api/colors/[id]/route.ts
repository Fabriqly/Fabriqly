import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Color, 
  UpdateColorData 
} from '@/types/enhanced-products';

// Helper function to convert Firestore Timestamps to JavaScript Dates
const convertTimestamps = (data: any): any => {
  if (data && typeof data === 'object') {
    const converted = { ...data };
    
    // Convert Firestore Timestamps to JavaScript Dates
    Object.keys(converted).forEach(key => {
      const value = converted[key];
      
      // Check for Firebase Admin SDK Timestamp (server-side)
      if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
        // This is a Firebase Admin SDK Timestamp object
        converted[key] = value.toDate();
      }
      // Check for client-side Firestore Timestamp format
      else if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
        // This is a client-side Firestore Timestamp object
        converted[key] = new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
      }
      // Check for Date objects (already converted)
      else if (value instanceof Date) {
        // Already a Date object, keep as is
        converted[key] = value;
      }
      // Recursively convert nested objects
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[key] = convertTimestamps(value);
      }
    });
    
    return converted;
  }
  return data;
};

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/colors/[id] - Get single color
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: colorId } = await params;

    if (!colorId) {
      return NextResponse.json(
        { error: 'Color ID is required' },
        { status: 400 }
      );
    }

    const rawColor = await FirebaseAdminService.getDocument(
      Collections.COLORS,
      colorId
    );

    if (!rawColor) {
      return NextResponse.json(
        { error: 'Color not found' },
        { status: 404 }
      );
    }

    // Convert Firestore Timestamps to JavaScript Dates
    const color = convertTimestamps(rawColor) as Color;

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

    const { id: colorId } = await params;
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

    // Log activity
    try {
      console.log('Logging color update activity...');
      const changedFields = Object.keys(updateData).filter(key => key !== 'updatedAt');
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'color_updated',
        title: 'Color Updated',
        description: `Color "${existingColor.colorName}" has been updated`,
        priority: 'low',
        status: 'active',
        actorId: session.user.id,
        targetId: colorId,
        targetType: 'color',
        targetName: existingColor.colorName,
        metadata: {
          colorName: existingColor.colorName,
          changedFields: changedFields,
          updatedBy: session.user.role,
          updatedAt: new Date().toISOString(),
          previousValues: Object.fromEntries(
            changedFields
              .map(field => [field, existingColor[field as keyof typeof existingColor]])
              .filter(([_, value]) => value !== undefined)
          ),
          newValues: Object.fromEntries(
            changedFields
              .map(field => [field, updateData[field as keyof typeof updateData]])
              .filter(([_, value]) => value !== undefined)
          )
        }
      });
      console.log('✅ Color update activity logged successfully');
    } catch (activityError) {
      console.error('❌ Error logging color update activity:', activityError);
      // Don't fail the update if activity logging fails
    }

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

    const { id: colorId } = await params;

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

    // Log activity
    try {
      console.log('Logging color deletion activity...');
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'color_deleted',
        title: 'Color Deleted',
        description: `Color "${existingColor.colorName}" has been deleted`,
        priority: 'medium',
        status: 'active',
        actorId: session.user.id,
        targetId: colorId,
        targetType: 'color',
        targetName: existingColor.colorName,
        metadata: {
          colorName: existingColor.colorName,
          hexCode: existingColor.hexCode,
          rgbCode: existingColor.rgbCode,
          deletedBy: session.user.role,
          deletedAt: new Date().toISOString()
        }
      });
      console.log('✅ Color deletion activity logged successfully');
    } catch (activityError) {
      console.error('❌ Error logging color deletion activity:', activityError);
      // Don't fail the deletion if activity logging fails
    }

    return NextResponse.json({ message: 'Color deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
