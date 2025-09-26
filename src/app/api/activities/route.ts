import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActivityService, ActivityFilters } from '@/services/ActivityService';
import { 
  Activity, 
  CreateActivityData, 
  UpdateActivityData
} from '@/types/activity';

// GET /api/activities - List activities with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters from query parameters
    const filters: ActivityFilters = {
      actorId: searchParams.get('actorId') || undefined,
      targetId: searchParams.get('targetId') || undefined,
      targetType: searchParams.get('targetType') || undefined,
      type: searchParams.get('type') || undefined,
      priority: searchParams.get('priority') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    };

    // Handle array parameters (types, priority, status)
    const types = searchParams.get('types');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');

    const activityService = new ActivityService();
    const result = await activityService.getActivitiesWithPagination({
      ...filters,
      types: types ? types.split(',') : undefined,
      priority: priority ? priority.split(',') as any : undefined,
      status: status ? status.split(',') as any : undefined
    }, {
      limit,
      offset,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch activities'
      },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create a new activity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: CreateActivityData = await request.json();
    const activityService = new ActivityService();

    // Convert CreateActivityData to Omit<Activity, 'id'>
    const activityData: Omit<Activity, 'id'> = {
      ...body,
      priority: body.priority || 'low',
      status: 'active',
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };

    const activity = await activityService.createActivity(activityData);

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create activity'
      },
      { status: 500 }
    );
  }
}
