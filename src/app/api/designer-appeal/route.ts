import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// POST /api/designer-appeal - Submit an appeal for suspended designer
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

    // Get designer profile for current user
    const designerProfiles = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (designerProfiles.length === 0) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 404 }
      );
    }

    const profile = designerProfiles[0];

    // Check if designer is actually suspended
    if (profile.isActive) {
      return NextResponse.json(
        { error: 'Your account is not suspended' },
        { status: 400 }
      );
    }

    // Check if there's already a pending appeal
    const existingAppeals = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_APPEALS,
      [
        { field: 'designerId', operator: '==' as const, value: profile.id },
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
      designerId: profile.id,
      userId: session.user.id,
      businessName: profile.businessName,
      appealReason: appealReason.trim(),
      additionalInfo: additionalInfo?.trim() || '',
      status: 'pending',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdAppeal = await FirebaseAdminService.createDocument(
      Collections.DESIGNER_APPEALS,
      appealData
    );

    // Log activity
    const activityRepository = new ActivityRepository();
    await activityRepository.create({
      type: 'designer_appeal_submitted',
      actorId: session.user.id,
      targetId: profile.id,
      targetType: 'designer_profile',
      title: 'Designer Appeal Submitted',
      description: `Designer ${profile.businessName} has submitted an appeal`,
      priority: 'high',
      status: 'active',
      metadata: {
        businessName: profile.businessName,
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
    console.error('Error submitting designer appeal:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/designer-appeal - Get appeal status for current designer
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get designer profile for current user
    const designerProfiles = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (designerProfiles.length === 0) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 404 }
      );
    }

    const profile = designerProfiles[0];

    // Get appeals for this designer
    const appeals = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_APPEALS,
      [{ field: 'designerId', operator: '==' as const, value: profile.id }],
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
    console.error('Error fetching designer appeals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
