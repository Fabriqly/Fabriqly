// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-errors';
import { authLogger } from '@/lib/auth-logging';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Log login attempt
    authLogger.log({
      level: 'INFO' as any,
      message: `Login attempt for ${email}`,
      action: 'SIGN_IN_ATTEMPT' as any,
      details: { email }
    });

    // Use NextAuth's signIn with credentials
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      // Log failed login
      authLogger.log({
        level: 'WARN' as any,
        message: `Failed login attempt for ${email}`,
        action: 'SIGN_IN_FAILURE' as any,
        details: { email, error: result.error }
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Log successful login
    authLogger.log({
      level: 'INFO' as any,
      message: `Successful login for ${email}`,
      action: 'SIGN_IN_SUCCESS' as any,
      details: { email }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Login successful' 
    });

  } catch (error: any) {
    const authError = AuthErrorHandler.handleError(error);
    
    // Log login error
    authLogger.log({
      level: 'ERROR' as any,
      message: `Login error: ${error.message}`,
      action: 'SIGN_IN_FAILURE' as any,
      errorCode: authError.code,
      details: { error: error.message }
    });

    return NextResponse.json(
      { error: authError.userMessage },
      { status: 500 }
    );
  }
}
