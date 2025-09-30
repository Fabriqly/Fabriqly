import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DesignerProfileService } from '@/services/DesignerProfileService';
import { DesignerProfileRepository } from '@/repositories/DesignerProfileRepository';

// POST /api/designer-profiles/sync-stats - Sync designer profile stats with real design data
export async function POST(request: NextRequest) {
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

    if (!designerId) {
      return NextResponse.json(
        { error: 'Designer ID is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const designerProfileRepository = new DesignerProfileRepository();
    const designerProfileService = new DesignerProfileService(designerProfileRepository);

    // Sync the stats
    const updatedProfile = await designerProfileService.syncPortfolioStatsWithDesigns(designerId);

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      message: 'Portfolio stats synced successfully'
    });
  } catch (error) {
    console.error('Error syncing designer profile stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
