import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ShopApplication, CreateShopApplicationData } from '@/types/applications';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/applications/shop - Get shop applications (admin or own application)
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
      Collections.SHOP_APPLICATIONS,
      constraints,
      { field: 'appliedAt', direction: 'desc' }
    );

    return NextResponse.json({ success: true, data: applications });
  } catch (error) {
    console.error('Error fetching shop applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/applications/shop - Submit shop application
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
    if (session.user.role !== 'customer' && session.user.role !== 'pending_shop') {
      return NextResponse.json(
        { error: 'Only customers can apply to become shop owners' },
        { status: 403 }
      );
    }

    const body: CreateShopApplicationData = await request.json();
    
    // Validate required fields
    if (!body.shopName || !body.description || !body.address || !body.contactInfo) {
      return NextResponse.json(
        { error: 'Shop name, description, address, and contact info are required' },
        { status: 400 }
      );
    }

    if (body.description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Validate address
    if (!body.address.street || !body.address.city || !body.address.country) {
      return NextResponse.json(
        { error: 'Complete address is required (street, city, country)' },
        { status: 400 }
      );
    }

    // Validate contact info
    if (!body.contactInfo.phone || !body.contactInfo.email) {
      return NextResponse.json(
        { error: 'Phone and email are required' },
        { status: 400 }
      );
    }

    // Check if user already has a pending or approved application
    const existingApplications = await FirebaseAdminService.queryDocuments(
      Collections.SHOP_APPLICATIONS,
      [
        { field: 'userId', operator: '==', value: session.user.id },
        { field: 'status', operator: 'in', value: ['pending', 'approved'] }
      ]
    );

    if (existingApplications.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending or approved shop application' },
        { status: 400 }
      );
    }

    // Create application
    const applicationData: Omit<ShopApplication, 'id'> = {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      shopName: body.shopName,
      description: body.description,
      address: body.address,
      contactInfo: body.contactInfo,
      businessDocuments: body.businessDocuments,
      businessRegistrationNumber: body.businessRegistrationNumber,
      taxId: body.taxId,
      operatingHours: body.operatingHours,
      specialties: body.specialties || [],
      // Section E: Shop Profile & Branding
      profileBanner: body.profileBanner,
      shopLogo: body.shopLogo,
      tagline: body.tagline,
      socialMedia: body.socialMedia,
      websiteUrl: body.websiteUrl,
      // Section F: Categories & Tags
      shopCategory: body.shopCategory,
      serviceTags: body.serviceTags,
      materialSpecialties: body.materialSpecialties,
      // Section G: Payment & Transaction Details
      paymentMethods: body.paymentMethods,
      paymentAccountInfo: body.paymentAccountInfo,
      // Section H: Shop Policies
      returnPolicy: body.returnPolicy,
      processingTime: body.processingTime,
      shippingOptions: body.shippingOptions,
      status: 'pending',
      appliedAt: Timestamp.now()
    };

    const application = await FirebaseAdminService.createDocument(
      Collections.SHOP_APPLICATIONS,
      applicationData
    );

    // Update user role to pending_shop
    await FirebaseAdminService.updateDocument(
      Collections.USERS,
      session.user.id,
      { role: 'pending_shop', updatedAt: Timestamp.now() }
    );

    // Log activity
    try {
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'shop_application_submitted',
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        metadata: {
          applicationId: application.id,
          shopName: body.shopName
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
        message: 'Shop application submitted successfully. Please wait for admin review.' 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating shop application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
