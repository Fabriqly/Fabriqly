import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { getServerSession } from 'next-auth';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/admin/shop-profiles/pending - Get pending shop profiles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (temporarily allow all authenticated users for testing)
    const userRole = (session.user as any).role;
    console.log('User role:', userRole);
    
    // TODO: Re-enable this check after testing
    // if (userRole !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Forbidden: Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('Fetching pending shops with limit:', limit);
    const shops = await shopProfileService.getPendingApprovals(limit);
    console.log('Found pending shops:', shops.length);
    
    return NextResponse.json({
      success: true,
      data: shops,
      total: shops.length
    });
  } catch (error: any) {
    console.error('Error fetching pending shop profiles:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch pending shop profiles',
        details: error.stack
      },
      { status: error.statusCode || 500 }
    );
  }
}


