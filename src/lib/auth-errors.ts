// lib/auth-errors.ts - Comprehensive Authentication Error Handling
export enum AuthErrorCode {
  // Authentication Errors
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  
  // Authorization Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED = 'ROLE_REQUIRED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // Session Errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_INVALID = 'SESSION_INVALID',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  
  // Provider Errors
  GOOGLE_AUTH_FAILED = 'GOOGLE_AUTH_FAILED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  
  // System Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Validation Errors
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  MISSING_FIELDS = 'MISSING_FIELDS',
  
  // Rate Limiting
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  RATE_LIMITED = 'RATE_LIMITED'
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

export class AuthErrorHandler {
  private static errorMessages: Record<AuthErrorCode, string> = {
    [AuthErrorCode.UNAUTHENTICATED]: 'Please sign in to continue',
    [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
    [AuthErrorCode.ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support.',
    [AuthErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in',
    
    [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action',
    [AuthErrorCode.ROLE_REQUIRED]: 'This action requires a specific role',
    [AuthErrorCode.ACCESS_DENIED]: 'Access denied',
    
    [AuthErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [AuthErrorCode.SESSION_INVALID]: 'Invalid session. Please sign in again.',
    [AuthErrorCode.TOKEN_REFRESH_FAILED]: 'Failed to refresh authentication token',
    
    [AuthErrorCode.GOOGLE_AUTH_FAILED]: 'Google authentication failed. Please try again.',
    [AuthErrorCode.PROVIDER_ERROR]: 'Authentication provider error. Please try again.',
    
    [AuthErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection.',
    [AuthErrorCode.SERVER_ERROR]: 'Server error. Please try again later.',
    [AuthErrorCode.CONFIGURATION_ERROR]: 'System configuration error. Please contact support.',
    
    [AuthErrorCode.INVALID_EMAIL]: 'Please enter a valid email address',
    [AuthErrorCode.INVALID_PASSWORD]: 'Password must be at least 8 characters long',
    [AuthErrorCode.MISSING_FIELDS]: 'Please fill in all required fields',
    
    [AuthErrorCode.TOO_MANY_ATTEMPTS]: 'Too many failed attempts. Please try again later.',
    [AuthErrorCode.RATE_LIMITED]: 'Too many requests. Please wait before trying again.'
  };

  static createError(
    code: AuthErrorCode, 
    details?: any, 
    customMessage?: string
  ): AuthError {
    return {
      code,
      message: customMessage || this.errorMessages[code],
      userMessage: this.errorMessages[code],
      details,
      timestamp: new Date(),
      retryable: this.isRetryable(code)
    };
  }

  static handleError(error: any): AuthError {
    // Handle Firebase Auth errors
    if (error?.code?.startsWith('auth/')) {
      return this.handleFirebaseError(error);
    }

    // Handle NextAuth errors
    if (error?.type) {
      return this.handleNextAuthError(error);
    }

    // Handle network errors
    if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
      return this.createError(AuthErrorCode.NETWORK_ERROR, error);
    }

    // Handle generic errors
    return this.createError(AuthErrorCode.SERVER_ERROR, error);
  }

  private static handleFirebaseError(error: any): AuthError {
    const firebaseErrorMap: Record<string, AuthErrorCode> = {
      'auth/user-not-found': AuthErrorCode.INVALID_CREDENTIALS,
      'auth/wrong-password': AuthErrorCode.INVALID_CREDENTIALS,
      'auth/invalid-email': AuthErrorCode.INVALID_EMAIL,
      'auth/user-disabled': AuthErrorCode.ACCOUNT_DISABLED,
      'auth/email-not-verified': AuthErrorCode.EMAIL_NOT_VERIFIED,
      'auth/too-many-requests': AuthErrorCode.TOO_MANY_ATTEMPTS,
      'auth/network-request-failed': AuthErrorCode.NETWORK_ERROR,
      'auth/invalid-credential': AuthErrorCode.INVALID_CREDENTIALS
    };

    const code = firebaseErrorMap[error.code] || AuthErrorCode.SERVER_ERROR;
    return this.createError(code, error);
  }

  private static handleNextAuthError(error: any): AuthError {
    const nextAuthErrorMap: Record<string, AuthErrorCode> = {
      'CredentialsSignin': AuthErrorCode.INVALID_CREDENTIALS,
      'OAuthSignin': AuthErrorCode.PROVIDER_ERROR,
      'OAuthCallback': AuthErrorCode.PROVIDER_ERROR,
      'OAuthCreateAccount': AuthErrorCode.PROVIDER_ERROR,
      'EmailCreateAccount': AuthErrorCode.SERVER_ERROR,
      'CallbackRouteError': AuthErrorCode.SERVER_ERROR,
      'Configuration': AuthErrorCode.CONFIGURATION_ERROR
    };

    const code = nextAuthErrorMap[error.type] || AuthErrorCode.SERVER_ERROR;
    return this.createError(code, error);
  }

  private static isRetryable(code: AuthErrorCode): boolean {
    const retryableErrors = [
      AuthErrorCode.NETWORK_ERROR,
      AuthErrorCode.SERVER_ERROR,
      AuthErrorCode.TOKEN_REFRESH_FAILED,
      AuthErrorCode.PROVIDER_ERROR,
      AuthErrorCode.GOOGLE_AUTH_FAILED
    ];

    return retryableErrors.includes(code);
  }

  static logError(error: AuthError, context?: string): void {
    const logData = {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      context,
      retryable: error.retryable
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Auth Error:', logData);
    } else {
      // In production, you might want to send this to a logging service
      console.error('Auth Error:', logData);
    }
  }
}

// Utility functions for common error scenarios
export function createAuthError(code: AuthErrorCode, details?: any): AuthError {
  return AuthErrorHandler.createError(code, details);
}

export function handleAuthError(error: any): AuthError {
  return AuthErrorHandler.handleError(error);
}

export function logAuthError(error: AuthError, context?: string): void {
  AuthErrorHandler.logError(error, context);
}
