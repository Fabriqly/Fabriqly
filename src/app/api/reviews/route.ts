import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/services/ReviewService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const reviewService = new ReviewService();

/**
 * GET /api/reviews - Get reviews with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      customerId: searchParams.get('customerId') || undefined,
      productId: searchParams.get('productId') || undefined,
      shopId: searchParams.get('shopId') || undefined,
      designerId: searchParams.get('designerId') || undefined,
      designId: searchParams.get('designId') || undefined,
      customizationRequestId: searchParams.get('customizationRequestId') || undefined,
      reviewType: searchParams.get('reviewType') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };

    const reviews = await reviewService.getReviews(filters);

    return NextResponse.json({
      success: true,
      data: reviews
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch reviews' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Create a review
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      rating, 
      comment, 
      images, 
      reviewType, 
      productId, 
      shopId, 
      designerId,
      designId,
      designIds, // Support multiple designs for designer reviews
      customizationRequestId 
    } = body;

    // Validate required fields
    if (!rating || !comment || !reviewType) {
      return NextResponse.json(
        { error: 'Rating, comment, and review type are required' },
        { status: 400 }
      );
    }

    // For designer reviews, use designId from designIds array if provided
    const finalDesignId = designIds && designIds.length > 0 ? designIds[0] : designId;
    
    const review = await reviewService.createReview({
      customerId: session.user.id,
      customerName: session.user.name || 'Anonymous',
      rating,
      comment,
      images,
      reviewType,
      productId,
      shopId,
      designerId,
      designId: finalDesignId,
      customizationRequestId
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review created successfully'
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    
    const status = error.message.includes('already reviewed') ? 409 :
                   error.message.includes('Rating must') || error.message.includes('required') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create review' 
      },
      { status }
    );
  }
}


















