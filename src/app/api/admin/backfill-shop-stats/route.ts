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

// POST /api/admin/backfill-shop-stats - Backfill shop stats for existing delivered orders
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins can run this
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
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

    // Get all delivered orders
    const deliveredOrders = await orderService.getOrdersByStatus('delivered');

    console.log(`[Backfill] Found ${deliveredOrders.length} delivered orders`);

    const stats: Record<string, number> = {}; // shopId -> count
    const errors: string[] = [];

    // Count delivered orders per shop
    for (const order of deliveredOrders) {
      if (!order.businessOwnerId) {
        continue;
      }

      try {
        // Find shop profile by businessOwnerId
        const shopProfile = await shopProfileService.getShopProfileByUserId(order.businessOwnerId);
        
        if (!shopProfile) {
          errors.push(`Shop profile not found for businessOwnerId: ${order.businessOwnerId} (Order: ${order.id})`);
          continue;
        }

        // Count orders per shop
        if (!stats[shopProfile.id]) {
          stats[shopProfile.id] = 0;
        }
        stats[shopProfile.id]++;
      } catch (error: any) {
        errors.push(`Error processing order ${order.id}: ${error.message}`);
      }
    }

    // Update shop stats
    const updatedShops: string[] = [];
    for (const [shopId, deliveredCount] of Object.entries(stats)) {
      try {
        const shopProfile = await shopProfileService.getShopProfile(shopId);
        if (shopProfile) {
          const currentTotalOrders = shopProfile.shopStats?.totalOrders || 0;
          // Only update if the delivered count is greater than current (to avoid overwriting with lower values)
          // For backfill, we'll set it to the delivered count if current is 0, otherwise keep current
          const newTotalOrders = currentTotalOrders === 0 ? deliveredCount : Math.max(currentTotalOrders, deliveredCount);
          
          await shopProfileService.updateShopStats(shopId, {
            totalOrders: newTotalOrders
          });
          updatedShops.push(shopId);
          console.log(`[Backfill] Updated shop ${shopId}: ${deliveredCount} delivered orders, totalOrders set to ${newTotalOrders}`);
        }
      } catch (error: any) {
        errors.push(`Error updating shop ${shopId}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfilled stats for ${updatedShops.length} shops`,
      data: {
        totalDeliveredOrders: deliveredOrders.length,
        shopsUpdated: updatedShops.length,
        shopStats: stats,
        errors: errors.length > 0 ? errors : undefined
      }
    });
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

