import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';

// GET /api/designs/stats - Get design statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const designerId = searchParams.get('designerId');

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get stats
    const stats = await designService.getDesignStats(designerId || undefined);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching design stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
