import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { DesignerProfile, UpdateDesignerProfileData } from '@/types/enhanced-products';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/designer-profiles/[id] - Get designer profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: profileId } = await params;

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

    const { id: profileId } = await params;
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

    // Process featured customers - add IDs and timestamps for new ones
    let processedFeaturedCustomers;
    if (body.featuredCustomers !== undefined) {
      processedFeaturedCustomers = body.featuredCustomers.map(customer => {
        // If customer already has an id (from existing data), preserve it
        // Otherwise, generate a new id
        const customerId = (customer as any).id || `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = (customer as any).createdAt || new Date();
        
        return {
          id: customerId,
          name: customer.name,
          photoUrl: customer.photoUrl,
          link: customer.link,
          createdAt: createdAt
        };
      });
    }

    // Prepare update data
    const updateData: any = {
      ...body,
      updatedAt: new Date()
    };

    // Include processed featured customers if provided
    if (processedFeaturedCustomers !== undefined) {
      updateData.featuredCustomers = processedFeaturedCustomers.length > 0 ? processedFeaturedCustomers : undefined;
    }

    // Remove id from update data if it exists
    delete updateData.id;

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

    const { id: profileId } = await params;

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
