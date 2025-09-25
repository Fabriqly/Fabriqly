import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Activity, 
  ActivityWithDetails, 
  UpdateActivityData 
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

    const activity = await FirebaseAdminService.getDocument(Collections.ACTIVITIES, params.id);
    
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const convertedActivity = convertTimestamps(activity) as Activity;
    
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

    return NextResponse.json({ activity: activityWithDetails });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
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
    
    const activity = await FirebaseAdminService.updateDocument(
      Collections.ACTIVITIES,
      params.id,
      {
        ...body,
        updatedAt: new Date()
      }
    );

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
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

    await FirebaseAdminService.deleteDocument(Collections.ACTIVITIES, params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
