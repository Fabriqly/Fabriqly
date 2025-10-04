import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/shop-profiles/username/[username] - Get shop by username
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const shop = await shopProfileService.getShopProfileByUsername(params.username);
    
    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop profile not found' },
        { status: 404 }
      );
    }
    
    // Increment view count (in background, don't wait)
    shopProfileService.incrementViewCount(shop.id).catch(console.error);
    
    return NextResponse.json({
      success: true,
      data: shop
    });
  } catch (error: any) {
    console.error('Error fetching shop profile by username:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}


