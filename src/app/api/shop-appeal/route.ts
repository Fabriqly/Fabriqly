import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// POST /api/shop-appeal - Submit an appeal for suspended shop
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appealReason, additionalInfo } = await request.json();

    if (!appealReason || !appealReason.trim()) {
      return NextResponse.json(
        { error: 'Appeal reason is required' },
        { status: 400 }
      );
    }

    // Get shop profile for current user
    const shopProfiles = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (shopProfiles.length === 0) {
      return NextResponse.json(
        { error: 'Shop profile not found' },
        { status: 404 }
      );
    }

    const shop = shopProfiles[0];

    // Check if shop is actually suspended
    if (shop.approvalStatus !== 'suspended') {
      return NextResponse.json(
        { error: 'Your shop is not suspended' },
        { status: 400 }
      );
    }

    // Check if there's already a pending appeal
    const existingAppeals = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_APPEALS,
      [
        { field: 'shopId', operator: '==' as const, value: shop.id },
        { field: 'status', operator: '==' as const, value: 'pending' }
      ]
    );

    if (existingAppeals.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending appeal' },
        { status: 409 }
      );
    }

    // Create appeal record
    const appealData = {
      shopId: shop.id,
      userId: session.user.id,
      shopName: shop.shopName,
      appealReason: appealReason.trim(),
      additionalInfo: additionalInfo?.trim() || '',
      status: 'pending',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdAppeal = await FirebaseAdminService.createDocument(
      Collections.SHOP_APPEALS,
      appealData
    );

    // Log activity
    const activityRepository = new ActivityRepository();
    await activityRepository.create({
      type: 'shop_appeal_submitted',
      actorId: session.user.id,
      targetId: shop.id,
      targetType: 'shop_profile',
      title: 'Shop Appeal Submitted',
      description: `Shop ${shop.shopName} has submitted an appeal`,
      priority: 'high',
      status: 'active',
      metadata: {
        shopName: shop.shopName,
        appealReason: appealReason.trim(),
        appealId: createdAppeal.id
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true,
      appeal: createdAppeal
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting shop appeal:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/shop-appeal - Get appeal status for current shop
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
      return NextResponse.json(
        { error: 'Shop profile not found' },
        { status: 404 }
      );
    }

    const shop = shopProfiles[0];

    // Get appeals for this shop
    const appeals = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_APPEALS,
      [{ field: 'shopId', operator: '==' as const, value: shop.id }],
      { field: 'createdAt', direction: 'desc' }
    );

    return NextResponse.json({
      appeals: appeals.map(appeal => ({
        id: appeal.id,
        appealReason: appeal.appealReason,
        additionalInfo: appeal.additionalInfo,
        status: appeal.status,
        submittedAt: appeal.submittedAt,
        reviewedBy: appeal.reviewedBy,
        reviewedAt: appeal.reviewedAt,
        reviewNotes: appeal.reviewNotes,
        createdAt: appeal.createdAt,
        updatedAt: appeal.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching shop appeals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
