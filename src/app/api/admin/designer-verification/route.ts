import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { DesignerProfileService } from '@/services/DesignerProfileService';
import { DesignerProfileRepository } from '@/repositories/DesignerProfileRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { DesignerVerificationRequest } from '@/types/enhanced-products';

// GET /api/admin/designer-verification - Get verification requests and status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query constraints for verification status
    const constraints = [];
    
    if (status === 'pending') {
      constraints.push({ field: 'isVerified', operator: '==' as const, value: false });
      constraints.push({ field: 'isActive', operator: '==' as const, value: true });
    } else if (status === 'approved') {
      constraints.push({ field: 'isVerified', operator: '==' as const, value: true });
      constraints.push({ field: 'isActive', operator: '==' as const, value: true });
    } else if (status === 'rejected') {
      constraints.push({ field: 'isVerified', operator: '==' as const, value: false });
      constraints.push({ field: 'isActive', operator: '==' as const, value: false });
    } else {
      // Get all profiles
      constraints.push({ field: 'isActive', operator: '==' as const, value: true });
    }

    // Get designer profiles based on verification status
    const profiles = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      constraints,
      { field: 'createdAt', direction: 'desc' },
      limit + offset
    );

    // Get verification requests if they exist
    const verificationRequests = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_VERIFICATION_REQUESTS,
      [],
      { field: 'createdAt', direction: 'desc' }
    );

    // Combine data
    const response = profiles.slice(offset, offset + limit).map(profile => {
      const request = verificationRequests.find(req => req.designerId === profile.id);
      return {
        id: profile.id,
        businessName: profile.businessName,
        bio: profile.bio,
        website: profile.website,
        socialMedia: profile.socialMedia,
        specialties: profile.specialties,
        portfolioStats: profile.portfolioStats,
        isVerified: profile.isVerified,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        verificationRequest: request || null
      };
    });

    return NextResponse.json({ 
      profiles: response,
      total: profiles.length,
      hasMore: profiles.length > offset + limit
    });
  } catch (error) {
    console.error('Error fetching designer verification data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/designer-verification - Approve or reject designer verification
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { action, designerId, reason, notes } = await request.json();

    if (!action || !designerId) {
      return NextResponse.json(
        { error: 'Missing required parameters: action and designerId' },
        { status: 400 }
      );
    }

    // Initialize services
    const designerProfileRepository = new DesignerProfileRepository();
    const activityRepository = new ActivityRepository();
    const designerProfileService = new DesignerProfileService(
      designerProfileRepository,
      activityRepository
    );

    let updatedProfile;
    let verificationStatus;

    switch (action) {
      case 'approve':
        updatedProfile = await designerProfileService.verifyDesigner(designerId);
        verificationStatus = 'approved';
        
        // Log activity
        await activityRepository.create({
          type: 'designer_verification_approved',
          actorId: session.user.id,
          targetId: designerId,
          targetType: 'designer_profile',
          title: 'Designer Verification Approved',
          description: `Designer ${updatedProfile.businessName} has been verified`,
          priority: 'medium',
          status: 'completed',
          metadata: {
            businessName: updatedProfile.businessName,
            approvedBy: session.user.name,
            notes: notes || ''
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break;

      case 'reject':
        updatedProfile = await designerProfileService.unverifyDesigner(designerId);
        verificationStatus = 'rejected';
        
        // Log activity
        await activityRepository.create({
          type: 'designer_verification_rejected',
          actorId: session.user.id,
          targetId: designerId,
          targetType: 'designer_profile',
          title: 'Designer Verification Rejected',
          description: `Designer verification rejected for ${updatedProfile.businessName}`,
          priority: 'medium',
          status: 'completed',
          metadata: {
            businessName: updatedProfile.businessName,
            rejectedBy: session.user.name,
            reason: reason || '',
            notes: notes || ''
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break;

      case 'suspend':
        updatedProfile = await designerProfileService.deactivateDesigner(designerId);
        verificationStatus = 'suspended';
        
        // Log活动
        await activityRepository.create({
          type: 'designer_suspended',
          actorId: session.user.id,
          targetId: designerId,
          targetType: 'designer_profile',
          title: 'Designer Account Suspended',
          description: `Designer ${updatedProfile.businessName} has been suspended`,
          priority: 'high',
          status: 'completed',
          metadata: {
            businessName: updatedProfile.businessName,
            suspendedBy: session.user.name,
            reason: reason || '',
            notes: notes || ''
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break;

      case 'restore':
        updatedProfile = await designerProfileService.activateDesigner(designerId);
        verificationStatus = 'restored';
        
        // Log activity
        await activityRepository.create({
          type: 'designer_restored',
          actorId: session.user.id,
          targetId: designerId,
          targetType: 'designer_profile',
          title: 'Designer Account Restored',
          description: `Designer ${updatedProfile.businessName} has been restored`,
          priority: 'medium',
          status: 'completed',
          metadata: {
            businessName: updatedProfile.businessName,
            restoredBy: session.user.name,
            notes: notes || ''
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: approve, reject, suspend, or restore' },
          { status: 400 }
        );
    }

    // Update verification request record if it exists
    try {
      const existingRequest = await FirebaseAdminService.queryDocuments(
        Collections.DESIGNER_VERIFICATION_REQUESTS,
        [{ field: 'designerId', operator: '==' as const, value: designerId }]
      );

      if (existingRequest.length > 0) {
        await FirebaseAdminService.updateDocument(
          Collections.DESIGNER_VERIFICATION_REQUESTS,
          existingRequest[0].id,
          {
            status: verificationStatus,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            reviewReason: reason,
            reviewNotes: notes,
            updatedAt: new Date()
          }
        );
      }
    } catch (error) {
      console.warn('Could not update verification request record:', error);
    }

    return NextResponse.json({ 
      success: true,
      designer: updatedProfile,
      status: verificationStatus
    });
  } catch (error: any) {
    console.error('Error updating designer verification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/designer-verification - Request designer verification (for designers)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { portfolioUrl, portfolioDescription, specializations, yearsExperience, certifications } = await request.json();

    // Check if user has a designer profile
    const designerProfile = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (designerProfile.length === 0) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 404 }
      );
    }

    const profile = designerProfile[0];

    // Check if verification request already exists
    const existingRequest = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_VERIFICATION_REQUESTS,
      [{ field: 'designerId', operator: '==' as const, value: profile.id }]
    );

    if (existingRequest.length > 0) {
      return NextResponse.json(
        { error: 'Verification request already exists' },
        { status: 409 }
      );
    }

    // Create verification request
    const verificationRequest: Omit<DesignerVerificationRequest, 'id'> = {
      designerId: profile.id,
      userId: session.user.id,
      status: 'pending',
      portfolioUrl,
      portfolioDescription,
      specializations: specializations || [],
      yearsExperience: yearsExperience || 0,
      certifications: certifications || [],
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdRequest = await FirebaseAdminService.createDocument(
      Collections.DESIGNER_VERIFICATION_REQUESTS,
      verificationRequest
    );

    // Log activity
    const activityRepository = new ActivityRepository();
    await activityRepository.create({
      type: 'designer_verification_requested',
      actorId: session.user.id,
      targetId: profile.id,
      targetType: 'designer_profile',
      title: 'Designer Verification Requested',
      description: `Verification requested for ${profile.businessName}`,
      priority: 'medium',
      status: 'pending',
      metadata: {
        businessName: profile.businessName,
        portfolioUrl,
        specializations
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true,
      request: createdRequest
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating verification request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
