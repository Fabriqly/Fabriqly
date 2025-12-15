import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Order } from '@/types/firebase';

/**
 * GET /api/designers/[id]/purchased-designs
 * Get all designs purchased by the current user from a specific designer
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

    const { id: designerIdParam } = await params;
    const userId = session.user.id;

    // Find designer profile - could be profile ID or userId
    let designerProfile;
    let designerUserId: string;
    
    // First try to get by profile ID (document ID)
    try {
      const profileDoc = await FirebaseAdminService.getDocument(
        Collections.DESIGNER_PROFILES,
        designerIdParam
      );
      if (profileDoc) {
        designerProfile = profileDoc as any;
        designerUserId = designerProfile.userId;
      }
    } catch (error) {
      // Profile not found by ID, will try by userId below
      console.log('Designer profile not found by ID, trying userId...');
    }
    
    // If not found by ID, try finding by userId
    if (!designerProfile) {
      const profilesByUserId = await FirebaseAdminService.queryDocuments(
        Collections.DESIGNER_PROFILES,
        [{ field: 'userId', operator: '==', value: designerIdParam }]
      );
      if (profilesByUserId.length > 0) {
        designerProfile = profilesByUserId[0] as any;
        designerUserId = designerProfile.userId;
      }
    }

    if (!designerProfile || !designerUserId) {
      return NextResponse.json(
        { error: 'Designer not found' },
        { status: 404 }
      );
    }

    // Get all paid orders from this customer for this designer
    const orders = await FirebaseAdminService.queryDocuments<Order>(
      Collections.ORDERS,
      [
        { field: 'customerId', operator: '==', value: userId },
        { field: 'paymentStatus', operator: '==', value: 'paid' },
        { field: 'businessOwnerId', operator: '==', value: designerUserId }
      ]
    );

    // Extract unique design IDs from order items
    const designIds = new Set<string>();
    const designMap = new Map<string, { designId: string; designName: string; orderId: string; orderDate: any }>();

    for (const order of orders) {
      if (order.status === 'cancelled') continue;

      for (const item of order.items) {
        const orderItem = item as any;
        if (orderItem.itemType === 'design' && orderItem.designId) {
          const designId = orderItem.designId;
          if (!designIds.has(designId)) {
            designIds.add(designId);
            designMap.set(designId, {
              designId,
              designName: orderItem.designName || `Design ${designId.slice(-8)}`,
              orderId: order.id,
              orderDate: order.createdAt
            });
          }
        }
      }
    }

    // Fetch design details for each design ID
    const designs = await Promise.all(
      Array.from(designIds).map(async (designId) => {
        try {
          const design = await FirebaseAdminService.getDocument(Collections.DESIGNS, designId);
          const orderInfo = designMap.get(designId);
          
          if (design && orderInfo) {
            return {
              id: design.id,
              designName: design.designName || orderInfo.designName,
              thumbnailUrl: design.thumbnailUrl,
              designType: design.designType,
              orderId: orderInfo.orderId,
              orderDate: orderInfo.orderDate
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching design ${designId}:`, error);
          // Return basic info from order if design fetch fails
          const orderInfo = designMap.get(designId);
          return orderInfo ? {
            id: designId,
            designName: orderInfo.designName,
            thumbnailUrl: null,
            designType: null,
            orderId: orderInfo.orderId,
            orderDate: orderInfo.orderDate
          } : null;
        }
      })
    );

    // Filter out null values
    const validDesigns = designs.filter(d => d !== null);

    return NextResponse.json({
      success: true,
      data: validDesigns
    });
  } catch (error: any) {
    console.error('Error fetching purchased designs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch purchased designs' 
      },
      { status: 500 }
    );
  }
}

