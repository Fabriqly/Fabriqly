import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      // Check if browser request
      const acceptHeader = request.headers.get('accept') || '';
      const isBrowserRequest = acceptHeader.includes('text/html');
      
      if (isBrowserRequest) {
        const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
        return NextResponse.redirect(new URL('/verify-email-error?error=missing_token', baseUrl));
      }
      
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
      const acceptHeader = request.headers.get('accept') || '';
      const isBrowserRequest = acceptHeader.includes('text/html');
      
      if (isBrowserRequest) {
        const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
        return NextResponse.redirect(new URL('/verify-email-error?error=invalid_token', baseUrl));
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const tokenData = tokens[0];

    // Check if token is expired
    // queryDocuments already converts Timestamps to Date objects via convertTimestamps
    let expiresAt: Date;
    if (!tokenData.expiresAt) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // expiresAt should already be a Date object from convertTimestamps, but handle all cases
    if (tokenData.expiresAt instanceof Date) {
      expiresAt = tokenData.expiresAt;
    } else if (tokenData.expiresAt instanceof Timestamp) {
      expiresAt = tokenData.expiresAt.toDate();
    } else if (tokenData.expiresAt?.toDate && typeof tokenData.expiresAt.toDate === 'function') {
      expiresAt = tokenData.expiresAt.toDate();
    } else if (tokenData.expiresAt?.seconds) {
      const seconds = tokenData.expiresAt.seconds || 0;
      const nanoseconds = tokenData.expiresAt.nanoseconds || 0;
      expiresAt = new Date(seconds * 1000 + nanoseconds / 1000000);
    } else if (tokenData.expiresAt?._seconds) {
      const seconds = tokenData.expiresAt._seconds || 0;
      const nanoseconds = tokenData.expiresAt._nanoseconds || 0;
      expiresAt = new Date(seconds * 1000 + nanoseconds / 1000000);
    } else {
      expiresAt = new Date(tokenData.expiresAt);
    }

    // Validate the date
    if (isNaN(expiresAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid token expiration date' },
        { status: 400 }
      );
    }

    if (expiresAt < new Date()) {
      const acceptHeader = request.headers.get('accept') || '';
      const isBrowserRequest = acceptHeader.includes('text/html');
      
      if (isBrowserRequest) {
        const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
        return NextResponse.redirect(new URL('/verify-email-error?error=expired_token', baseUrl));
      }
      
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    const userId = tokenData.userId;

    // Verify user email in Firebase Auth
    await FirebaseAdminService.verifyUserEmail(userId);

    // Mark token as used
    if (tokenData.id) {
      await FirebaseAdminService.updateDocument(
        'emailVerificationTokens',
        tokenData.id,
        {
          used: true,
          verifiedAt: Timestamp.now(),
        }
      );
    }

    // Check if this is a browser request (has Accept header with text/html)
    const acceptHeader = request.headers.get('accept') || '';
    const isBrowserRequest = acceptHeader.includes('text/html');

    if (isBrowserRequest) {
      // Redirect to success page, which will then redirect to explore
      const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
      return NextResponse.redirect(new URL('/verify-email-success?verified=true', baseUrl));
    }

    // Return JSON for API requests
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

