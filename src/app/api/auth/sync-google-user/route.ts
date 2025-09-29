// API endpoint to sync Google OAuth users between Firebase Auth and Firestore
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email, uid, displayName, photoURL } = await request.json();

    if (!email || !uid) {
      return NextResponse.json(
        { error: 'Email and UID are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Syncing Google user:', { email, uid, displayName });

    // Check if user exists in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUser(uid);
      console.log('✅ User exists in Firebase Auth:', firebaseUser.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ User not found in Firebase Auth, creating...');
        
        // Create user in Firebase Auth
        firebaseUser = await adminAuth.createUser({
          uid,
          email,
          displayName: displayName || undefined,
          photoURL: photoURL || undefined,
          emailVerified: true
        });
        console.log('✅ User created in Firebase Auth:', firebaseUser.uid);
      } else {
        throw error;
      }
    }

    // Check if user exists in Firestore
    const userDocRef = adminDb.collection(Collections.USERS).doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.log('❌ User not found in Firestore, creating...');
      
      // Create user document in Firestore
      const userData = {
        email,
        displayName: displayName || '',
        photoURL: photoURL || null,
        role: 'customer',
        isVerified: true,
        provider: 'google',
        profile: {
          firstName: displayName?.split(' ')[0] || '',
          lastName: displayName?.split(' ').slice(1).join(' ') || '',
          preferences: {
            notifications: {
              email: true,
              sms: false,
              push: true
            },
            theme: 'light'
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      await userDocRef.set(userData);
      console.log('✅ User created in Firestore:', uid);
    } else {
      console.log('✅ User exists in Firestore, updating last login...');
      
      // Update last login
      await userDocRef.update({
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      uid,
      email,
      existsInAuth: !!firebaseUser,
      existsInFirestore: userDoc.exists
    });

  } catch (error: any) {
    console.error('❌ Error syncing Google user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync user',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
