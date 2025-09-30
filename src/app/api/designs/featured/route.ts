import { NextRequest, NextResponse } from 'next/server';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// GET /api/designs/featured - Get featured designs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get featured designs
    const designs = await designService.getFeaturedDesigns();

    // Limit results if specified
    const limitedDesigns = limit ? designs.slice(0, limit) : designs;

    return NextResponse.json({
      designs: limitedDesigns,
      total: limitedDesigns.length
    });
  } catch (error) {
    console.error('Error fetching featured designs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
