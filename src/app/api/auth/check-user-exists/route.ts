import { NextRequest, NextResponse } from 'next/server';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking if user exists:', email);

    // Check in Firebase Auth
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    const existsInAuth = signInMethods.length > 0;

    // Check in Firestore
    const usersRef = collection(db, Collections.USERS);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    const existsInFirestore = !querySnapshot.empty;

    const userExists = existsInAuth || existsInFirestore;

    console.log('📊 User check results:', {
      email,
      existsInAuth,
      existsInFirestore,
      userExists,
      signInMethods
    });

    return NextResponse.json({
      email,
      exists: userExists,
      existsInAuth,
      existsInFirestore,
      signInMethods
    });

  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    return NextResponse.json(
      { error: 'Failed to check user existence' },
      { status: 500 }
    );
  }
}
