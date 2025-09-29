import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  DesignerProfile, 
  CreateDesignerProfileData, 
  UpdateDesignerProfileData 
} from '@/types/enhanced-products';

// GET /api/designer-profiles - List designer profiles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isVerified = searchParams.get('isVerified');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query constraints
    const constraints = [];
    
    if (userId) {
      constraints.push({ field: 'userId', operator: '==' as const, value: userId });
    }
    
    if (isVerified !== null) {
      constraints.push({ field: 'isVerified', operator: '==' as const, value: isVerified === 'true' });
    }
    
    if (isActive !== null) {
      constraints.push({ field: 'isActive', operator: '==' as const, value: isActive === 'true' });
    }

    const profiles = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      constraints,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error fetching designer profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/designer-profiles - Create designer profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateDesignerProfileData = await request.json();
    
    // Validate required fields
    if (!body.businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Check if user already has a designer profile
    const existingProfile = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (existingProfile.length > 0) {
      return NextResponse.json(
        { error: 'User already has a designer profile' },
        { status: 400 }
      );
    }

    const profileData: Omit<DesignerProfile, 'id'> = {
      businessName: body.businessName,
      userId: session.user.id,
      bio: body.bio,
      website: body.website,
      socialMedia: body.socialMedia,
      specialties: body.specialties || [],
      isVerified: false,
      isActive: true,
      portfolioStats: {
        totalDesigns: 0,
        totalDownloads: 0,
        totalViews: 0,
        averageRating: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const profile = await FirebaseAdminService.createDocument(
      Collections.DESIGNER_PROFILES,
      profileData
    );

    // Update user role to designer if not already
    const user = await FirebaseAdminService.getDocument(Collections.USERS, session.user.id);
    if (user && user.role !== 'designer') {
      await FirebaseAdminService.updateDocument(
        Collections.USERS,
        session.user.id,
        { role: 'designer', updatedAt: new Date() }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating designer profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
