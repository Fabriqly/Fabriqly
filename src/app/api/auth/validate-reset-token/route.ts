import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Collections } from '@/services/firebase';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validating reset token

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get token document from Firestore
    const tokenDocRef = doc(db, Collections.PASSWORD_RESET_TOKENS, token);
    const tokenDoc = await getDoc(tokenDocRef);

    if (!tokenDoc.exists()) {
      // Token not found
      return NextResponse.json(
        { valid: false, error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    const tokenData = tokenDoc.data();

    // Check if token is already used
    if (tokenData.used) {
      // Token already used
      return NextResponse.json(
        { valid: false, error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();

    if (now > expiresAt) {
      // Token expired
      return NextResponse.json(
        { valid: false, error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      email: tokenData.email
    });

  } catch (error) {
    console.error('❌ Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}
