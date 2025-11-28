import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileService } from '@/services/ShopProfileService';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { UpdateShopProfileData } from '@/types/shop-profile';
import { getServerSession } from 'next-auth';

// Initialize services
const shopProfileRepository = new ShopProfileRepository();
const activityRepository = new ActivityRepository();
const shopProfileService = new ShopProfileService(shopProfileRepository, activityRepository);

// GET /api/shop-profiles/[id] - Get single shop profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shop = await shopProfileService.getShopProfile(id);
    
    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop profile not found' },
        { status: 404 }
      );
    }
    
    // Increment view count (in background, don't wait)
    shopProfileService.incrementViewCount(id).catch(console.error);
    
    return NextResponse.json({
      success: true,
      data: shop
    });
  } catch (error: any) {
    console.error('Error fetching shop profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// PATCH /api/shop-profiles/[id] - Update shop profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id || 
                   (session.user as any).uid || 
                   (session.user as any).sub ||
                   (session.user as any).email;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unable to identify user' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const data: UpdateShopProfileData = await request.json();
    
    const shop = await shopProfileService.updateShopProfile(id, data, userId);
    
    return NextResponse.json({
      success: true,
      data: shop,
      message: 'Shop profile updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating shop profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE /api/shop-profiles/[id] - Delete shop profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id || 
                   (session.user as any).uid || 
                   (session.user as any).sub ||
                   (session.user as any).email;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unable to identify user' },
        { status: 400 }
      );
    }
    
    const { id } = await params;
    await shopProfileService.deleteShopProfile(id, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Shop profile deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting shop profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete shop profile'
      },
      { status: error.statusCode || 500 }
    );
  }
}


