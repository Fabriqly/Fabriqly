import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/services/ReviewService';

const reviewService = new ReviewService();

/**
 * GET /api/reviews/average - Get average rating
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const reviewType = searchParams.get('type') as 'product' | 'shop' | 'designer' | 'design';
    const targetId = searchParams.get('targetId');

    if (!reviewType || !targetId) {
      return NextResponse.json(
        { error: 'Review type and target ID are required' },
        { status: 400 }
      );
    }

    if (!['product', 'shop', 'designer', 'design'].includes(reviewType)) {
      return NextResponse.json(
        { error: 'Invalid review type' },
        { status: 400 }
      );
    }

    const stats = await reviewService.getAverageRating(reviewType, targetId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching average rating:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch average rating' 
      },
      { status: 500 }
    );
  }
}


















