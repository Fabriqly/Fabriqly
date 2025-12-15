import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * Utility functions for safely working with Firestore documents
 */

/**
 * Validate and clean a Firestore field name
 * Firestore field paths cannot be empty and should only contain valid characters
 */
function validateFieldName(key: string): string | null {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return null; // Empty or invalid key
  }
  
  // Remove leading dots (Firestore doesn't allow paths starting with dots)
  let validKey = key.trim().replace(/^\.+/, '');
  
  // Replace invalid characters with underscores
  // Firestore field names can contain letters, numbers, and underscores
  // But we'll be more permissive and allow common characters, just sanitize problematic ones
  validKey = validKey.replace(/[^\w\-\.]/g, '_');
  
  // Ensure the key is not empty after cleaning
  if (validKey.length === 0) {
    return null;
  }
  
  return validKey;
}

/**
 * Clean object by removing undefined values and handling special Firestore operations
 */
export function cleanFirestoreData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays separately
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => {
        // Recursively clean objects within arrays
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return cleanFirestoreData(item);
        }
        return item;
      });
  }

  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) {
      continue;
    }
    
    // Validate and clean the field name
    const validKey = validateFieldName(key);
    if (!validKey) {
      console.warn(`Skipping invalid field name: "${key}"`);
      continue; // Skip invalid field names
    }
    
    // Handle special Firestore field delete operations
    if (value === FieldValue.delete) {
      cleaned[validKey] = FieldValue.delete();
    } 
    // Handle nested objects recursively
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedCleaned = cleanFirestoreData(value);
      // Only include nested object if it has properties after cleaning
      if (Object.keys(nestedCleaned).length > 0) {
        cleaned[validKey] = nestedCleaned;
      }
    } 
    // Handle arrays
    else if (Array.isArray(value)) {
      const cleanedArray = cleanFirestoreData(value);
      if (cleanedArray.length > 0) {
        cleaned[validKey] = cleanedArray;
      }
    } 
    // Handle all other values (strings, numbers, booleans, etc.)
    else {
      // Skip empty strings for optional fields (but allow them for required fields)
      // For now, we'll include all non-undefined values
      cleaned[validKey] = value;
    }
  }

  return cleaned;
}

/**
 * Prepare data for Firestore update operations
 * Automatically adds updatedAt timestamp and cleans undefined values
 */
export function prepareUpdateData(data: any): any {
  const cleaned = cleanFirestoreData(data);
  
  return {
    ...cleaned,
    updatedAt: Timestamp.now()
  };
}

/**
 * Prepare data for Firestore create operations
 * Automatically adds createdAt and updatedAt timestamps
 */
export function prepareCreateData(data: any): any {
  const cleaned = cleanFirestoreData(data);
  
  return {
    ...cleaned,
    timestamp: Timestamp.now().toString(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
}

/**
 * Safe field deletion for Firestore updates
 * Use this when you want to remove a field from a document
 */
export function deleteField() {
  return FieldValue.delete();
}

/**
 * Check if a value should be omitted from Firestore operations
 */
export function shouldOmitValue(value: any): boolean {
  return value === undefined || value === null;
}

/**
 * Merge objects for Firestore updates, removing undefined values
 */
export function mergeFirestoreData(...objects: any[]): any {
  let merged: any = {};
  
  for (const obj of objects) {
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (!shouldOmitValue(value)) {
          merged[key] = value;
        }
      }
    }
  }
  
  return merged;
}
