
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DesignService } from '@/services/DesignService';
import { DesignRepository } from '@/repositories/DesignRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { 
  Design, 
  CreateDesignData, 
  DesignFilters,
  DesignWithDetails 
} from '@/types/enhanced-products';

// GET /api/designs - List designs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    console.log('🔍 Designs API called with params:', Object.fromEntries(searchParams.entries()));
    
    // Parse filters from query parameters
    const filters: DesignFilters = {
      designerId: searchParams.get('designerId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      designType: searchParams.get('designType') as any || undefined,
      isPublic: searchParams.get('isPublic') === 'true' ? true : 
                searchParams.get('isPublic') === 'false' ? false : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : 
                  searchParams.get('isFeatured') === 'false' ? false : undefined,
      isFree: searchParams.get('isFree') === 'true' ? true : 
              searchParams.get('isFree') === 'false' ? false : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    console.log('📊 Parsed filters:', filters);

    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Get designs using the service
    const designs = await designService.getDesigns(filters);

    console.log('✅ Found designs:', designs.length);

    return NextResponse.json({
      designs,
      total: designs.length,
      hasMore: designs.length === (filters.limit || 20),
      filters
    });
  } catch (error) {
    console.error('❌ Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/designs - Create a new design
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['designer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Designer access required' },
        { status: 401 }
      );
    }

    const body: CreateDesignData = await request.json();
    
    // Generate idempotency key based on user and design data
    const idempotencyKey = `${session.user.id}-${body.designName}-${body.designFileUrl}-${Date.now()}`;
    
    // Log the request for debugging
    console.log('🔍 Design creation API called by user:', session.user.id);
    console.log('🔑 Idempotency key:', idempotencyKey);
    console.log('📊 Design data:', JSON.stringify(body, null, 2));
    
    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Create design using the service
    const design = await designService.createDesign(body, session.user.id);
    
    console.log('✅ Design created successfully with ID:', design.id);

    return NextResponse.json({ design }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}