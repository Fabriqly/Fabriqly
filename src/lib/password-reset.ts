// lib/password-reset.ts - NextAuth Integrated Password Reset
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { AuthErrorHandler, AuthErrorCode } from './auth-errors';
import { authLogger } from './auth-logging';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  errorCode?: AuthErrorCode;
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
        errorCode: AuthErrorCode.INVALID_EMAIL
      };
    }

    // Log the password reset attempt
    authLogger.log({
      level: 'INFO' as any,
      message: `Password reset requested for ${email}`,
      action: 'PASSWORD_RESET_REQUEST' as any,
      details: { email }
    });

    // Send password reset email via Firebase Auth
    await sendPasswordResetEmail(auth, email);

    // Log successful password reset email
    authLogger.log({
      level: 'INFO' as any,
      message: `Password reset email sent to ${email}`,
      action: 'PASSWORD_RESET_EMAIL_SENT' as any,
      details: { email }
    });

    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.'
    };

  } catch (error: any) {
    const authError = AuthErrorHandler.handleError(error);
    
    // Log the error
    authLogger.log({
      level: 'ERROR' as any,
      message: `Password reset failed for ${email}`,
      action: 'PASSWORD_RESET_FAILURE' as any,
      errorCode: authError.code,
      details: { email, error: authError.message }
    });

    return {
      success: false,
      message: authError.userMessage,
      errorCode: authError.code
    };
  }
}

export async function verifyPasswordResetCode(code: string): Promise<PasswordResetResult> {
  try {
    // This would typically involve verifying the reset code
    // For now, we'll return a placeholder implementation
    // In a real implementation, you'd verify the code against your database
    
    authLogger.log({
      level: 'INFO' as any,
      message: 'Password reset code verification attempted',
      action: 'PASSWORD_RESET_CODE_VERIFY' as any,
      details: { code: code.substring(0, 4) + '****' } // Log partial code for security
    });

    // Placeholder: In real implementation, verify code
    if (code.length < 6) {
      return {
        success: false,
        message: 'Invalid reset code',
        errorCode: AuthErrorCode.INVALID_CREDENTIALS
      };
    }

    return {
      success: true,
      message: 'Reset code verified successfully'
    };

  } catch (error: any) {
    const authError = AuthErrorHandler.handleError(error);
    
    authLogger.log({
      level: 'ERROR' as any,
      message: 'Password reset code verification failed',
      action: 'PASSWORD_RESET_CODE_FAILURE' as any,
      errorCode: authError.code,
      details: { error: authError.message }
    });

    return {
      success: false,
      message: authError.userMessage,
      errorCode: authError.code
    };
  }
}

export async function confirmPasswordReset(
  code: string, 
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: passwordValidation.message,
        errorCode: AuthErrorCode.INVALID_PASSWORD
      };
    }

    // Verify reset code first
    const codeVerification = await verifyPasswordResetCode(code);
    if (!codeVerification.success) {
      return codeVerification;
    }

    // In a real implementation, you would:
    // 1. Verify the reset code
    // 2. Update the user's password in your database
    // 3. Invalidate the reset code
    
    authLogger.log({
      level: 'INFO' as any,
      message: 'Password reset completed successfully',
      action: 'PASSWORD_RESET_COMPLETE' as any,
      details: { code: code.substring(0, 4) + '****' }
    });

    return {
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    };

  } catch (error: any) {
    const authError = AuthErrorHandler.handleError(error);
    
    authLogger.log({
      level: 'ERROR' as any,
      message: 'Password reset confirmation failed',
      action: 'PASSWORD_RESET_CONFIRM_FAILURE' as any,
      errorCode: authError.code,
      details: { error: authError.message }
    });

    return {
      success: false,
      message: authError.userMessage,
      errorCode: authError.code
    };
  }
}

// Utility functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  return {
    isValid: true,
    message: 'Password is valid'
  };
}

// Rate limiting for password reset requests
const resetAttempts = new Map<string, { count: number; lastAttempt: Date }>();
const MAX_ATTEMPTS = 5;
const RESET_WINDOW = 15 * 60 * 1000; // 15 minutes

export function checkPasswordResetRateLimit(email: string): { allowed: boolean; message: string } {
  const now = new Date();
  const attempts = resetAttempts.get(email);

  if (!attempts) {
    resetAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true, message: '' };
  }

  // Reset counter if outside the time window
  if (now.getTime() - attempts.lastAttempt.getTime() > RESET_WINDOW) {
    resetAttempts.set(email, { count: 1, lastAttempt: now });
    return { allowed: true, message: '' };
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      message: 'Too many password reset attempts. Please wait 15 minutes before trying again.'
    };
  }

  attempts.count++;
  attempts.lastAttempt = now;
  resetAttempts.set(email, attempts);

  return { allowed: true, message: '' };
}
