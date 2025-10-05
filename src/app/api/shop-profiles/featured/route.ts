import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/shop-profiles/featured - Get featured shops
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const shops = await shopProfileService.getFeaturedShops(limit);
    
    return NextResponse.json({
      success: true,
      data: shops,
      total: shops.length
    });
  } catch (error: any) {
    console.error('Error fetching featured shops:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch featured shops'
      },
      { status: error.statusCode || 500 }
    );
  }
}


