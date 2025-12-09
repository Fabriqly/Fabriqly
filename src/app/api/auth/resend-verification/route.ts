import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { EmailService } from '@/services/EmailService';
import * as crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is already verified
    const user = await FirebaseAdminService.getDocument(Collections.USERS, userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Invalidate old tokens for this user
    const oldTokens = await FirebaseAdminService.queryDocuments(
      'emailVerificationTokens',
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'used', operator: '==', value: false }
      ]
    );

    for (const oldToken of oldTokens) {
      await FirebaseAdminService.updateDocument(
        'emailVerificationTokens',
        oldToken.id,
        { used: true }
      );
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Store new token in Firestore
    await FirebaseAdminService.createDocument('emailVerificationTokens', {
      userId,
      token,
      email: user.email,
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      createdAt: Timestamp.now(),
    });

    // Send verification email
    await EmailService.sendVerificationEmail(userId, token);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

