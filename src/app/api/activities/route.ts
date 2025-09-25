import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Activity, 
  ActivityWithDetails, 
  ActivityFilters, 
  CreateActivityData, 
  UpdateActivityData,
  ActivityStats,
  ActivityType
} from '@/types/activity';

// Helper function to convert Firestore Timestamps to JavaScript Dates
const convertTimestamps = (data: any): any => {
  if (data && typeof data === 'object') {
    const converted = { ...data };
    
    Object.keys(converted).forEach(key => {
      const value = converted[key];
      
      // Check for Firebase Admin SDK Timestamp (server-side)
      if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
        converted[key] = value.toDate();
      }
      // Check for client-side Firestore Timestamp format
      else if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
        converted[key] = new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
      }
      // Check for Date objects (already converted)
      else if (value instanceof Date) {
        converted[key] = value;
      }
      // Recursively convert nested objects
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[key] = convertTimestamps(value);
      }
    });
    
    return converted;
  }
  return data;
};

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const types = searchParams.get('types')?.split(',') as ActivityType[];
    const priority = searchParams.get('priority')?.split(',') as any[];
    const status = searchParams.get('status')?.split(',') as any[];
    const actorId = searchParams.get('actorId');
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query constraints - simplified to avoid index requirements
    const constraints = [];
    
    // Only add status filter if specified, otherwise get all
    if (status && status.length > 0) {
      constraints.push({ field: 'status', operator: 'in' as const, value: status });
    }
    
    // Apply other filters in memory to avoid complex indexes
    const rawActivities = await FirebaseAdminService.queryDocuments(
      Collections.ACTIVITIES,
      constraints,
      { field: 'createdAt', direction: 'desc' },
      limit + offset
    );

    // Apply additional filters in memory
    let filteredActivities = rawActivities;
    
    if (types && types.length > 0) {
      filteredActivities = filteredActivities.filter(activity => 
        types.includes(activity.type)
      );
    }
    
    if (priority && priority.length > 0) {
      filteredActivities = filteredActivities.filter(activity => 
        priority.includes(activity.priority)
      );
    }
    
    if (actorId) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.actorId === actorId
      );
    }
    
    if (targetId) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.targetId === targetId
      );
    }
    
    if (targetType) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.targetType === targetType
      );
    }

    // Convert timestamps and apply pagination
    const activities = filteredActivities
      .slice(offset, offset + limit)
      .map(activity => convertTimestamps(activity)) as Activity[];

    // Get related data for activities
    const activitiesWithDetails: ActivityWithDetails[] = await Promise.all(
      activities.map(async (activity) => {
        const details: ActivityWithDetails = { ...activity };
        
        // Get actor details if actorId exists
        if (activity.actorId) {
          try {
            const actor = await FirebaseAdminService.getDocument(Collections.USERS, activity.actorId);
            if (actor) {
              details.actor = {
                id: actor.id,
                name: actor.displayName || actor.email,
                email: actor.email,
                role: actor.role,
                avatar: actor.photoURL
              };
            }
          } catch (error) {
            console.error('Error fetching actor details:', error);
          }
        }
        
        // Get target details if targetId exists
        if (activity.targetId && activity.targetType) {
          try {
            let targetCollection = '';
            switch (activity.targetType) {
              case 'user':
                targetCollection = Collections.USERS;
                break;
              case 'product':
                targetCollection = Collections.PRODUCTS;
                break;
              case 'category':
                targetCollection = Collections.CATEGORIES;
                break;
              case 'color':
                targetCollection = Collections.COLORS;
                break;
              case 'order':
                targetCollection = Collections.ORDERS;
                break;
              case 'design':
                targetCollection = Collections.DESIGNS;
                break;
              case 'shop':
                targetCollection = Collections.SHOP_PROFILES;
                break;
              case 'designer':
                targetCollection = Collections.DESIGNER_PROFILES;
                break;
            }
            
            if (targetCollection) {
              const target = await FirebaseAdminService.getDocument(targetCollection, activity.targetId);
              if (target) {
                details.target = {
                  id: target.id,
                  name: target.name || target.productName || target.categoryName || target.colorName || target.email || 'Unknown',
                  type: activity.targetType,
                  url: `/${activity.targetType}s/${target.id}`
                };
              }
            }
          } catch (error) {
            console.error('Error fetching target details:', error);
          }
        }
        
        return details;
      })
    );

    return NextResponse.json({ 
      activities: activitiesWithDetails,
      pagination: {
        limit,
        offset,
        total: filteredActivities.length,
        hasMore: filteredActivities.length > offset + limit
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create new activity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['admin', 'business_owner'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin or business owner access required' },
        { status: 401 }
      );
    }

    const body: CreateActivityData = await request.json();
    
    // Validate required fields
    if (!body.type || !body.title || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, description' },
        { status: 400 }
      );
    }

    const activityData: Omit<Activity, 'id'> = {
      type: body.type,
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      status: 'active',
      actorId: body.actorId || session.user.id,
      targetId: body.targetId,
      targetType: body.targetType,
      targetName: body.targetName,
      metadata: body.metadata || {},
      systemEvent: body.systemEvent
    };

    const activity = await FirebaseAdminService.createDocument(
      Collections.ACTIVITIES,
      activityData
    );

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
