// Utility functions for handling Firebase Timestamps
// This ensures consistent timestamp handling across the application

export type TimestampInput = Date | { seconds: number; nanoseconds: number } | { toDate: () => Date } | string | number;

/**
 * Converts various timestamp formats to a JavaScript Date object
 * Handles Firebase Timestamps, Date objects, and string/number timestamps
 */
export function convertToDate(timestamp: TimestampInput): Date {
  if (!timestamp) {
    return new Date();
  }

  // Handle Date objects
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Handle Firebase client-side Timestamp (has seconds and nanoseconds)
  if (typeof timestamp === 'object' && timestamp !== null) {
    if ('seconds' in timestamp && 'nanoseconds' in timestamp) {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    }
    
    // Handle Firebase Admin SDK Timestamp (has toDate method)
    if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
  }

  // Handle string or number timestamps
  const date = new Date(String(timestamp));
  
  // Validate the date
  if (isNaN(date.getTime())) {
    console.warn('Invalid timestamp provided:', timestamp);
    return new Date();
  }
  
  return date;
}

/**
 * Formats a timestamp to a relative time string (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: TimestampInput): string {
  const date = convertToDate(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Formats a timestamp to an ISO string for export/API purposes
 */
export function formatTimestampISO(timestamp: TimestampInput): string {
  const date = convertToDate(timestamp);
  return date.toISOString();
}

/**
 * Formats a timestamp to a localized date string
 */
export function formatTimestampLocal(timestamp: TimestampInput, options?: Intl.DateTimeFormatOptions): string {
  const date = convertToDate(timestamp);
  return date.toLocaleDateString(undefined, options);
}

/**
 * Formats a timestamp to a localized date and time string
 */
export function formatTimestampLocalDateTime(timestamp: TimestampInput, options?: Intl.DateTimeFormatOptions): string {
  const date = convertToDate(timestamp);
  return date.toLocaleString(undefined, options);
}

/**
 * Checks if a timestamp is valid
 */
export function isValidTimestamp(timestamp: TimestampInput): boolean {
  try {
    const date = convertToDate(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
