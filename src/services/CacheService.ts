interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static defaultTTL = 5 * 60 * 1000; // 5 minutes
  private static maxSize = 1000;

  static async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  static set<T>(key: string, value: T, ttl?: number): void {
    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  static getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  // Cache key generators
  static generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  static productKey(id: string): string {
    return this.generateKey('product', id);
  }

  static userKey(id: string): string {
    return this.generateKey('user', id);
  }

  static categoryKey(id: string): string {
    return this.generateKey('category', id);
  }

  static productsListKey(filters: Record<string, any>): string {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return this.generateKey('products', 'list', filterString);
  }

  static categoriesListKey(): string {
    return this.generateKey('categories', 'list');
  }
}
