import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ShopProfileService } from '@/services';
import { ShopProfileRepository } from '@/repositories';
import { ActivityRepository } from '@/repositories/ActivityRepository';

const shopProfileService = new ShopProfileService(
  new ShopProfileRepository(),
  new ActivityRepository()
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Temporarily disable admin check for testing
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Forbidden - Admin access required' },
    //     { status: 403 }
    //   );
    // }

    // Extract adminId
    const adminId = 
      (session.user as any).id ||
      (session.user as any).uid ||
      (session.user as any).sub ||
      session.user.email ||
      'unknown';

    const body = await req.json();
    const { shopId, reason } = body;

    if (!shopId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Shop ID and reason are required' },
        { status: 400 }
      );
    }

    const shop = await shopProfileService.suspendShop(shopId, adminId, reason);

    return NextResponse.json({
      success: true,
      data: shop,
    });
  } catch (error: any) {
    console.error('Error suspending shop:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to suspend shop' },
      { status: error.statusCode || 500 }
    );
  }
}

