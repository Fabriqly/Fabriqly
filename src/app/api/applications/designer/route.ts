import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { DesignerApplication, CreateDesignerApplicationData } from '@/types/applications';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/applications/designer - Get designer applications (admin or own application)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Build query constraints
    const constraints: any[] = [];
    
    // If not admin, can only view own applications
    if (session.user.role !== 'admin') {
      constraints.push({ field: 'userId', operator: '==', value: session.user.id });
    } else if (userId) {
      constraints.push({ field: 'userId', operator: '==', value: userId });
    }
    
    if (status) {
      constraints.push({ field: 'status', operator: '==', value: status });
    }

    const applications = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_APPLICATIONS,
      constraints,
      { field: 'appliedAt', direction: 'desc' }
    );

    return NextResponse.json({ success: true, data: applications });
  } catch (error) {
    console.error('Error fetching designer applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/applications/designer - Submit designer application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a customer
    if (session.user.role !== 'customer' && session.user.role !== 'pending_designer') {
      return NextResponse.json(
        { error: 'Only customers can apply to become designers' },
        { status: 403 }
      );
    }

    const body: CreateDesignerApplicationData = await request.json();
    
    // Validate required fields
    if (!body.businessName || !body.bio) {
      return NextResponse.json(
        { error: 'Business name and bio are required' },
        { status: 400 }
      );
    }

    if (body.bio.length < 20) {
      return NextResponse.json(
        { error: 'Bio must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Check if user already has a pending or approved application
    const existingApplications = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_APPLICATIONS,
      [
        { field: 'userId', operator: '==', value: session.user.id },
        { field: 'status', operator: 'in', value: ['pending', 'approved'] }
      ]
    );

    if (existingApplications.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending or approved designer application' },
        { status: 400 }
      );
    }

    // Create application
    const applicationData: Omit<DesignerApplication, 'id'> = {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      businessName: body.businessName,
      bio: body.bio,
      portfolioUrl: body.portfolioUrl,
      sampleDesigns: body.sampleDesigns || [],
      specialties: body.specialties || [],
      contactInfo: body.contactInfo || {},
      socialMedia: body.socialMedia,
      status: 'pending',
      appliedAt: Timestamp.now()
    };

    const application = await FirebaseAdminService.createDocument(
      Collections.DESIGNER_APPLICATIONS,
      applicationData
    );

    // Update user role to pending_designer
    await FirebaseAdminService.updateDocument(
      Collections.USERS,
      session.user.id,
      { role: 'pending_designer', updatedAt: Timestamp.now() }
    );

    // Log activity
    try {
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'designer_application_submitted',
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        metadata: {
          applicationId: application.id,
          businessName: body.businessName
        },
        timestamp: Timestamp.now()
      });
    } catch (activityError) {
      console.error('Error logging activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json(
      { 
        success: true, 
        data: application,
        message: 'Designer application submitted successfully. Please wait for admin review.' 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating designer application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

