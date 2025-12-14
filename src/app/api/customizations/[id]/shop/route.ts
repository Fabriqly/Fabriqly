import { NextRequest, NextResponse } from 'next/server';
import { CustomizationService } from '@/services/CustomizationService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const customizationService = new CustomizationService();

/**
 * POST /api/customizations/[id]/shop - Select printing shop
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const updatedRequest = await customizationService.selectPrintingShop(
      id,
      session.user.id,
      shopId
    );

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: 'Printing shop selected successfully'
    });
  } catch (error: any) {
    console.error('Error selecting printing shop:', error);
    
    const status = error.message === 'Request not found' ? 404 :
                   error.message.includes('Unauthorized') ? 403 :
                   error.message.includes('must be approved') || error.message.includes('not available') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to select printing shop' 
      },
      { status }
    );
  }
}

/**
 * GET /api/customizations/[id]/shop/available - Get available printing shops
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get customization request to check designer's shop
    const customizationRequest = await customizationService.getRequestById(id);
    
    if (!customizationRequest) {
      return NextResponse.json(
        { error: 'Customization request not found' },
        { status: 404 }
      );
    }

    if (customizationRequest.customerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all active shops
    const { FirebaseAdminService } = await import('@/services/firebase-admin');
    const { Collections } = await import('@/services/firebase');
    
    const shops = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_PROFILES,
      [
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'approved' }
      ]
    );

    // Check if designer has an affiliated shop
    let designerShop = null;
    if (customizationRequest.designerId) {
      const designerShops = shops.filter(shop => 
        shop.ownerId === customizationRequest.designerId
      );
      if (designerShops.length > 0) {
        designerShop = designerShops[0];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        designerShop,
        otherShops: shops.filter(shop => shop.id !== designerShop?.id),
        allShops: shops
      }
    });
  } catch (error: any) {
    console.error('Error fetching available shops:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch available shops' 
      },
      { status: 500 }
    );
  }
}

