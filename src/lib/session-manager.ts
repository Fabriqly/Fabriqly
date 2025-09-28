// lib/session-manager.ts - Enhanced Session Management with Refresh
'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthErrorCode } from './auth-errors';
import { authLogger, AuthAction } from './auth-logging';

interface SessionManagerOptions {
  refreshThreshold?: number; // Minutes before expiry to refresh
  maxRefreshAttempts?: number;
  onSessionExpired?: () => void;
  onRefreshFailed?: (error: any) => void;
}

export function useSessionManager(options: SessionManagerOptions = {}) {
  const {
    refreshThreshold = 5, // Refresh 5 minutes before expiry
    maxRefreshAttempts = 3,
    onSessionExpired,
    onRefreshFailed
  } = options;

  const { data: session, status, update } = useSession();
  const refreshAttempts = useRef(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  const scheduleRefresh = useCallback(() => {
    if (!session?.expires) return;

    const expiryTime = new Date(session.expires).getTime();
    const refreshTime = expiryTime - (refreshThreshold * 60 * 1000);
    const now = Date.now();

    if (refreshTime <= now) {
      // Session expires soon, refresh immediately
      refreshSession();
    } else {
      // Schedule refresh
      const timeUntilRefresh = refreshTime - now;
      refreshTimeoutRef.current = setTimeout(() => {
        refreshSession();
      }, timeUntilRefresh);
    }
  }, [session?.expires, refreshThreshold]);

  const refreshSession = useCallback(async () => {
    if (refreshAttempts.current >= maxRefreshAttempts) {
      authLogger.log({
        level: 'ERROR' as any,
        message: 'Max refresh attempts exceeded',
        action: AuthAction.SESSION_EXPIRE,
        userId: session?.user?.id,
        details: { attempts: refreshAttempts.current }
      });
      
      if (onRefreshFailed) {
        onRefreshFailed(new Error('Max refresh attempts exceeded'));
      }
      return;
    }

    try {
      refreshAttempts.current++;
      
      authLogger.log({
        level: 'INFO' as any,
        message: 'Attempting session refresh',
        action: AuthAction.SESSION_REFRESH,
        userId: session?.user?.id,
        details: { attempt: refreshAttempts.current }
      });

      await update();
      refreshAttempts.current = 0; // Reset on success
      
      authLogger.log({
        level: 'INFO' as any,
        message: 'Session refresh successful',
        action: AuthAction.SESSION_REFRESH,
        userId: session?.user?.id
      });

    } catch (error) {
      authLogger.log({
        level: 'ERROR' as any,
        message: 'Session refresh failed',
        action: AuthAction.SESSION_REFRESH,
        userId: session?.user?.id,
        details: { error: error, attempt: refreshAttempts.current }
      });

      if (onRefreshFailed) {
        onRefreshFailed(error);
      }
    }
  }, [update, maxRefreshAttempts, session?.user?.id, onRefreshFailed]);

  const invalidateSession = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    authLogger.log({
      level: 'INFO' as any,
      message: 'Session invalidated',
      action: AuthAction.SESSION_INVALIDATE,
      userId: session?.user?.id
    });
  }, [session?.user?.id]);

  // Handle session expiry
  useEffect(() => {
    if (status === 'unauthenticated' && session === null) {
      authLogger.log({
        level: 'INFO' as any,
        message: 'Session expired',
        action: AuthAction.SESSION_EXPIRE
      });
      
      if (onSessionExpired) {
        onSessionExpired();
      }
    }
  }, [status, session, onSessionExpired]);

  // Schedule refresh when session changes
  useEffect(() => {
    if (session?.expires) {
      scheduleRefresh();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [session?.expires, scheduleRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    session,
    status,
    refreshSession,
    invalidateSession,
    isRefreshing: refreshAttempts.current > 0,
    refreshAttempts: refreshAttempts.current
  };
}

// Hook for session persistence across page reloads
export function useSessionPersistence() {
  const { data: session, status } = useSession();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Prevent hydration mismatch by not rendering auth-dependent content until hydrated
  if (!isHydrated) {
    return {
      session: null,
      status: 'loading' as const,
      isHydrated: false
    };
  }

  return {
    session,
    status,
    isHydrated: true
  };
}

// Utility function to check if session is about to expire
export function isSessionExpiringSoon(session: any, thresholdMinutes: number = 5): boolean {
  if (!session?.expires) return false;
  
  const expiryTime = new Date(session.expires).getTime();
  const thresholdTime = Date.now() + (thresholdMinutes * 60 * 1000);
  
  return expiryTime <= thresholdTime;
}

// Utility function to get time until session expires
export function getTimeUntilExpiry(session: any): number {
  if (!session?.expires) return 0;
  
  const expiryTime = new Date(session.expires).getTime();
  const now = Date.now();
  
  return Math.max(0, expiryTime - now);
}
