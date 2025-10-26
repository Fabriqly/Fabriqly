import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ServiceContainer } from '@/container/ServiceContainer';
import { ActivityService } from '@/services/ActivityService';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Activity, 
  ActivityWithDetails, 
  UpdateActivityData 
} from '@/types/activity';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

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

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/activities/[id] - Get single activity
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const activityService = ServiceContainer.getInstance().get<ActivityService>('activityService');
    const activity = await activityService.getActivity(    const { id } = await params;);
    
    if (!activity) {
      return NextResponse.json(
        ResponseBuilder.error(ErrorHandler.handle(new Error('Activity not found'))),
        { status: 404 }
      );
    }

    const convertedActivity = activity;
    
    // Get related data
    const activityWithDetails: ActivityWithDetails = { ...convertedActivity };
    
    // Get actor details if actorId exists
    if (convertedActivity.actorId) {
      try {
        const actor = await FirebaseAdminService.getDocument(Collections.USERS, convertedActivity.actorId);
        if (actor) {
          activityWithDetails.actor = {
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
    if (convertedActivity.targetId && convertedActivity.targetType) {
      try {
        let targetCollection = '';
        switch (convertedActivity.targetType) {
          case 'user':
            targetCollection = Collections.USERS;
            break;
          case 'product':
            targetCollection = Collections.PRODUCTS;
            break;
          case 'category':
            targetCollection = Collections.PRODUCT_CATEGORIES;
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
          const target = await FirebaseAdminService.getDocument(targetCollection, convertedActivity.targetId);
          if (target) {
            activityWithDetails.target = {
              id: target.id,
              name: target.name || target.productName || target.categoryName || target.colorName || target.email || 'Unknown',
              type: convertedActivity.targetType,
              url: `/${convertedActivity.targetType}s/${target.id}`
            };
          }
        }
      } catch (error) {
        console.error('Error fetching target details:', error);
      }
    }

    return NextResponse.json(ResponseBuilder.success(activityWithDetails));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

// PUT /api/activities/[id] - Update activity
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: UpdateActivityData = await request.json();
    
    const activityService = ServiceContainer.getInstance().get<ActivityService>('activityService');
    const activity = await activityService.updateActivity(    const { id } = await params;, body);

    return NextResponse.json(ResponseBuilder.success(activity));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

// DELETE /api/activities/[id] - Delete activity
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const activityService = ServiceContainer.getInstance().get<ActivityService>('activityService');
    await activityService.deleteActivity(    const { id } = await params;);

    return NextResponse.json(ResponseBuilder.success({ success: true }));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

