import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    try {
      // Attempt to sign in with the current user's email and provided password
      // This is a way to verify the password without storing it
      await signInWithEmailAndPassword(auth, session.user.email, password);
      
      return NextResponse.json({ verified: true });
    } catch (firebaseError: any) {
      // If sign-in fails, the password is incorrect
      console.log('Password verification failed:', firebaseError.code);
      
      if (firebaseError.code === 'auth/wrong-password' || 
          firebaseError.code === 'auth/invalid-credential' ||
          firebaseError.code === 'auth/invalid-login-credentials') {
        return NextResponse.json({ verified: false });
      }
      
      // For other Firebase errors, return a generic error
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
