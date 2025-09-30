import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { DesignerProfile, UpdateDesignerProfileData } from '@/types/enhanced-products';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/designer-profiles/[id] - Get designer profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const profileId = params.id;

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const profile = await FirebaseAdminService.getDocument(
      Collections.DESIGNER_PROFILES,
      profileId
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 404 }
      );
    }

    // Get user information
    const user = await FirebaseAdminService.getDocument(
      Collections.USERS,
      profile.userId
    );

    // Get designer's designs count
    const designs = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNS,
      [{ field: 'designerId', operator: '==' as const, value: profileId }]
    );

    const profileWithDetails = {
      ...profile,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      } : null,
      designsCount: designs.length
    };

    return NextResponse.json({ profile: profileWithDetails });
  } catch (error) {
    console.error('Error fetching designer profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/designer-profiles/[id] - Update designer profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profileId = params.id;
    const body: UpdateDesignerProfileData = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get the existing profile
    const existingProfile = await FirebaseAdminService.getDocument(
      Collections.DESIGNER_PROFILES,
      profileId
    );

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 404 }
      );
    }

    // Check if user owns the profile or is admin
    if (existingProfile.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only update your own profile' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove id from update data if it exists
    delete (updateData as any).id;

    const updatedProfile = await FirebaseAdminService.updateDocument(
      Collections.DESIGNER_PROFILES,
      profileId,
      updateData
    );

    return NextResponse.json({ profile: updatedProfile });
  } catch (error: any) {
    console.error('Error updating designer profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/designer-profiles/[id] - Delete designer profile
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profileId = params.id;

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Get the existing profile
    const existingProfile = await FirebaseAdminService.getDocument(
      Collections.DESIGNER_PROFILES,
      profileId
    );

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 404 }
      );
    }

    // Check if user owns the profile or is admin
    if (existingProfile.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own profile' },
        { status: 403 }
      );
    }

    // Check if designer has designs
    const designs = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNS,
      [{ field: 'designerId', operator: '==' as const, value: profileId }]
    );

    if (designs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete profile with existing designs. Please delete designs first.' },
        { status: 400 }
      );
    }

    // Delete the profile
    await FirebaseAdminService.deleteDocument(
      Collections.DESIGNER_PROFILES,
      profileId
    );

    return NextResponse.json({ message: 'Designer profile deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting designer profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
