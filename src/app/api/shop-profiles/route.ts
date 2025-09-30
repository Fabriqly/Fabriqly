import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  ShopProfile, 
  CreateShopProfileData, 
  UpdateShopProfileData 
} from '@/types/enhanced-products';

// GET /api/shop-profiles - List shop profiles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isVerified = searchParams.get('isVerified');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query constraints
    const constraints = [];
    
    if (userId) {
      constraints.push({ field: 'userId', operator: '==' as const, value: userId });
    }
    
    if (isVerified !== null) {
      constraints.push({ field: 'isVerified', operator: '==' as const, value: isVerified === 'true' });
    }
    
    if (isActive !== null) {
      constraints.push({ field: 'isActive', operator: '==' as const, value: isActive === 'true' });
    }

    const profiles = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_PROFILES,
      constraints,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error fetching shop profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/shop-profiles - Create shop profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateShopProfileData = await request.json();
    
    // Validate required fields
    if (!body.businessName || !body.contactInfo?.email) {
      return NextResponse.json(
        { error: 'Business name and contact email are required' },
        { status: 400 }
      );
    }

    // Check if user already has a shop profile
    const existingProfile = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (existingProfile.length > 0) {
      return NextResponse.json(
        { error: 'User already has a shop profile' },
        { status: 400 }
      );
    }

    const profileData = {
      businessName: body.businessName,
      userId: session.user.id,
      description: body.description,
      website: body.website,
      address: body.address,
      contactInfo: body.contactInfo,
      businessHours: body.businessHours,
      socialMedia: body.socialMedia,
      isVerified: false,
      isActive: true,
      shopStats: {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageRating: 0
      }
    };

    const profile = await FirebaseAdminService.createDocument(
      Collections.SHOP_PROFILES,
      profileData
    );

    // Update user role to business_owner if not already
    const user = await FirebaseAdminService.getDocument(Collections.USERS, session.user.id);
    if (user && user.role !== 'business_owner') {
      await FirebaseAdminService.updateDocument(
        Collections.USERS,
        session.user.id,
        { role: 'business_owner', updatedAt: new Date() }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating shop profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
