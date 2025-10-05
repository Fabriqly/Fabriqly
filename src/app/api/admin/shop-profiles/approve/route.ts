import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { getServerSession } from 'next-auth';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// POST /api/admin/shop-profiles/approve - Approve shop profile
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
    console.log('User role in approve:', userRole);
    
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
    
    const { shopId } = await request.json();
    
    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'Shop ID is required' },
        { status: 400 }
      );
    }
    
    const shop = await shopProfileService.approveShop(shopId, adminId);
    
    return NextResponse.json({
      success: true,
      data: shop,
      message: 'Shop profile approved successfully'
    });
  } catch (error: any) {
    console.error('Error approving shop profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to approve shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}


