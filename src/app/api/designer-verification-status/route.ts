import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

// GET /api/designer-verification-status - Get current user's verification status
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
      return NextResponse.json({
        hasProfile: false,
        verificationStatus: null
      });
    }

    const profile = designerProfiles[0];

    // Get verification request for this designer
    const verificationRequests = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_VERIFICATION_REQUESTS,
      [{ field: 'designerId', operator: '==' as const, value: profile.id }]
    );

    const verificationRequest = verificationRequests.length > 0 ? verificationRequests[0] : null;

    // Determine verification status
    let verificationStatus = 'not_requested';
    let canResubmit = false;
    let canAppeal = false;
    let rejectionReason = null;
    let suspensionReason = null;

    if (profile.isVerified && profile.isActive) {
      verificationStatus = 'approved';
    } else if (verificationRequest) {
      switch (verificationRequest.status) {
        case 'pending':
          verificationStatus = 'pending';
          break;
        case 'approved':
          verificationStatus = 'approved';
          break;
        case 'rejected':
          verificationStatus = 'rejected';
          canResubmit = true;
          rejectionReason = verificationRequest.reviewReason;
          break;
        case 'suspended':
          verificationStatus = 'suspended';
          canAppeal = true;
          suspensionReason = verificationRequest.reviewReason;
          break;
        case 'restored':
          verificationStatus = 'approved';
          break;
      }
    } else if (!profile.isActive && !profile.isVerified) {
      verificationStatus = 'rejected';
      canResubmit = true;
    }

    return NextResponse.json({
      hasProfile: true,
      profile: {
        id: profile.id,
        businessName: profile.businessName,
        isVerified: profile.isVerified,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      },
      verificationRequest: verificationRequest ? {
        id: verificationRequest.id,
        status: verificationRequest.status,
        submittedAt: verificationRequest.submittedAt,
        reviewedBy: verificationRequest.reviewedBy,
        reviewedAt: verificationRequest.reviewedAt,
        reviewReason: verificationRequest.reviewReason,
        reviewNotes: verificationRequest.reviewNotes
      } : null,
      verificationStatus,
      canResubmit,
      canAppeal,
      rejectionReason,
      suspensionReason
    });

  } catch (error) {
    console.error('Error fetching designer verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
