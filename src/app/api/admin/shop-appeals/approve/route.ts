import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// POST /api/admin/shop-appeals/approve - Approve a shop appeal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appealId, reviewNotes } = await request.json();

    if (!appealId) {
      return NextResponse.json(
        { error: 'Appeal ID is required' },
        { status: 400 }
      );
    }

    // Get the appeal
    const appeal = await FirebaseAdminService.getDocument(
      Collections.SHOP_APPEALS,
      appealId
    );

    if (!appeal) {
      return NextResponse.json(
        { error: 'Appeal not found' },
        { status: 404 }
      );
    }

    if (appeal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Appeal has already been reviewed' },
        { status: 400 }
      );
    }

    // Update appeal status
    await FirebaseAdminService.updateDocument(
      Collections.SHOP_APPEALS,
      appealId,
      {
        status: 'approved',
        reviewedBy: session.user.email || 'admin',
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || '',
        updatedAt: new Date()
      }
    );

    // Restore the shop (set to approved and active)
    await FirebaseAdminService.updateDocument(
      Collections.SHOP_PROFILES,
      appeal.shopId,
      {
        approvalStatus: 'approved',
        isActive: true,
        updatedAt: new Date()
      }
    );

    // Log activity
    const activityRepository = new ActivityRepository();
    await activityRepository.create({
      type: 'shop_appeal_approved',
      actorId: session.user.email || 'admin',
      targetId: appeal.shopId,
      targetType: 'shop_profile',
      title: 'Shop Appeal Approved',
      description: `Shop appeal for ${appeal.shopName} has been approved`,
      priority: 'high',
      status: 'active',
      metadata: {
        shopName: appeal.shopName,
        appealId: appealId,
        reviewNotes: reviewNotes || ''
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Appeal approved and shop restored'
    });

  } catch (error: any) {
    console.error('Error approving shop appeal:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
