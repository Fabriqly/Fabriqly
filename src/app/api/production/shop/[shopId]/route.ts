import { NextRequest, NextResponse } from 'next/server';
import { ProductionService } from '@/services/ProductionService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const productionService = new ProductionService();

/**
 * GET /api/production/shop/[shopId] - Get production requests for a shop
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { shopId } = await params;

    // Verify user owns the shop
    const { FirebaseAdminService } = await import('@/services/firebase-admin');
    const { Collections } = await import('@/services/firebase');
    const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, shopId);
    
    if (!shop || shop.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this shop' },
        { status: 403 }
      );
    }

    const requests = await productionService.getShopProductionRequests(shopId);
    const stats = await productionService.getProductionStats(shopId);

    return NextResponse.json({
      success: true,
      data: {
        requests,
        stats
      }
    });
  } catch (error: any) {
    console.error('Error fetching shop production requests:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch production requests' 
      },
      { status: 500 }
    );
  }
}

