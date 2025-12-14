import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/services/ReviewService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const reviewService = new ReviewService();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/reviews/[id] - Get a single review
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const review = await reviewService.getReviewById(id);

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch review' 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reviews/[id] - Update a review (add/update reply)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { reply } = body;

    if (!reply || !reply.comment) {
      return NextResponse.json(
        { success: false, error: 'Reply comment is required' },
        { status: 400 }
      );
    }

    // Get the review to check permissions
    const review = await reviewService.getReviewById(id);
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Determine author role
    let authorRole: 'shop_owner' | 'designer' | 'admin' = 'admin';
    if (session.user.role === 'business_owner' && review.reviewType === 'shop') {
      authorRole = 'shop_owner';
    } else if (session.user.role === 'designer' && (review.reviewType === 'designer' || review.reviewType === 'design')) {
      authorRole = 'designer';
    } else if (session.user.role === 'admin') {
      authorRole = 'admin';
    } else {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to reply to this review' },
        { status: 403 }
      );
    }

    // Add or update reply
    const updatedReview = review.reply
      ? await reviewService.updateReply(id, session.user.id, reply.comment)
      : await reviewService.addReply(
          id,
          session.user.id,
          session.user.name || 'Anonymous',
          authorRole,
          reply.comment
        );

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: 'Reply submitted successfully'
    });
  } catch (error: any) {
    console.error('Error updating review:', error);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('permission') || error.message.includes('forbidden') ? 403 :
                   error.message.includes('already has') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update review' 
      },
      { status }
    );
  }
}

/**
 * DELETE /api/reviews/[id] - Delete a review
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    await reviewService.deleteReview(
      id,
      session.user.id,
      session.user.role || ''
    );

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('permission') || error.message.includes('forbidden') ? 403 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete review' 
      },
      { status }
    );
  }
}

