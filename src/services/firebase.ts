import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  DocumentData,
  CollectionReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generic CRUD operations for Firestore
export class FirebaseService {
  // Create a new document
  static async create(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
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

  // Read a single document by ID
  static async getById(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  // Read multiple documents with optional filters
  static async getMany(
    collectionName: string, 
    constraints: QueryConstraint[] = []
  ) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Update a document
  static async update(collectionName: string, id: string, data: any) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      return { id, ...data };
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete a document
  static async delete(collectionName: string, id: string) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return { id };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get documents with pagination
  static async getPaginated(
    collectionName: string,
    pageSize: number = 10,
    constraints: QueryConstraint[] = []
  ) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...constraints, limit(pageSize));
      const querySnapshot = await getDocs(q);
      
      return {
        docs: querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting paginated documents:', error);
      throw error;
    }
  }
}

// Collection-specific services
export const Collections = {
  USERS: 'users',
  
  // Enhanced Product System
  PRODUCTS: 'products',
  PRODUCT_CATEGORIES: 'productCategories',
  PRODUCT_IMAGES: 'productImages',
  PRODUCT_VARIANTS: 'productVariants',
  PRODUCT_COLORS: 'productColors',
  
  // Designer & Design System
  DESIGNER_PROFILES: 'designerProfiles',
  DESIGNS: 'designs',
  DESIGN_ANALYTICS: 'designAnalytics',
  DESIGNER_VERIFICATION_REQUESTS: 'designerVerificationRequests',
  
  // Shop System
  SHOP_PROFILES: 'shopProfiles',
  SHOPS: 'shops',
  
  // Color & Size Management
  COLORS: 'colors',
  SIZE_CHARTS: 'sizeCharts',
  
  // Analytics
  PRODUCT_ANALYTICS: 'productAnalytics',
  
  // Activity System
  ACTIVITIES: 'activities',
  
  // Dashboard Analytics
  DASHBOARD_SNAPSHOTS: 'dashboardSnapshots',
  
  // Existing Collections
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  BUSINESS_OWNERS: 'businessOwners',
  CUSTOMERS: 'customers',
  DESIGNERS: 'designers',
  
  // Cart System
  CARTS: 'carts',
  CART_ITEMS: 'cartItems',
  

  // Password Reset
  PASSWORD_RESET_TOKENS: 'passwordResetTokens',
  
  // User Likes System
  USER_LIKES: 'userLikes',

  // Designer Verification Requests
  DESIGNER_VERIFICATION_REQUESTS: 'designerVerificationRequests',
  DESIGNER_APPEALS: 'designerAppeals',
  
  // Shop Appeals
  SHOP_APPEALS: 'shopAppeals',
  
  // Customization System
  CUSTOMIZATION_REQUESTS: 'customizationRequests',
  
  // Application System
  DESIGNER_APPLICATIONS: 'designerApplications',
  SHOP_APPLICATIONS: 'shopApplications',
  
  // Notification System
  NOTIFICATIONS: 'notifications',
  
  // Promotion System
  DISCOUNTS: 'discounts',
  COUPONS: 'coupons',
  
  // Dispute System
  DISPUTES: 'disputes'

} as const;
