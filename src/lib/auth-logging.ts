// lib/auth-logging.ts - Comprehensive Authentication Logging
import { AuthErrorCode } from './auth-errors';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface AuthLogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: AuthAction;
  details?: any;
  errorCode?: AuthErrorCode;
  ipAddress?: string;
  userAgent?: string;
}

export enum AuthAction {
  // Authentication Actions
  SIGN_IN_ATTEMPT = 'SIGN_IN_ATTEMPT',
  SIGN_IN_SUCCESS = 'SIGN_IN_SUCCESS',
  SIGN_IN_FAILURE = 'SIGN_IN_FAILURE',
  SIGN_OUT = 'SIGN_OUT',
  
  // Registration Actions
  REGISTER_ATTEMPT = 'REGISTER_ATTEMPT',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  REGISTER_FAILURE = 'REGISTER_FAILURE',
  
  // Session Actions
  SESSION_CREATE = 'SESSION_CREATE',
  SESSION_REFRESH = 'SESSION_REFRESH',
  SESSION_EXPIRE = 'SESSION_EXPIRE',
  SESSION_INVALIDATE = 'SESSION_INVALIDATE',
  
  // Provider Actions
  GOOGLE_AUTH_START = 'GOOGLE_AUTH_START',
  GOOGLE_AUTH_SUCCESS = 'GOOGLE_AUTH_SUCCESS',
  GOOGLE_AUTH_FAILURE = 'GOOGLE_AUTH_FAILURE',
  
  // Security Actions
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // System Actions
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

class AuthLogger {
  private static instance: AuthLogger;
  private logs: AuthLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  log(entry: Omit<AuthLogEntry, 'timestamp'>): void {
    const logEntry: AuthLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    // Add to memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging based on environment
    this.consoleLog(logEntry);

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(logEntry);
    }
  }

  private consoleLog(entry: AuthLogEntry): void {
    const emoji = this.getEmoji(entry.level);
    const prefix = `${emoji} [${entry.level}] ${entry.action}`;
    
    if (entry.level === LogLevel.ERROR) {
      console.error(prefix, entry.message, entry.details);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(prefix, entry.message, entry.details);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(prefix, entry.message, entry.details);
    }
  }

  private getEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌'
    };
    return emojis[level];
  }

  private sendToExternalService(entry: AuthLogEntry): void {
    // In production, implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
  }

  // Convenience methods for common log scenarios
  signInAttempt(email: string, provider: string, details?: any): void {
    this.log({
      level: LogLevel.INFO,
      message: `Sign in attempt for ${email} via ${provider}`,
      action: AuthAction.SIGN_IN_ATTEMPT,
      details: { email, provider, ...details }
    });
  }

  signInSuccess(userId: string, email: string, provider: string): void {
    this.log({
      level: LogLevel.INFO,
      message: `Successful sign in for ${email} via ${provider}`,
      action: AuthAction.SIGN_IN_SUCCESS,
      userId,
      details: { email, provider }
    });
  }

  signInFailure(email: string, provider: string, errorCode: AuthErrorCode, details?: any): void {
    this.log({
      level: LogLevel.WARN,
      message: `Failed sign in attempt for ${email} via ${provider}`,
      action: AuthAction.SIGN_IN_FAILURE,
      errorCode,
      details: { email, provider, ...details }
    });
  }

  signOut(userId: string, email: string): void {
    this.log({
      level: LogLevel.INFO,
      message: `User signed out: ${email}`,
      action: AuthAction.SIGN_OUT,
      userId,
      details: { email }
    });
  }

  sessionCreate(userId: string, sessionId: string): void {
    this.log({
      level: LogLevel.DEBUG,
      message: `Session created for user ${userId}`,
      action: AuthAction.SESSION_CREATE,
      userId,
      sessionId,
      details: { userId, sessionId }
    });
  }

  sessionExpire(userId: string, sessionId: string): void {
    this.log({
      level: LogLevel.INFO,
      message: `Session expired for user ${userId}`,
      action: AuthAction.SESSION_EXPIRE,
      userId,
      sessionId,
      details: { userId, sessionId }
    });
  }

  suspiciousActivity(userId: string, activity: string, details?: any): void {
    this.log({
      level: LogLevel.WARN,
      message: `Suspicious activity detected: ${activity}`,
      action: AuthAction.SUSPICIOUS_ACTIVITY,
      userId,
      details: { activity, ...details }
    });
  }

  permissionDenied(userId: string, resource: string, action: string): void {
    this.log({
      level: LogLevel.WARN,
      message: `Permission denied: ${userId} attempted ${action} on ${resource}`,
      action: AuthAction.PERMISSION_DENIED,
      userId,
      details: { resource, action }
    });
  }

  systemError(error: Error, context: string): void {
    this.log({
      level: LogLevel.ERROR,
      message: `System error in ${context}: ${error.message}`,
      action: AuthAction.SYSTEM_ERROR,
      details: { error: error.message, stack: error.stack, context }
    });
  }

  // Get logs for debugging
  getLogs(filter?: Partial<AuthLogEntry>): AuthLogEntry[] {
    if (!filter) return [...this.logs];
    
    return this.logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => 
        log[key as keyof AuthLogEntry] === value
      );
    });
  }

  // Clear logs (useful for testing)
  clearLogs(): void {
    this.logs = [];
  }
}

// Export singleton instance
export const authLogger = AuthLogger.getInstance();

// Export convenience functions
export function logSignInAttempt(email: string, provider: string, details?: any): void {
  authLogger.signInAttempt(email, provider, details);
}

export function logSignInSuccess(userId: string, email: string, provider: string): void {
  authLogger.signInSuccess(userId, email, provider);
}

export function logSignInFailure(email: string, provider: string, errorCode: AuthErrorCode, details?: any): void {
  authLogger.signInFailure(email, provider, errorCode, details);
}

export function logSignOut(userId: string, email: string): void {
  authLogger.signOut(userId, email);
}

export function logSuspiciousActivity(userId: string, activity: string, details?: any): void {
  authLogger.suspiciousActivity(userId, activity, details);
}

export function logPermissionDenied(userId: string, resource: string, action: string): void {
  authLogger.permissionDenied(userId, resource, action);
}

export function logSystemError(error: Error, context: string): void {
  authLogger.systemError(error, context);
}
