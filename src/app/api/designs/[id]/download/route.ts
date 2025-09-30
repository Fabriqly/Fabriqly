import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { Timestamp } from 'firebase/firestore';

// POST /api/designs/[id]/download - Download a design
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
        { error: 'Design is not available for download' },
        { status: 403 }
      );
    }

    // Check if user has permission to download
    // For free designs, anyone can download
    // For paid designs, user must have purchased it (future implementation)
    if (!design.pricing?.isFree) {
      // TODO: Implement purchase verification
      return NextResponse.json(
        { error: 'This design requires purchase' },
        { status: 402 }
      );
    }

    // Increment download count
    await designService.incrementDownloadCount(id);

    // Log download activity
    await activityRepository.create({
      type: 'design_updated',
      title: 'Design Downloaded',
      description: `User downloaded design: ${design.designName}`,
      priority: 'medium',
      status: 'active',
      actorId: session.user.id,
      targetId: id,
      targetType: 'design',
      targetName: design.designName,
      metadata: {
        action: 'downloaded',
        designName: design.designName,
        designType: design.designType,
        isFree: design.pricing?.isFree
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Fetch the file from Supabase storage
    const fileResponse = await fetch(design.designFileUrl);
    
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch design file' },
        { status: 500 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileName = `${design.designName}.${design.fileFormat}`;

    // Return the file with proper download headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileResponse.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error downloading design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
