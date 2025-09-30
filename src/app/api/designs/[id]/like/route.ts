import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { Timestamp } from 'firebase/firestore';

// POST /api/designs/[id]/like - Like a design
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get design
    const design = await designService.getDesign(id);

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Check if design is public and active
    if (!design.isPublic || !design.isActive) {
      return NextResponse.json(
        { error: 'Design is not available' },
        { status: 403 }
      );
    }

    // Increment likes count
    await designService.incrementLikesCount(id);

    // Log like activity
    await activityRepository.create({
      type: 'design_updated',
      title: 'Design Liked',
      description: `User liked design: ${design.designName}`,
      priority: 'low',
      status: 'active',
      actorId: session.user.id,
      targetId: id,
      targetType: 'design',
      targetName: design.designName,
      metadata: {
        action: 'liked',
        designName: design.designName,
        designerId: design.designerId
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({
      success: true,
      message: 'Design liked successfully'
    });
  } catch (error: any) {
    console.error('Error liking design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/designs/[id]/like - Unlike a design
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get design
    const design = await designService.getDesign(id);

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Decrement likes count
    await designService.decrementLikesCount(id);

    // Log unlike activity
    await activityRepository.create({
      type: 'design_updated',
      title: 'Design Unliked',
      description: `User unliked design: ${design.designName}`,
      priority: 'low',
      status: 'active',
      actorId: session.user.id,
      targetId: id,
      targetType: 'design',
      targetName: design.designName,
      metadata: {
        action: 'unliked',
        designName: design.designName,
        designerId: design.designerId
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({
      success: true,
      message: 'Design unliked successfully'
    });
  } catch (error: any) {
    console.error('Error unliking design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
