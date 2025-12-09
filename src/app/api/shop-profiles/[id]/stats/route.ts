import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/shop-profiles/[id]/stats - Get shop statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stats = await shopProfileService.getShopStats(id);
    
    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Shop profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching shop stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch shop stats'
      },
      { status: error.statusCode || 500 }
    );
  }
}


