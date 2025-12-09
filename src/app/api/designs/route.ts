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
import { unstable_cache } from 'next/cache';

// Serverless-friendly cache for design listings
const cachedGetDesigns = unstable_cache(
  async (_key: string, filters: DesignFilters) => {
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);
    return designService.getDesigns(filters);
  },
  ['designs-list-cache'],
  {
    revalidate: 60, // 1 minute
    tags: ['designs-list'],
  }
);

// GET /api/designs - List designs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
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
      limit: Math.min(parseInt(searchParams.get('limit') || '12'), 20), // cap to reduce reads
      offset: parseInt(searchParams.get('offset') || '0'),
      cursor: searchParams.get('cursor') || undefined
    };

    // Cache key based on filters to avoid redundant reads
    const cacheKeyFilters = JSON.stringify(filters);

    // For cursor pagination, fetch limit + 1 to determine hasMore
    const effectiveLimit = (filters.limit || 12);
    const fetchLimit = Math.min(effectiveLimit + 1, 21); // small cap

    const designsWithExtra = await cachedGetDesigns(cacheKeyFilters, {
      ...filters,
      limit: fetchLimit,
    });

    const hasMore = designsWithExtra.length > effectiveLimit;
    const designs = hasMore ? designsWithExtra.slice(0, effectiveLimit) : designsWithExtra;
    const nextCursor = hasMore
      ? (designs[designs.length - 1]?.createdAt instanceof Date
          ? designs[designs.length - 1].createdAt.getTime()
          : new Date(designs[designs.length - 1]?.createdAt || '').getTime())
      : null;

    return NextResponse.json({
      designs,
      total: designs.length,
      hasMore,
      nextCursor,
      filters: {
        ...filters,
        limit: effectiveLimit,
      }
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
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
    
    // Initialize services
    const designRepository = new DesignRepository();
    const activityRepository = new ActivityRepository();
    const designService = new DesignService(designRepository, activityRepository);

    // Create design using the service
    const design = await designService.createDesign(body, session.user.id);

    return NextResponse.json({ design }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}