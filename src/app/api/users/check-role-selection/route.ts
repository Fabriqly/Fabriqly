// app/api/users/check-role-selection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/services/firebase';

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user document from Firestore
    const userDocRef = doc(db, Collections.USERS, session.user.id);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Check if user has explicitly selected their role
    // We consider a user to have "selected" their role if:
    // 1. They have a role other than 'customer' (the default)
    // 2. OR they have a profile completion flag set
    // 3. OR they have additional profile data beyond the basic Google OAuth data
    
    const hasSelectedRole = 
      userData.role !== 'customer' || 
      userData.profileCompleted === true ||
      userData.hasExplicitlySelectedRole === true ||
      (userData.profile && Object.keys(userData.profile).length > 2); // More than just firstName/lastName

    return NextResponse.json({
      hasSelectedRole,
      role: userData.role,
      profileCompleted: userData.profileCompleted || false
    });

  } catch (error) {
    console.error('Error checking role selection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
