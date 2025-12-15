// utils/debug.tsx - Debug utilities for development-only code
/**
 * Debug utilities that only run in development builds
 * All debug code is automatically stripped in production builds
 */

import React from 'react';

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Debug logger that only logs in development
 */
export const debugLog = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error('[DEBUG ERROR]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[DEBUG WARN]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[DEBUG INFO]', ...args);
    }
  },
  
  table: (data: unknown) => {
    if (isDevelopment) {
      console.table(data);
    }
  },
  
  group: (label: string) => {
    if (isDevelopment) {
      console.group(`[DEBUG] ${label}`);
    }
  },
  
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
  
  time: (label: string) => {
    if (isDevelopment) {
      console.time(`[DEBUG] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(`[DEBUG] ${label}`);
    }
  }
};

/**
 * Execute a function only in development
 */
export function debugOnly<T>(fn: () => T): T | undefined {
  if (isDevelopment) {
    return fn();
  }
  return undefined;
}

/**
 * Execute a function only in development, with fallback for production
 */
export function debugOnlyWithFallback<T>(
  debugFn: () => T,
  fallback: T
): T {
  if (isDevelopment) {
    return debugFn();
  }
  return fallback;
}

/**
 * Conditional debug component wrapper
 */
export function DebugWrapper({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (isDevelopment) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

/**
 * Debug page component that only renders in development
 */
export function DebugPage({ 
  children, 
  title = "Debug Page" 
}: { 
  children: React.ReactNode;
  title?: string;
}) {
  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Page Not Available</h1>
          <p className="text-gray-500">This debug page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Debug Mode:</strong> This page is only visible in development.
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">{title}</h1>
        {children}
      </div>
    </div>
  );
}

/**
 * Performance timing utility for development
 */
export class DebugTimer {
  private timers: Map<string, number> = new Map();

  start(label: string): void {
    if (isDevelopment) {
      this.timers.set(label, performance.now());
      debugLog.log(`Timer started: ${label}`);
    }
  }

  end(label: string): number | undefined {
    if (isDevelopment) {
      const startTime = this.timers.get(label);
      if (startTime !== undefined) {
        const duration = performance.now() - startTime;
        debugLog.log(`Timer ended: ${label} - ${duration.toFixed(2)}ms`);
        this.timers.delete(label);
        return duration;
      }
    }
    return undefined;
  }

  measure<T>(label: string, fn: () => T): T {
    if (isDevelopment) {
      this.start(label);
      const result = fn();
      this.end(label);
      return result;
    }
    return fn();
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (isDevelopment) {
      this.start(label);
      const result = await fn();
      this.end(label);
      return result;
    }
    return fn();
  }
}

export const debugTimer = new DebugTimer();

/**
 * Debug data inspector
 */
export function debugInspect(data: unknown, label?: string): void {
  if (isDevelopment) {
    const prefix = label ? `[DEBUG INSPECT] ${label}:` : '[DEBUG INSPECT]:';
    console.group(prefix);
    console.log('Type:', typeof data);
    console.log('Value:', data);
    if (typeof data === 'object' && data !== null) {
      console.log('Keys:', Object.keys(data));
      console.log('JSON:', JSON.stringify(data, null, 2));
    }
    console.groupEnd();
  }
}

/**
 * Debug API response logger
 */
export function debugApiResponse(
  endpoint: string, 
  method: string, 
  response: unknown, 
  error?: unknown
): void {
  if (isDevelopment) {
    debugLog.group(`API ${method.toUpperCase()} ${endpoint}`);
    if (error) {
      debugLog.error('Error:', error);
    } else {
      debugLog.log('Response:', response);
    }
    debugLog.groupEnd();
  }
}

/**
 * Debug form state logger
 */
export function debugFormState(formName: string, state: Record<string, unknown>): void {
  if (isDevelopment) {
    debugLog.group(`Form State: ${formName}`);
    debugLog.log('State:', state);
    debugLog.log('Dirty fields:', Object.keys(state).filter(key => 
      state[key] !== undefined && state[key] !== ''
    ));
    debugLog.groupEnd();
  }
}

/**
 * Debug navigation logger
 */
export function debugNavigation(from: string, to: string, params?: Record<string, unknown>): void {
  if (isDevelopment) {
    debugLog.log(`Navigation: ${from} → ${to}`, params);
  }
}

/**
 * Debug user action logger
 */
export function debugUserAction(action: string, details?: unknown): void {
  if (isDevelopment) {
    debugLog.log(`User Action: ${action}`, details);
  }
}

/**
 * Debug component lifecycle logger
 */
export function debugComponentLifecycle(componentName: string, phase: string, props?: Record<string, unknown>): void {
  if (isDevelopment) {
    debugLog.log(`Component ${componentName}: ${phase}`, props);
  }
}

/**
 * Debug hook logger
 */
export function debugHook(hookName: string, state: unknown, dependencies?: unknown[]): void {
  if (isDevelopment) {
    debugLog.group(`Hook: ${hookName}`);
    debugLog.log('State:', state);
    if (dependencies) {
      debugLog.log('Dependencies:', dependencies);
    }
    debugLog.groupEnd();
  }
}

/**
 * Debug error boundary logger
 */
export function debugErrorBoundary(error: Error, errorInfo: unknown, componentStack?: string): void {
  if (isDevelopment) {
    debugLog.error('Error Boundary Caught:', error);
    debugLog.error('Error Info:', errorInfo);
    if (componentStack) {
      debugLog.error('Component Stack:', componentStack);
    }
  }
}

/**
 * Debug network request logger
 */
export function debugNetworkRequest(
  url: string, 
  method: string, 
  requestData?: unknown, 
  responseData?: unknown, 
  error?: unknown
): void {
  if (isDevelopment) {
    debugLog.group(`Network ${method.toUpperCase()} ${url}`);
    if (requestData) {
      debugLog.log('Request:', requestData);
    }
    if (responseData) {
      debugLog.log('Response:', responseData);
    }
    if (error) {
      debugLog.error('Error:', error);
    }
    debugLog.groupEnd();
  }
}

/**
 * Debug localStorage/sessionStorage logger
 */
export function debugStorage(operation: 'get' | 'set' | 'remove', key: string, value?: unknown): void {
  if (isDevelopment) {
    debugLog.log(`Storage ${operation}: ${key}`, value);
  }
}

/**
 * Debug authentication state logger
 */
export function debugAuthState(user: unknown, session: unknown, status: string): void {
  if (isDevelopment) {
    debugLog.group('Auth State');
    debugLog.log('Status:', status);
    debugLog.log('User:', user);
    debugLog.log('Session:', session);
    debugLog.groupEnd();
  }
}

/**
 * Debug database operation logger
 */
export function debugDatabaseOperation(
  operation: string, 
  collection: string, 
  data?: unknown, 
  error?: unknown
): void {
  if (isDevelopment) {
    debugLog.group(`Database ${operation}: ${collection}`);
    if (data) {
      debugLog.log('Data:', data);
    }
    if (error) {
      debugLog.error('Error:', error);
    }
    debugLog.groupEnd();
  }
}

/**
 * Debug performance monitor
 */
export function debugPerformance(label: string, fn: () => void): void {
  if (isDevelopment) {
    const start = performance.now();
    fn();
    const end = performance.now();
    debugLog.log(`Performance ${label}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
}

/**
 * Debug memory usage logger
 */
export function debugMemoryUsage(label?: string): void {
  if (isDevelopment && 'memory' in performance) {
    const memory = (performance as any).memory;
    debugLog.log(`Memory Usage ${label || ''}:`, {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    });
  }
}

// Export all debug utilities as a single object for convenience
export const debug = {
  log: debugLog,
  only: debugOnly,
  onlyWithFallback: debugOnlyWithFallback,
  wrapper: DebugWrapper,
  page: DebugPage,
  timer: debugTimer,
  inspect: debugInspect,
  api: debugApiResponse,
  form: debugFormState,
  navigation: debugNavigation,
  userAction: debugUserAction,
  component: debugComponentLifecycle,
  hook: debugHook,
  errorBoundary: debugErrorBoundary,
  network: debugNetworkRequest,
  storage: debugStorage,
  auth: debugAuthState,
  database: debugDatabaseOperation,
  performance: debugPerformance,
  memory: debugMemoryUsage,
  isDevelopment,
  isProduction
};

export default debug;
