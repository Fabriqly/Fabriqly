import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { UserLikeRepository } from '@/repositories/UserLikeRepository';
import { Timestamp } from 'firebase/firestore';

// GET /api/designs/[id]/like - Check if user has liked a design
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

    // Initialize services
    const userLikeRepository = new UserLikeRepository();

    // Check if user has liked this design
    const hasLiked = await userLikeRepository.hasUserLikedDesign(session.user.id, id);

    return NextResponse.json({
      hasLiked
    });
  } catch (error: any) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/designs/[id]/like - Like a design
export async function POST(
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

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const userLikeRepository = new UserLikeRepository();
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

    // Check if user has already liked this design
    const hasLiked = await userLikeRepository.hasUserLikedDesign(session.user.id, id);
    
    if (hasLiked) {
      return NextResponse.json(
        { error: 'Design already liked' },
        { status: 400 }
      );
    }

    // Add user like relationship
    await userLikeRepository.addLike(session.user.id, id);

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

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const userLikeRepository = new UserLikeRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get design
    const design = await designService.getDesign(id);

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Check if user has liked this design
    const hasLiked = await userLikeRepository.hasUserLikedDesign(session.user.id, id);
    
    if (!hasLiked) {
      return NextResponse.json(
        { error: 'Design not liked' },
        { status: 400 }
      );
    }

    // Remove user like relationship
    await userLikeRepository.removeLike(session.user.id, id);

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
