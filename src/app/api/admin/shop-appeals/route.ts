import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/admin/shop-appeals - Get all shop appeals for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get appeals directly from Firestore to preserve timestamp format
    const appealsSnapshot = await adminDb.collection(Collections.SHOP_APPEALS)
      .orderBy('createdAt', 'desc')
      .get();
    
    const appeals = appealsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    

    // Helper function to convert Firestore timestamps to ISO strings
    const convertTimestamps = (obj: any): any => {
      if (!obj) return obj;
      
      const converted = { ...obj };
      
      // Convert Firestore Timestamp objects to ISO strings
      Object.keys(converted).forEach(key => {
        const value = converted[key];
        
        // Handle Firestore Timestamp objects
        if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
          // This is a Firestore Timestamp
          converted[key] = new Date(value.seconds * 1000).toISOString();
        }
        // Handle Firestore Timestamp with toDate method
        else if (value && typeof value === 'object' && typeof value.toDate === 'function') {
          converted[key] = value.toDate().toISOString();
        }
        // Handle Firestore Timestamp objects that might be serialized differently
        else if (value && typeof value === 'object' && value._seconds !== undefined) {
          // Alternative Firestore timestamp format
          converted[key] = new Date(value._seconds * 1000).toISOString();
        }
        // Handle objects that might be timestamps but are stringified
        else if (typeof value === 'string' && value === '[object Object]') {
          // Skip malformed timestamp fields
          delete converted[key];
        }
        // Handle empty objects that might be malformed timestamps
        else if (value && typeof value === 'object' && Object.keys(value).length === 0) {
          // Skip empty objects that might be malformed timestamps
          delete converted[key];
        }
        // Recursively convert nested objects
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
          converted[key] = convertTimestamps(value);
        }
      });
      
      return converted;
    };

    // Get shop details for each appeal and convert timestamps
    const appealsWithShop = await Promise.all(
      appeals.map(async (appeal) => {
        try {
          const shopDoc = await adminDb.collection(Collections.SHOP_PROFILES)
            .doc(appeal.shopId)
            .get();
          
          const shop = shopDoc.exists ? { id: shopDoc.id, ...shopDoc.data() } : null;
          
          const convertedAppeal = convertTimestamps(appeal);
          
          return {
            ...convertedAppeal,
            shop: shop ? {
              id: shop.id,
              shopName: shop.shopName,
              username: shop.username,
              businessOwnerName: shop.businessOwnerName,
              approvalStatus: shop.approvalStatus
            } : null
          };
        } catch (error) {
          console.error(`Error fetching shop for appeal ${appeal.id}:`, error);
          return convertTimestamps(appeal);
        }
      })
    );

    
    return NextResponse.json({
      success: true,
      data: appealsWithShop
    });

  } catch (error) {
    console.error('Error fetching shop appeals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
