import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { getServerSession } from 'next-auth';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/admin/shop-profiles/stats - Get approval statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (temporarily disabled for testing)
    const userRole = (session.user as any).role;
    console.log('User role in stats:', userRole);
    
    // TODO: Re-enable this check after testing
    // if (userRole !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Forbidden: Admin access required' },
    //     { status: 403 }
    //   );
    // }
    
    const stats = await shopProfileService.getApprovalStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching shop profile stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch shop profile stats'
      },
      { status: error.statusCode || 500 }
    );
  }
}


