import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Collections } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { prepareUpdateData, prepareCreateData } from '@/utils/firestore-helpers';

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
  // Create user in Firebase Auth only (for OAuth users)
  static async createUserInFirebaseAuth(userData: {
    uid?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
  }) {
    try {
      console.log('🔄 Creating user in Firebase Auth:', {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName
      });

      // First, check if user already exists by email
      try {
        const existingUser = await adminAuth.getUserByEmail(userData.email);
        console.log('✅ User already exists in Firebase Auth by email:', existingUser.uid);
        return { uid: existingUser.uid, email: existingUser.email };
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
          console.error('❌ Error checking user by email:', error);
          throw error;
        }
      }

      // If providing UID, check if that specific UID exists
      if (userData.uid) {
        try {
          const existingUser = await adminAuth.getUser(userData.uid);
          console.log('✅ User already exists in Firebase Auth by UID:', existingUser.uid);
          return { uid: existingUser.uid, email: existingUser.email };
        } catch (error: any) {
          if (error.code !== 'auth/user-not-found') {
            console.error('❌ Error checking user by UID:', error);
            throw error;
          }
        }
      }

      // Create user in Firebase Auth
      const createUserData: any = {
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        emailVerified: userData.emailVerified || false
      };

      // Only include UID if provided and it's a valid Firebase UID format
      if (userData.uid && userData.uid.length >= 10) {
        createUserData.uid = userData.uid;
      }

      const userRecord = await adminAuth.createUser(createUserData);

      console.log('✅ User created in Firebase Auth:', {
        uid: userRecord.uid,
        email: userRecord.email,
        providedUid: userData.uid,
        actualUid: userRecord.uid
      });
      
      return { uid: userRecord.uid, email: userRecord.email };
    } catch (error: any) {
      console.error('❌ Error creating user in Firebase Auth:', {
        error: error.message,
        code: error.code,
        email: userData.email,
        uid: userData.uid
      });
      throw error;
    }
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
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
        updatedAt: Timestamp.now()
      });

      // Set custom claims for role-based access
      await adminAuth.setCustomUserClaims(uid, { role });

      return { uid, role };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Update user password
  static async updateUserPassword(uid: string, password: string) {
    try {
      await adminAuth.updateUser(uid, {
        password: password
      });

      console.log('✅ Password updated for user:', uid);
      return { uid };
    } catch (error) {
      console.error('Error updating user password:', error);
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
        updatedAt: Timestamp.now()
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
            batch.set(docRef, { ...op.data, updatedAt: Timestamp.now() });
            break;
          case 'update':
            batch.update(docRef, { ...op.data, updatedAt: Timestamp.now() });
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

      // Apply filters (skip undefined/null values)
      filters.forEach(filter => {
        if (filter.value === undefined || filter.value === null) {
          console.warn(`Skipping filter with undefined/null value for field: ${filter.field}`);
          return;
        }
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

  // Alias for getDocument to match DashboardSummaryService expectations
  static async getById(collection: string, docId: string) {
    return this.getDocument(collection, docId);
  }

  // Create a new document
  static async createDocument(collection: string, data: any, transaction?: FirebaseFirestore.Transaction) {
    try {
      console.log(`🔍 Creating document in collection: ${collection}`);
      console.log(`📊 Data to create:`, JSON.stringify(data, null, 2));
      
      const collectionRef = adminDb.collection(collection);
      
      if (transaction) {
        // In transaction, we need to generate an ID first
        const docRef = collectionRef.doc();
        const docData = prepareCreateData(data);
        console.log(`📝 Prepared data for transaction:`, JSON.stringify(docData, null, 2));
        transaction.set(docRef, docData);
        return { id: docRef.id, ...data };
      } else {
        // Ensure collection exists by checking if it has any documents
        const existingDocs = await collectionRef.limit(1).get();
        
        // If collection is empty, add a temporary initialization document
        if (existingDocs.empty && collection === Collections.ACTIVITIES) {
          console.log(`Initializing ${collection} collection...`);
          const initDocData = {
            type: 'system_event',
            title: `${collection} Collection Initialized`,
            description: `The ${collection} collection has been initialized`,
            priority: 'low',
            status: 'active',
            actorId: 'system',
            metadata: { initialization: true }
          };
          const initDoc = prepareCreateData(initDocData);
          
          // Add initialization document
          await collectionRef.add(initDoc);
          console.log(`${collection} collection initialized successfully`);
        }
        
        const docData = prepareCreateData(data);
        console.log(`📝 Prepared data for creation:`, JSON.stringify(docData, null, 2));
        
        const docRef = await collectionRef.add(docData);
        console.log(`✅ Document created with ID: ${docRef.id}`);
        
        // Verify the document was created by reading it back
        const createdDoc = await docRef.get();
        if (createdDoc.exists) {
          console.log(`✅ Document verified in database:`, createdDoc.data());
        } else {
          console.error(`❌ Document was not found after creation`);
        }
        
        return { id: docRef.id, ...data };
      }
    } catch (error) {
      console.error('❌ Error creating document:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error && 'code' in error ? (error as any).code : 'unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  // Update a document
  static async updateDocument(collection: string, docId: string, data: any, transaction?: FirebaseFirestore.Transaction) {
    try {
      const docRef = adminDb.collection(collection).doc(docId);
      
      const cleanData = prepareUpdateData(data);
      
      if (transaction) {
        transaction.update(docRef, cleanData);
        return { id: docId, ...cleanData };
      } else {
        await docRef.update(cleanData);
        return { id: docId, ...cleanData };
      }
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete a document
  static async deleteDocument(collection: string, docId: string, transaction?: FirebaseFirestore.Transaction) {
    try {
      const docRef = adminDb.collection(collection).doc(docId);
      
      if (transaction) {
        transaction.delete(docRef);
        return { id: docId };
      } else {
        await docRef.delete();
        return { id: docId };
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Run a transaction
  static async runTransaction<T>(
    updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
  ): Promise<T> {
    try {
      return await adminDb.runTransaction(updateFunction);
    } catch (error) {
      console.error('Error running transaction:', error);
      throw error;
    }
  }
}
