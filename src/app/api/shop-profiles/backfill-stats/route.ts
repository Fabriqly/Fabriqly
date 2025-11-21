import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/services/OrderService';
import { OrderRepository } from '@/repositories/OrderRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { ProductRepository } from '@/repositories/ProductRepository';
import { CacheService } from '@/services/CacheService';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';

// POST /api/shop-profiles/backfill-stats - Backfill shop stats for current user's shop
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only business owners can run this for their own shop
    if (session.user.role !== 'business_owner') {
      return NextResponse.json(
        { error: 'Forbidden - Business owners only' },
        { status: 403 }
      );
    }

    // Initialize services
    const orderRepository = new OrderRepository();
    const activityRepository = new ActivityRepository();
    const productRepository = new ProductRepository();
    const cacheService = new CacheService();
    const orderService = new OrderService(orderRepository, activityRepository, productRepository, cacheService);
    
    const shopProfileRepo = new ShopProfileRepository();
    const shopProfileService = new ShopProfileService(shopProfileRepo, activityRepository);

    // Get current user's shop profile
    const shopProfile = await shopProfileService.getShopProfileByUserId(session.user.id);
    
    if (!shopProfile) {
      return NextResponse.json(
        { error: 'Shop profile not found' },
        { status: 404 }
      );
    }

    // Query orders directly from repository (bypass service layer filtering)
    const allOrders = await orderRepository.findAll({ limit: 1000 });

    // Filter for delivered orders with matching businessOwnerId
    const deliveredOrders = allOrders.filter(order => {
      return order.status === 'delivered' && order.businessOwnerId === session.user.id;
    });

    // Count delivered orders
    const deliveredCount = deliveredOrders.length;
    const currentTotalOrders = shopProfile.shopStats?.totalOrders || 0;

    // Always update if deliveredCount > 0
    if (deliveredCount > 0) {
      // Update directly using repository to ensure it persists
      await shopProfileRepo.updateShopStats(shopProfile.id, {
        totalOrders: deliveredCount
      });

      // Clear all caches
      CacheService.invalidate(`shop_profile_${shopProfile.id}`);
      CacheService.invalidate(`shop_stats_${shopProfile.id}`);
      CacheService.invalidate(CacheService.userKey(`shop_profile_${session.user.id}`));

      // Verify the update by fetching directly from DB (bypass cache)
      const verifyShop = await shopProfileRepo.findById(shopProfile.id);
      const verifiedTotalOrders = verifyShop?.shopStats?.totalOrders || 0;

      return NextResponse.json({
        success: true,
        message: `Stats updated: ${currentTotalOrders} → ${deliveredCount} orders`,
        data: {
          previousTotalOrders: currentTotalOrders,
          newTotalOrders: deliveredCount,
          deliveredOrdersCount: deliveredCount
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No delivered orders found to update stats',
        data: {
          currentTotalOrders: currentTotalOrders,
          deliveredOrdersCount: deliveredCount,
          shopId: shopProfile.id
        }
      });
    }
  } catch (error: any) {
    console.error('Error backfilling shop stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to backfill shop stats' 
      },
      { status: 500 }
    );
  }
}

