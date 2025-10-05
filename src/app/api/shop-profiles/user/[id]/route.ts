import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/shop-profiles/user/[id] - Get shop by user ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const shop = await shopProfileService.getShopProfileByUserId(userId);
    
    if (!shop) {
      return NextResponse.json(
        { success: true, data: null },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: shop
    });
  } catch (error: any) {
    console.error('Error fetching shop profile by user ID:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}
