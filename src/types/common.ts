/**
 * Common type utilities for the application
 * These types help avoid using 'any' throughout the codebase
 */

/**
 * Generic record type for objects with unknown values
 */
export type UnknownRecord = Record<string, unknown>;

/**
 * Error handler callback type
 */
export type ErrorHandler = (error: Error | unknown) => void;

/**
 * Database query result type
 */
export type DatabaseResult<T = unknown> = T | null;

/**
 * Generic callback type for database operations
 */
export type DatabaseCallback<T> = (err: Error | null, data: T | null) => void;

/**
 * Generic function type that accepts unknown parameters
 */
export type GenericFunction = (...args: unknown[]) => unknown;

/**
 * Type for JSON-serializable values
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Type for database row results (from MySQL queries)
 */
export type DatabaseRow = Record<string, unknown>;

/**
 * Type for array of database rows
 */
export type DatabaseRows = DatabaseRow[];

