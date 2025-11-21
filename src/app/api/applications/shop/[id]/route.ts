import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/applications/shop/[id] - Get specific shop application
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
      Collections.SHOP_APPLICATIONS,
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
    console.error('Error fetching shop application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/shop/[id] - Approve or reject application (admin only)
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
      Collections.SHOP_APPLICATIONS,
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
      Collections.SHOP_APPLICATIONS,
      id,
        {
          status: 'approved',
          reviewedAt: Timestamp.now(),
          reviewedBy: session.user.id,
          adminNotes: adminNotes || null
        }
    );

      // Update user role to business_owner
    await FirebaseAdminService.updateDocument(
      Collections.USERS,
      application.userId,
        {
          role: 'business_owner',
          updatedAt: Timestamp.now()
        }
    );

      // Create shop profile automatically from application data
      try {
        // Generate unique username from shop name
        const username = application.shopName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        // Transform operating hours if they exist
        const operatingHours = application.operatingHours ? 
          Object.entries(application.operatingHours).reduce((acc, [day, hours]: [string, any]) => {
            acc[day] = {
              open: hours.open || '09:00',
              close: hours.close || '17:00',
              isOpen: !hours.closed
            };
            return acc;
          }, {} as any) : undefined;

        const shopProfileData = {
          shopName: application.shopName,
          username: username,
          businessOwnerName: application.userName,
          userId: application.userId,
          contactInfo: {
            email: application.contactInfo?.email || application.userEmail,
            phone: application.contactInfo?.phone
          },
          location: application.address ? {
            city: application.address.city,
            province: application.address.state,
            fullAddress: `${application.address.street}, ${application.address.city}, ${application.address.country}`,
            country: application.address.country
          } : undefined,
          branding: {
            logoUrl: application.shopLogo,
            bannerUrl: application.profileBanner,
            tagline: application.tagline
          },
          businessDetails: {
            businessType: 'printing_partner' as const,
            operatingHours: operatingHours,
            registeredBusinessId: application.businessRegistrationNumber,
            taxId: application.taxId
          },
          description: application.description,
          specialties: application.specialties || [],
          supportedProductCategories: [], // Can be added later
          customizationPolicy: application.processingTime ? {
            turnaroundTime: application.processingTime
          } : undefined,
          socialMedia: application.socialMedia ? {
            facebook: application.socialMedia.facebook,
            instagram: application.socialMedia.instagram,
            tiktok: application.socialMedia.tiktok,
            twitter: application.socialMedia.twitter
          } : undefined,
          website: application.websiteUrl,
          ratings: {
            averageRating: 0,
            totalReviews: 0,
            totalOrders: 0
          },
          shopStats: {
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalViews: 0
          },
          approvalStatus: 'approved' as const,
          isVerified: false,
          isActive: true,
          isFeatured: false,
          approvedBy: session.user.id,
          approvedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await FirebaseAdminService.createDocument(
          Collections.SHOP_PROFILES,
          shopProfileData
        );
        
        console.log('Shop profile created successfully for user:', application.userId);
      } catch (profileError) {
        console.error('Error creating shop profile:', profileError);
        // Don't fail the approval if profile creation fails, but log it
    }

    // Log activity
    try {
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
          type: 'shop_application_approved',
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        metadata: {
          applicationId: id,
          applicantId: application.userId,
            shopName: application.shopName
        },
        timestamp: Timestamp.now()
      });
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
    }

    return NextResponse.json({
      success: true,
        message: 'Shop application approved successfully and shop profile created'
      });
    } else {
      // Reject application
      await FirebaseAdminService.updateDocument(
        Collections.SHOP_APPLICATIONS,
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
          type: 'shop_application_rejected',
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
        message: 'Shop application rejected'
      });
    }
  } catch (error: any) {
    console.error('Error updating shop application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
