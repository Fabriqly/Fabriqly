import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DisputeService } from '@/services/DisputeService';
import { DisputeFilters } from '@/types/dispute';

const disputeService = new DisputeService();

/**
 * GET /api/disputes - List disputes with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filedBy = searchParams.get('filedBy');
    const accusedParty = searchParams.get('accusedParty');
    const stage = searchParams.get('stage') as any;
    const status = searchParams.get('status') as any;
    const category = searchParams.get('category') as any;
    const orderId = searchParams.get('orderId');
    const customizationRequestId = searchParams.get('customizationRequestId');

    // Build filters
    const filters: DisputeFilters = {};
    if (filedBy) filters.filedBy = filedBy;
    if (accusedParty) filters.accusedParty = accusedParty;
    if (stage) filters.stage = stage;
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (orderId) filters.orderId = orderId;
    if (customizationRequestId) filters.customizationRequestId = customizationRequestId;

    // Users can only see their own disputes unless admin
    if (session.user.role !== 'admin') {
      // Filter to only show disputes where user is involved
      if (!filedBy && !accusedParty) {
        // If no specific filter, we'll show all disputes where user is filer OR accused
        // This is handled in the query logic below (lines 76-81)
        // Don't set a default filter here - let it fall through to get both
      } else if (filedBy && filedBy !== session.user.id && accusedParty !== session.user.id) {
        // If specific filter is provided but user is not involved, deny access
        return NextResponse.json(
          { error: 'Forbidden: You can only view your own disputes' },
          { status: 403 }
        );
      } else if (accusedParty && accusedParty !== session.user.id && filedBy !== session.user.id) {
        // If specific filter is provided but user is not involved, deny access
        return NextResponse.json(
          { error: 'Forbidden: You can only view your own disputes' },
          { status: 403 }
        );
      }
    }

    const { DisputeRepository } = await import('@/repositories/DisputeRepository');
    const disputeRepo = new DisputeRepository();

    let disputes;
    if (filters.filedBy) {
      disputes = await disputeRepo.findByFiledBy(filters.filedBy, filters);
    } else if (filters.accusedParty) {
      disputes = await disputeRepo.findByAccusedParty(filters.accusedParty, filters);
    } else if (filters.stage) {
      disputes = await disputeRepo.findByStage(filters.stage, filters);
    } else if (filters.orderId) {
      disputes = await disputeRepo.findByOrderId(filters.orderId);
    } else if (filters.customizationRequestId) {
      disputes = await disputeRepo.findByCustomizationRequestId(filters.customizationRequestId);
    } else {
      // Admin can see all, others see their own
      if (session.user.role === 'admin') {
        disputes = await disputeRepo.findAll();
      } else {
        // Get disputes where user is filer or accused
        const filed = await disputeRepo.findByFiledBy(session.user.id);
        const accused = await disputeRepo.findByAccusedParty(session.user.id);
        const disputeMap = new Map();
        [...filed, ...accused].forEach(d => disputeMap.set(d.id, d));
        disputes = Array.from(disputeMap.values());
      }
    }

    return NextResponse.json({
      success: true,
      data: disputes
    });
  } catch (error: any) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch disputes' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/disputes - File new dispute
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

    const formData = await request.formData();
    const orderId = formData.get('orderId') as string | null;
    const customizationRequestId = formData.get('customizationRequestId') as string | null;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;

    if (!category || !description) {
      return NextResponse.json(
        { error: 'Category and description are required' },
        { status: 400 }
      );
    }

    if (!orderId && !customizationRequestId) {
      return NextResponse.json(
        { error: 'Either orderId or customizationRequestId is required' },
        { status: 400 }
      );
    }

    // Get evidence files
    const evidenceImages: File[] = [];
    const imageFiles = formData.getAll('evidenceImages') as File[];
    for (const file of imageFiles) {
      if (file && file.size > 0) {
        evidenceImages.push(file);
      }
    }

    const evidenceVideo = formData.get('evidenceVideo') as File | null;

    const disputeData = {
      orderId: orderId || undefined,
      customizationRequestId: customizationRequestId || undefined,
      filedBy: session.user.id,
      category: category as any,
      description,
      evidenceImages: evidenceImages.length > 0 ? evidenceImages : undefined,
      evidenceVideo: evidenceVideo && evidenceVideo.size > 0 ? evidenceVideo : undefined
    };

    const dispute = await disputeService.fileDispute(disputeData);

    return NextResponse.json({
      success: true,
      data: dispute
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error filing dispute:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to file dispute' 
      },
      { status: error.statusCode || 500 }
    );
  }
}






