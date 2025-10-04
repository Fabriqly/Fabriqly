import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/shop-profiles/search - Search shops
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('q') || searchParams.get('query') || '';
    
    if (!searchTerm) {
      return NextResponse.json(
        { success: false, error: 'Search term is required' },
        { status: 400 }
      );
    }
    
    const shops = await shopProfileService.searchShops(searchTerm);
    
    return NextResponse.json({
      success: true,
      data: shops,
      total: shops.length,
      query: searchTerm
    });
  } catch (error: any) {
    console.error('Error searching shop profiles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search shop profiles'
      },
      { status: error.statusCode || 500 }
    );
  }
}


