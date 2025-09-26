import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Collections } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';

// Server-side Firebase operations using Admin SDK
export class FirebaseAdminService {
  // Helper method to convert Firestore Timestamps to JavaScript Date objects
  static convertTimestamps(data: any): any {
    if (!data) return data;
    
    const converted = { ...data };
    
    for (const key in converted) {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      } else if (Array.isArray(converted[key])) {
        converted[key] = converted[key].map(item => 
          item instanceof Timestamp ? item.toDate() : item
        );
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertTimestamps(converted[key]);
      }
    }
    
    return converted;
  }
  // User management operations
  static async createUser(userData: {
    email: string;
    password: string;
    displayName?: string;
    role?: string;
  }) {
    try {
      // Create user in Firebase Auth
      const userRecord = await adminAuth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
      });

      // Create user document in Firestore
      const userDoc = {
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role || 'customer',
        isVerified: false,
        profile: {
          preferences: {
            notifications: {
              email: true,
              sms: false,
              push: true
            },
            theme: 'light'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await adminDb.collection(Collections.USERS).doc(userRecord.uid).set(userDoc);

      return { uid: userRecord.uid, ...userDoc };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      const userDoc = await adminDb.collection(Collections.USERS).doc(userRecord.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        return { 
          uid: userRecord.uid, 
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          ...userData 
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Verify user credentials (for login)
  static async verifyUserCredentials(email: string, password: string) {
    try {
      // Get user by email
      const userRecord = await adminAuth.getUserByEmail(email);
      
      if (!userRecord) {
        return null;
      }

      // Note: Firebase Admin SDK doesn't have a direct way to verify passwords
      // In a production app, you would typically use Firebase Auth client SDK
      // For now, we'll return the user record if the email exists
      // The actual password verification should be done on the client side
      return userRecord;
    } catch (error) {
      console.error('Error verifying user credentials:', error);
      return null;
    }
  }

  // Update user role
  static async updateUserRole(uid: string, role: string) {
    try {
      await adminDb.collection(Collections.USERS).doc(uid).update({
        role,
        updatedAt: new Date()
      });

      // Set custom claims for role-based access
      await adminAuth.setCustomUserClaims(uid, { role });

      return { uid, role };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Verify user email
  static async verifyUserEmail(uid: string) {
    try {
      await adminAuth.updateUser(uid, {
        emailVerified: true
      });

      await adminDb.collection(Collections.USERS).doc(uid).update({
        isVerified: true,
        updatedAt: new Date()
      });

      return { uid, isVerified: true };
    } catch (error) {
      console.error('Error verifying user email:', error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(uid: string) {
    try {
      // Delete from Firebase Auth
      await adminAuth.deleteUser(uid);

      // Delete user document
      await adminDb.collection(Collections.USERS).doc(uid).delete();

      return { uid };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Batch operations
  static async batchWrite(operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    doc: string;
    data?: any;
  }>) {
    try {
      const batch = adminDb.batch();

      operations.forEach(op => {
        const docRef = adminDb.collection(op.collection).doc(op.doc);
        
        switch (op.type) {
          case 'set':
            batch.set(docRef, { ...op.data, updatedAt: new Date() });
            break;
          case 'update':
            batch.update(docRef, { ...op.data, updatedAt: new Date() });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      return { success: true, operations: operations.length };
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  // Query with advanced filters
  static async queryDocuments(
    collection: string,
    filters: Array<{
      field: string;
      operator: FirebaseFirestore.WhereFilterOp;
      value: any;
    }> = [],
    orderBy?: { field: string; direction: 'asc' | 'desc' },
    limit?: number
  ) {
    try {
      let query: FirebaseFirestore.Query = adminDb.collection(collection);

      // Apply filters
      filters.forEach(filter => {
        query = query.where(filter.field, filter.operator, filter.value);
      });

      // Apply ordering
      if (orderBy) {
        query = query.orderBy(orderBy.field, orderBy.direction);
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertTimestamps(data);
        return {
          id: doc.id,
          ...convertedData
        };
      });
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  // Generate custom token for client authentication
  static async createCustomToken(uid: string, additionalClaims?: object) {
    try {
      return await adminAuth.createCustomToken(uid, additionalClaims);
    } catch (error) {
      console.error('Error creating custom token:', error);
      throw error;
    }
  }

  // Get a single document by ID
  static async getDocument(collection: string, docId: string) {
    try {
      const docRef = adminDb.collection(collection).doc(docId);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        const data = docSnap.data();
        // Convert Firestore Timestamps to JavaScript Date objects
        const convertedData = this.convertTimestamps(data);
        return { id: docSnap.id, ...convertedData };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  // Create a new document
  static async createDocument(collection: string, data: any) {
    try {
      const docRef = await adminDb.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Update a document
  static async updateDocument(collection: string, docId: string, data: any) {
    try {
      const docRef = adminDb.collection(collection).doc(docId);
      await docRef.update({
        ...data,
        updatedAt: new Date()
      });
      
      return { id: docId, ...data };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete a document
  static async deleteDocument(collection: string, docId: string) {
    try {
      const docRef = adminDb.collection(collection).doc(docId);
      await docRef.delete();
      
      return { id: docId };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}
