import { NextRequest, NextResponse } from 'next/server';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// GET /api/designs/popular - Get popular designs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get popular designs
    const designs = await designService.getPopularDesigns(limit);

    return NextResponse.json({
      designs,
      total: designs.length
    });
  } catch (error) {
    console.error('Error fetching popular designs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
