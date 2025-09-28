import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { CreateColorData } from '@/types/enhanced-products';
import { Timestamp } from 'firebase/firestore';

// POST /api/colors/bulk - Bulk create colors
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'business_owner'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or business owner access required' },
        { status: 401 }
      );
    }

    const body: { colors: CreateColorData[] } = await request.json();
    
    if (!body.colors || !Array.isArray(body.colors) || body.colors.length === 0) {
      return NextResponse.json(
        { error: 'Colors array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (body.colors.length > 50) {
      return NextResponse.json(
        { error: 'Cannot create more than 50 colors at once' },
        { status: 400 }
      );
    }

    const results = {
      created: [] as any[],
      errors: [] as Array<{ index: number; color: CreateColorData; error: string }>,
      total: body.colors.length
    };

    for (let i = 0; i < body.colors.length; i++) {
      const colorData = body.colors[i];
      
      try {
        // Validate required fields
        if (!colorData.colorName || !colorData.hexCode || !colorData.rgbCode) {
          results.errors.push({
            index: i,
            color: colorData,
            error: 'Missing required fields: colorName, hexCode, rgbCode'
          });
          continue;
        }

        // Check if color name already exists
        const existingColor = await FirebaseAdminService.queryDocuments(
          Collections.COLORS,
          [{ field: 'colorName', operator: '==' as const, value: colorData.colorName }]
        );

        if (existingColor.length > 0) {
          results.errors.push({
            index: i,
            color: colorData,
            error: 'Color with this name already exists'
          });
          continue;
        }

        // Check if hex code already exists
        const existingHex = await FirebaseAdminService.queryDocuments(
          Collections.COLORS,
          [{ field: 'hexCode', operator: '==' as const, value: colorData.hexCode }]
        );

        if (existingHex.length > 0) {
          results.errors.push({
            index: i,
            color: colorData,
            error: 'Color with this hex code already exists'
          });
          continue;
        }

        const newColorData = {
          colorName: colorData.colorName,
          hexCode: colorData.hexCode,
          rgbCode: colorData.rgbCode,
          isActive: true,
          createdAt: Timestamp.now(),
          ...(session.user.role === 'business_owner' && { businessOwnerId: session.user.id })
        };

        const color = await FirebaseAdminService.createDocument(
          Collections.COLORS,
          newColorData
        );

        results.created.push(color);
      } catch (error: any) {
        results.errors.push({
          index: i,
          color: colorData,
          error: error.message || 'Failed to create color'
        });
      }
    }

    // Log activity for bulk color creation
    try {
      if (results.created.length > 0) {
        console.log('Logging bulk color creation activity...');
        await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
          type: 'color_created',
          title: 'Bulk Color Creation',
          description: `${results.created.length} colors have been created in bulk`,
          priority: 'low',
          status: 'active',
          actorId: session.user.id,
          targetId: 'bulk-operation',
          targetType: 'color',
          targetName: `${results.created.length} colors`,
          metadata: {
            operationType: 'bulk_create',
            totalColors: results.created.length,
            successfulColors: results.created.length,
            failedColors: results.errors.length,
            createdBy: session.user.role,
            colorNames: results.created.map((c: any) => c.colorName),
            createdAt: new Date().toISOString()
          }
        });
        console.log('✅ Bulk color creation activity logged successfully');
      }
    } catch (activityError: any) {
      console.error('❌ Error logging bulk color creation activity:', activityError);
      // Don't fail the bulk operation if activity logging fails
    }

    return NextResponse.json({
      message: `Bulk operation completed: ${results.created.length} created, ${results.errors.length} errors`,
      results
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in bulk color creation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/colors/bulk - Bulk delete colors
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'business_owner'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or business owner access required' },
        { status: 401 }
      );
    }

    const body: { colorIds: string[] } = await request.json();
    
    if (!body.colorIds || !Array.isArray(body.colorIds) || body.colorIds.length === 0) {
      return NextResponse.json(
        { error: 'Color IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (body.colorIds.length > 50) {
      return NextResponse.json(
        { error: 'Cannot delete more than 50 colors at once' },
        { status: 400 }
      );
    }

    const results = {
      deleted: [] as Array<{ colorId: string; colorName: string }>,
      errors: [] as Array<{ colorId: string; error: string }>,
      total: body.colorIds.length
    };

    for (let i = 0; i < body.colorIds.length; i++) {
      const colorId = body.colorIds[i];
      
      try {
        // Check if color exists
        const existingColor = await FirebaseAdminService.getDocument(
          Collections.COLORS,
          colorId
        );

        if (!existingColor) {
          results.errors.push({
            colorId,
            error: 'Color not found'
          });
          continue;
        }

        // Check ownership for business owners
        if (session.user.role === 'business_owner' && existingColor.businessOwnerId !== session.user.id) {
          results.errors.push({
            colorId,
            error: 'Forbidden - You can only delete your own colors'
          });
          continue;
        }

        // Check if color is being used in any products
        const productColors = await FirebaseAdminService.queryDocuments(
          Collections.PRODUCT_COLORS,
          [{ field: 'colorId', operator: '==' as const, value: colorId }]
        );

        if (productColors.length > 0) {
          results.errors.push({
            colorId,
            error: 'Cannot delete color that is being used in products'
          });
          continue;
        }

        await FirebaseAdminService.deleteDocument(Collections.COLORS, colorId);
        results.deleted.push({ colorId, colorName: existingColor.colorName });
      } catch (error: any) {
        results.errors.push({
          colorId,
          error: error.message || 'Failed to delete color'
        });
      }
    }

    return NextResponse.json({
      message: `Bulk operation completed: ${results.deleted.length} deleted, ${results.errors.length} errors`,
      results
    });
  } catch (error: any) {
    console.error('Error in bulk color deletion:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
