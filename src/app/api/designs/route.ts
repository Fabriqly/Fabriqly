import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Design, 
  CreateDesignData, 
  UpdateDesignData,
  DesignFilters,
  DesignWithDetails 
} from '@/types/enhanced-products';

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
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    // Build Firestore query constraints
    const constraints = [];
    
    if (filters.designerId) {
      constraints.push({ field: 'designerId', operator: '==' as const, value: filters.designerId });
    }
    
    if (filters.categoryId) {
      constraints.push({ field: 'categoryId', operator: '==' as const, value: filters.categoryId });
    }
    
    if (filters.designType) {
      constraints.push({ field: 'designType', operator: '==' as const, value: filters.designType });
    }
    
    if (filters.isPublic !== undefined) {
      constraints.push({ field: 'isPublic', operator: '==' as const, value: filters.isPublic });
    }
    
    if (filters.isFeatured !== undefined) {
      constraints.push({ field: 'isFeatured', operator: '==' as const, value: filters.isFeatured });
    }
    
    if (filters.isActive !== undefined) {
      constraints.push({ field: 'isActive', operator: '==' as const, value: filters.isActive });
    }

    // Get designs with pagination
    const result = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNS,
      constraints,
      { field: filters.sortBy!, direction: filters.sortOrder! },
      filters.limit! + 1 // Get one extra to check if there are more
    );

    const hasMore = result.length > filters.limit!;
    const designs = hasMore ? result.slice(0, filters.limit!) : result;

    // Populate with related data
    const designsWithDetails: DesignWithDetails[] = await Promise.all(
      designs.map(async (design) => {
        // Get designer profile
        const designer = await FirebaseAdminService.getDocument(
          Collections.DESIGNER_PROFILES,
          design.designerId
        );

        // Get category
        const category = await FirebaseAdminService.getDocument(
          Collections.PRODUCT_CATEGORIES,
          design.categoryId
        );

        return {
          ...design,
          designer: designer || { id: '', businessName: 'Unknown Designer', userId: '', specialties: [], isVerified: false, isActive: true, portfolioStats: { totalDesigns: 0, totalDownloads: 0, totalViews: 0, averageRating: 0 }, createdAt: new Date(), updatedAt: new Date() },
          category: category || { id: '', categoryName: 'Unknown', slug: 'unknown', level: 0, path: [], isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() }
        };
      })
    );

    return NextResponse.json({
      designs: designsWithDetails,
      total: designsWithDetails.length,
      hasMore,
      filters
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
    
    // Validate required fields
    if (!body.designName || !body.description || !body.categoryId || !body.designFileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: designName, description, categoryId, designFileUrl' },
        { status: 400 }
      );
    }

    // Get designer profile
    const designerProfile = await FirebaseAdminService.queryDocuments(
      Collections.DESIGNER_PROFILES,
      [{ field: 'userId', operator: '==' as const, value: session.user.id }]
    );

    if (designerProfile.length === 0) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 400 }
      );
    }

    // Generate design slug
    const slug = body.designName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    const designData: Omit<Design, 'id'> = {
      designName: body.designName,
      description: body.description,
      designSlug: slug,
      designerId: designerProfile[0].id,
      categoryId: body.categoryId,
      designFileUrl: body.designFileUrl,
      thumbnailUrl: body.thumbnailUrl,
      previewUrl: body.previewUrl,
      designType: body.designType || 'template',
      fileFormat: body.fileFormat || 'png',
      tags: body.tags || [],
      isPublic: body.isPublic !== false,
      isFeatured: false,
      isActive: true,
      pricing: body.pricing || { isFree: true, currency: 'USD' },
      downloadCount: 0,
      viewCount: 0,
      likesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const design = await FirebaseAdminService.createDocument(
      Collections.DESIGNS,
      designData
    );

    // Update designer profile stats
    await FirebaseAdminService.updateDocument(
      Collections.DESIGNER_PROFILES,
      designerProfile[0].id,
      {
        portfolioStats: {
          ...designerProfile[0].portfolioStats,
          totalDesigns: designerProfile[0].portfolioStats.totalDesigns + 1
        },
        updatedAt: new Date()
      }
    );

    return NextResponse.json({ design }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating design:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
