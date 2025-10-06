/**
 * Format Firestore Timestamp for display
 * Handles both Firestore Timestamp objects and serialized timestamps
 */
export function formatTimestamp(
  timestamp: any,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  if (!timestamp) return 'N/A';
  
  let date: Date;
  
  // Handle Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Firestore Timestamp serialized as object with seconds
  else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // Handle ISO string or timestamp number
  else {
    date = new Date(timestamp);
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format timestamp as relative time (e.g., "5 minutes ago", "2 hours ago")
 */
export function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return 'N/A';
  
  let date: Date;
  
  // Handle Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Firestore Timestamp serialized as object with seconds
  else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // Handle ISO string or timestamp number
  else {
    date = new Date(timestamp);
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return formatTimestamp(timestamp, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

/**
 * Convert any timestamp format to a valid Date object
 */
export function toDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  let date: Date;
  
  // Handle Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Firestore Timestamp serialized as object with seconds
  else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // Handle ISO string or timestamp number
  else {
    date = new Date(timestamp);
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

