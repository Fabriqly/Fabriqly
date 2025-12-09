import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * Utility functions for safely working with Firestore documents
 */

/**
 * Clean object by removing undefined values and handling special Firestore operations
 */
export function cleanFirestoreData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) {
      continue;
    }
    
    // Handle special Firestore field delete operations
    if (value === FieldValue.delete) {
      cleaned[key] = FieldValue.delete();
    } 
    // Handle nested objects recursively
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedCleaned = cleanFirestoreData(value);
      // Only include nested object if it has properties after cleaning
      if (Object.keys(nestedCleaned).length > 0) {
        cleaned[key] = nestedCleaned;
      }
    } 
    // Handle arrays
    else if (Array.isArray(value)) {
      const cleanedArray = value
        .filter(item => item !== undefined)
        .map(item => {
          // Recursively clean objects within arrays
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            return cleanFirestoreData(item);
          }
          return item;
        });
      if (cleanedArray.length > 0) {
        cleaned[key] = cleanedArray;
      }
    } 
    // Handle all other values (strings, numbers, booleans, etc.)
    else {
      cleaned[key] = value;
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
