import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

// GET /api/shop-verification-status - Get current user's shop verification status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get shop profile for current user
    const shopProfiles = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (shopProfiles.length === 0) {
      return NextResponse.json({
        hasShop: false,
        verificationStatus: null
      });
    }

    const shop = shopProfiles[0];

    // Determine verification status
    let verificationStatus = 'not_created';
    let canResubmit = false;
    let canAppeal = false;
    let rejectionReason = null;
    let suspensionReason = null;

    switch (shop.approvalStatus) {
      case 'pending':
        verificationStatus = 'pending';
        break;
      case 'approved':
        verificationStatus = 'approved';
        break;
      case 'rejected':
        verificationStatus = 'rejected';
        canResubmit = true;
        rejectionReason = shop.rejectionReason;
        break;
      case 'suspended':
        verificationStatus = 'suspended';
        canAppeal = true;
        suspensionReason = shop.rejectionReason; // Using rejectionReason for suspension reason
        break;
    }

    return NextResponse.json({
      hasShop: true,
      shop: {
        id: shop.id,
        shopName: shop.shopName,
        username: shop.username,
        approvalStatus: shop.approvalStatus,
        isVerified: shop.isVerified,
        isActive: shop.isActive,
        rejectionReason: shop.rejectionReason,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt
      },
      verificationStatus,
      canResubmit,
      canAppeal,
      rejectionReason,
      suspensionReason
    });

  } catch (error) {
    console.error('Error fetching shop verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
