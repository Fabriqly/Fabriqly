interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  operation: string;
  totalCalls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  lastCalled: Date;
  errors: string[];
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static maxMetrics = 1000; // Keep last 1000 metrics
  private static isEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true';

  /**
   * Measure the performance of an async operation
   */
  static async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isEnabled) {
      return fn();
    }

    const start = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - start;
      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        success,
        error,
        metadata
      });
    }
  }

  /**
   * Measure the performance of a sync operation
   */
  static measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    if (!this.isEnabled) {
      return fn();
    }

    const start = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = fn();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = Date.now() - start;
      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        success,
        error,
        metadata
      });
    }
  }

  /**
   * Record a performance metric
   */
  private static recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.duration > 1000) { // 1 second
      console.warn(`Slow operation detected: ${metric.operation} took ${metric.duration}ms`, {
        operation: metric.operation,
        duration: metric.duration,
        success: metric.success,
        error: metric.error,
        metadata: metric.metadata
      });
    }
  }

  /**
   * Get performance statistics for a specific operation
   */
  static getStats(operation: string): PerformanceStats | null {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    
    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map(m => m.duration);
    const successfulCalls = operationMetrics.filter(m => m.success);
    const errors = operationMetrics.filter(m => !m.success).map(m => m.error || 'Unknown error');

    return {
      operation,
      totalCalls: operationMetrics.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successfulCalls.length / operationMetrics.length) * 100,
      lastCalled: operationMetrics[operationMetrics.length - 1].timestamp,
      errors: Array.from(new Set(errors)) // Remove duplicates
    };
  }

  /**
   * Get performance statistics for all operations
   */
  static getAllStats(): PerformanceStats[] {
    const operations = Array.from(new Set(this.metrics.map(m => m.operation)));
    return operations
      .map(op => this.getStats(op))
      .filter((stats): stats is PerformanceStats => stats !== null)
      .sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * Get recent metrics for an operation
   */
  static getRecentMetrics(operation: string, limit: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.operation === operation)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  static getSummary(): {
    totalOperations: number;
    totalCalls: number;
    averageDuration: number;
    slowestOperation: string | null;
    mostFrequentOperation: string | null;
    errorRate: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        totalCalls: 0,
        averageDuration: 0,
        slowestOperation: null,
        mostFrequentOperation: null,
        errorRate: 0
      };
    }

    const operations = Array.from(new Set(this.metrics.map(m => m.operation)));
    const totalCalls = this.metrics.length;
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls;
    const errorCount = this.metrics.filter(m => !m.success).length;
    const errorRate = (errorCount / totalCalls) * 100;

    // Find slowest operation
    const operationAverages = operations.map(op => {
      const opMetrics = this.metrics.filter(m => m.operation === op);
      const avgDuration = opMetrics.reduce((sum, m) => sum + m.duration, 0) / opMetrics.length;
      return { operation: op, averageDuration: avgDuration };
    });

    const slowestOperation = operationAverages.reduce((prev, current) => 
      prev.averageDuration > current.averageDuration ? prev : current
    ).operation;

    // Find most frequent operation
    const operationCounts = operations.map(op => ({
      operation: op,
      count: this.metrics.filter(m => m.operation === op).length
    }));

    const mostFrequentOperation = operationCounts.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    ).operation;

    return {
      totalOperations: operations.length,
      totalCalls,
      averageDuration,
      slowestOperation,
      mostFrequentOperation,
      errorRate
    };
  }

  /**
   * Export metrics for analysis
   */
  static exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Import metrics from external source
   */
  static importMetrics(metrics: PerformanceMetric[]): void {
    this.metrics = [...metrics];
  }

  /**
   * Enable or disable performance monitoring
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if performance monitoring is enabled
   */
  static isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set maximum number of metrics to keep
   */
  static setMaxMetrics(max: number): void {
    this.maxMetrics = max;
    
    // Trim existing metrics if necessary
    if (this.metrics.length > max) {
      this.metrics = this.metrics.slice(-max);
    }
  }
}

// Decorator for automatic performance monitoring
export function MonitorPerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return PerformanceMonitor.measure(operation, () => method.apply(this, args));
    };

    return descriptor;
  };
}

// Utility function for measuring database operations
export const measureDatabaseOperation = <T>(
  operation: string,
  fn: () => Promise<T>,
  collection?: string,
  documentId?: string
): Promise<T> => {
  return PerformanceMonitor.measure(operation, fn, {
    type: 'database',
    collection,
    documentId
  });
};

// Utility function for measuring API operations
export const measureApiOperation = <T>(
  operation: string,
  fn: () => Promise<T>,
  endpoint?: string,
  method?: string
): Promise<T> => {
  return PerformanceMonitor.measure(operation, fn, {
    type: 'api',
    endpoint,
    method
  });
};

// Utility function for measuring cache operations
export const measureCacheOperation = <T>(
  operation: string,
  fn: () => Promise<T>,
  cacheKey?: string,
  hit?: boolean
): Promise<T> => {
  return PerformanceMonitor.measure(operation, fn, {
    type: 'cache',
    cacheKey,
    hit
  });
};
