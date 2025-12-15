import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { CreateShopProfileData, ShopProfileFilters } from '@/types/shop-profile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/shop-profiles - Get all shops or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build filters from query params
    const filters: ShopProfileFilters = {};
    
    if (searchParams.get('userId')) filters.userId = searchParams.get('userId')!;
    if (searchParams.get('username')) filters.username = searchParams.get('username')!;
    if (searchParams.get('businessType')) filters.businessType = searchParams.get('businessType') as any;
    if (searchParams.get('approvalStatus')) filters.approvalStatus = searchParams.get('approvalStatus') as any;
    if (searchParams.get('isVerified')) filters.isVerified = searchParams.get('isVerified') === 'true';
    if (searchParams.get('isActive')) filters.isActive = searchParams.get('isActive') === 'true';
    if (searchParams.get('isFeatured')) filters.isFeatured = searchParams.get('isFeatured') === 'true';
    if (searchParams.get('search')) filters.search = searchParams.get('search')!;
    if (searchParams.get('city')) {
      filters.location = { city: searchParams.get('city')! };
    }
    if (searchParams.get('province')) {
      filters.location = { ...filters.location, province: searchParams.get('province')! };
    }
    if (searchParams.get('minRating')) filters.minRating = parseFloat(searchParams.get('minRating')!);
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy') as any;
    if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder') as any;
    if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit')!);
    
    const shops = await shopProfileService.getShopProfiles(filters);
    
    return NextResponse.json({
      success: true,
      data: shops,
      total: shops.length
    });
  } catch (error: any) {
    console.error('Error fetching shop profiles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch shop profiles'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// POST /api/shop-profiles - Create new shop profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has business_owner or admin role
    const userRole = (session.user as any).role;
    if (!['business_owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Only business owners and admins can create shop profiles' },
        { status: 403 }
      );
    }

    // Try different possible user ID fields
    const userId = (session.user as any).id || 
                   (session.user as any).uid || 
                   (session.user as any).sub ||
                   (session.user as any).email; // Fallback to email as unique identifier
    
    if (!userId) {
      console.error('[POST /api/shop-profiles] No user ID found in session:', session.user);
      return NextResponse.json(
        { success: false, error: 'Unable to identify user. Please log out and log in again.' },
        { status: 400 }
      );
    }

    console.log(`[POST /api/shop-profiles] Creating shop profile for user ${userId} (role: ${userRole})`);

    const data: CreateShopProfileData = await request.json();
    
    // Validate required fields
    if (!data.shopName || !data.username || !data.businessOwnerName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: shopName, username, and businessOwnerName are required' },
        { status: 400 }
      );
    }

    if (!data.contactInfo?.email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    if (!data.supportedProductCategories || data.supportedProductCategories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one product category must be selected' },
        { status: 400 }
      );
    }
    
    const shop = await shopProfileService.createShopProfile(data, userId);
    
    console.log(`[POST /api/shop-profiles] Shop profile created successfully: ${shop.id}`);
    
    return NextResponse.json({
      success: true,
      data: shop,
      message: 'Shop profile created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/shop-profiles] Error creating shop profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}
