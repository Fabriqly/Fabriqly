import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Color, 
  CreateColorData, 
  UpdateColorData 
} from '@/types/enhanced-products';

// GET /api/colors - List colors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query constraints
    const constraints = [];
    
    if (isActive !== null) {
      constraints.push({ field: 'isActive', operator: '==' as const, value: isActive === 'true' });
    }

    const colors = await FirebaseAdminService.queryDocuments(
      Collections.COLORS,
      constraints,
      undefined, // No sorting to avoid index requirements
      limit
    );

    // Filter colors based on user role and ownership
    let filteredColors = colors;
    
    if (session?.user?.role === 'business_owner') {
      // Business owners can see global colors (no businessOwnerId) + their own colors
      filteredColors = colors.filter(color => 
        !color.businessOwnerId || color.businessOwnerId === session.user.id
      );
    } else if (session?.user?.role === 'admin') {
      // Admins can see all colors
      filteredColors = colors;
    } else {
      // Non-authenticated users can only see global colors
      filteredColors = colors.filter(color => !color.businessOwnerId);
    }

    return NextResponse.json({ colors: filteredColors });
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/colors - Create color (admin and business_owner)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'business_owner'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or business owner access required' },
        { status: 401 }
      );
    }

    const body: CreateColorData = await request.json();
    
    // Validate required fields
    if (!body.colorName || !body.hexCode || !body.rgbCode) {
      return NextResponse.json(
        { error: 'Missing required fields: colorName, hexCode, rgbCode' },
        { status: 400 }
      );
    }

    // Check if color name already exists
    const existingColor = await FirebaseAdminService.queryDocuments(
      Collections.COLORS,
      [{ field: 'colorName', operator: '==' as const, value: body.colorName }]
    );

    if (existingColor.length > 0) {
      return NextResponse.json(
        { error: 'Color with this name already exists' },
        { status: 400 }
      );
    }

    // Check if hex code already exists
    const existingHex = await FirebaseAdminService.queryDocuments(
      Collections.COLORS,
      [{ field: 'hexCode', operator: '==' as const, value: body.hexCode }]
    );

    if (existingHex.length > 0) {
      return NextResponse.json(
        { error: 'Color with this hex code already exists' },
        { status: 400 }
      );
    }

    const colorData: Omit<Color, 'id'> = {
      colorName: body.colorName,
      hexCode: body.hexCode,
      rgbCode: body.rgbCode,
      businessOwnerId: session.user.role === 'business_owner' ? session.user.id : undefined,
      isActive: true,
      createdAt: new Date()
    };

    const color = await FirebaseAdminService.createDocument(
      Collections.COLORS,
      colorData
    );

    return NextResponse.json({ color }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating color:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
