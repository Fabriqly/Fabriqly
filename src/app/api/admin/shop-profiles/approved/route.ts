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

export async function GET(req: NextRequest) {
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

    const shops = await shopProfileService.getShopProfiles({ approvalStatus: 'approved' });

    return NextResponse.json({
      success: true,
      data: shops,
    });
  } catch (error: any) {
    console.error('Error fetching approved shops:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch approved shops' },
      { status: error.statusCode || 500 }
    );
  }
}

