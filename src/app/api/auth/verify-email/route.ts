import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find token in Firestore
    const tokens = await FirebaseAdminService.queryDocuments(
      'emailVerificationTokens',
      [
        { field: 'token', operator: '==', value: token },
        { field: 'used', operator: '==', value: false }
      ]
    );

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const tokenData = tokens[0];

    // Check if token is expired
    const expiresAt = tokenData.expiresAt?.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData.expiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    const userId = tokenData.userId;

    // Verify user email in Firebase Auth
    await FirebaseAdminService.verifyUserEmail(userId);

    // Mark token as used
    await FirebaseAdminService.updateDocument(
      'emailVerificationTokens',
      tokenData.id,
      {
        used: true,
        verifiedAt: Timestamp.now(),
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

