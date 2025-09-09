import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  SizeChart, 
  CreateSizeChartData, 
  UpdateSizeChartData 
} from '@/types/enhanced-products';

// GET /api/size-charts - List size charts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query constraints
    const constraints = [];
    
    if (categoryId) {
      constraints.push({ field: 'categoryId', operator: '==' as const, value: categoryId });
    }
    
    if (isActive !== null) {
      constraints.push({ field: 'isActive', operator: '==' as const, value: isActive === 'true' });
    }

    const sizeCharts = await FirebaseAdminService.queryDocuments(
      Collections.SIZE_CHARTS,
      constraints,
      { field: 'chartName', direction: 'asc' },
      limit
    );

    return NextResponse.json({ sizeCharts });
  } catch (error) {
    console.error('Error fetching size charts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/size-charts - Create size chart (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: CreateSizeChartData = await request.json();
    
    // Validate required fields
    if (!body.chartName || !body.sizeData) {
      return NextResponse.json(
        { error: 'Missing required fields: chartName, sizeData' },
        { status: 400 }
      );
    }

    // Check if chart name already exists
    const existingChart = await FirebaseAdminService.queryDocuments(
      Collections.SIZE_CHARTS,
      [{ field: 'chartName', operator: '==' as const, value: body.chartName }]
    );

    if (existingChart.length > 0) {
      return NextResponse.json(
        { error: 'Size chart with this name already exists' },
        { status: 400 }
      );
    }

    const chartData: Omit<SizeChart, 'id'> = {
      chartName: body.chartName,
      description: body.description,
      sizeData: body.sizeData,
      categoryId: body.categoryId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sizeChart = await FirebaseAdminService.createDocument(
      Collections.SIZE_CHARTS,
      chartData
    );

    return NextResponse.json({ sizeChart }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating size chart:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
