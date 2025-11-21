import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/applications/designer/[id] - Get specific designer application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const application = await FirebaseAdminService.getDocument(
      Collections.DESIGNER_APPLICATIONS,
      id
    );

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this application
    if (session.user.role !== 'admin' && application.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Error fetching designer application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/designer/[id] - Approve or reject application (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionReason, adminNotes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting an application' },
        { status: 400 }
      );
    }

    // Get the application
    const application = await FirebaseAdminService.getDocument(
      Collections.DESIGNER_APPLICATIONS,
      id
    );

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Update application status
      await FirebaseAdminService.updateDocument(
        Collections.DESIGNER_APPLICATIONS,
        id,
        {
          status: 'approved',
          reviewedAt: Timestamp.now(),
          reviewedBy: session.user.id,
          adminNotes: adminNotes || null
        }
      );

      // Update user role to designer
      await FirebaseAdminService.updateDocument(
        Collections.USERS,
        application.userId,
        {
          role: 'designer',
          updatedAt: Timestamp.now()
        }
      );

      // Create designer profile automatically from application data
      try {
        const designerProfileData = {
          userId: application.userId,
          businessName: application.businessName,
          bio: application.bio,
          profileImageUrl: null,
          portfolioUrl: application.portfolioUrl,
          specialties: application.specialties || [],
          socialMedia: application.socialMedia ? {
            instagram: application.socialMedia.instagram,
            facebook: application.socialMedia.facebook,
            twitter: application.socialMedia.twitter,
            linkedin: application.socialMedia.linkedin
          } : undefined,
          isVerified: false,
          designerStats: {
            totalDesigns: 0,
            totalDownloads: 0,
            totalViews: 0,
            averageRating: 0
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await FirebaseAdminService.createDocument(
          Collections.DESIGNER_PROFILES,
          designerProfileData
        );

        console.log('Designer profile created successfully for user:', application.userId);
      } catch (profileError) {
        console.error('Error creating designer profile:', profileError);
        // Don't fail the approval if profile creation fails, but log it
      }

      // Log activity
      try {
        await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
          type: 'designer_application_approved',
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          metadata: {
            applicationId: id,
            applicantId: application.userId,
            businessName: application.businessName
          },
          timestamp: Timestamp.now()
        });
      } catch (activityError) {
        console.error('Error logging activity:', activityError);
      }

      return NextResponse.json({
        success: true,
        message: 'Designer application approved successfully and designer profile created'
      });
    } else {
      // Reject application
      await FirebaseAdminService.updateDocument(
        Collections.DESIGNER_APPLICATIONS,
        id,
        {
          status: 'rejected',
          reviewedAt: Timestamp.now(),
          reviewedBy: session.user.id,
          rejectionReason,
          adminNotes: adminNotes || null
        }
      );

      // Revert user role to customer
      await FirebaseAdminService.updateDocument(
        Collections.USERS,
        application.userId,
        {
          role: 'customer',
          updatedAt: Timestamp.now()
        }
      );

      // Log activity
      try {
        await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
          type: 'designer_application_rejected',
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          metadata: {
            applicationId: id,
            applicantId: application.userId,
            rejectionReason
          },
          timestamp: Timestamp.now()
        });
      } catch (activityError) {
        console.error('Error logging activity:', activityError);
      }

      return NextResponse.json({
        success: true,
        message: 'Designer application rejected'
      });
    }
  } catch (error: any) {
    console.error('Error updating designer application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
