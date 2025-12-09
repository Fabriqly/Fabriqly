import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { Timestamp } from 'firebase/firestore';

// PUT /api/designs/[id]/feature - Toggle featured status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { isFeatured } = await request.json();

    if (typeof isFeatured !== 'boolean') {
      return NextResponse.json(
        { error: 'isFeatured must be a boolean value' },
        { status: 400 }
      );
    }

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get design to verify it exists
    const design = await designService.getDesign(id);
    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Update featured status
    await designRepository.update(id, {
      isFeatured,
      updatedAt: Timestamp.now()
    });

    // Log activity
    await activityRepository.create({
      type: 'design_updated',
      title: isFeatured ? 'Design Featured' : 'Design Unfeatured',
      description: `Design "${design.designName}" was ${isFeatured ? 'featured' : 'unfeatured'}`,
      priority: 'medium',
      status: 'active',
      actorId: session.user.id,
      targetId: id,
      targetType: 'design',
      targetName: design.designName,
      metadata: {
        action: isFeatured ? 'featured' : 'unfeatured',
        designName: design.designName,
        designerId: design.designerId,
        previousStatus: design.isFeatured,
        newStatus: isFeatured
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({
      success: true,
      message: `Design ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      isFeatured
    });
  } catch (error: any) {
    console.error('Error toggling featured status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
