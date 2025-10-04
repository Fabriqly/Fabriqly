import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { getServerSession } from 'next-auth';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// POST /api/admin/shop-profiles/reject - Reject shop profile
export async function POST(request: NextRequest) {
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
    console.log('User role in reject:', userRole);
    
    // TODO: Re-enable this check after testing
    // if (userRole !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Forbidden: Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const adminId = (session.user as any).id || 
                    (session.user as any).uid || 
                    (session.user as any).sub ||
                    (session.user as any).email;
    
    const { shopId, reason } = await request.json();
    
    if (!shopId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Shop ID and reason are required' },
        { status: 400 }
      );
    }
    
    const shop = await shopProfileService.rejectShop(shopId, adminId, reason);
    
    return NextResponse.json({
      success: true,
      data: shop,
      message: 'Shop profile rejected successfully'
    });
  } catch (error: any) {
    console.error('Error rejecting shop profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to reject shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}


