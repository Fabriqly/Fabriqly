# Firebase Setup & Authentication Documentation

## Overview

This document outlines the complete Firebase integration and authentication system implemented for the Fabriqly project. We migrated from Prisma/Supabase to Firebase for better scalability, real-time capabilities, and comprehensive authentication features.

## 🏗️ Architecture Overview

```
Fabriqly App
├── Frontend (Next.js 14 + React 18)
├── Authentication (NextAuth.js + Firebase Auth)
├── Database (Firestore)
├── Storage (Firebase Storage)
└── Server-side (Firebase Admin SDK)
```

## 📦 Dependencies & Why We Chose Them

### Core Framework
- **Next.js 14.2.0**: React framework with App Router for server-side rendering and API routes
- **React 18.3.0**: UI library for building interactive interfaces
- **TypeScript 5**: Type safety and better developer experience

### Firebase Ecosystem
- **firebase 10.13.0**: Client SDK for frontend Firebase operations
  - **Why**: Provides real-time database, authentication, and storage capabilities
  - **Use**: User authentication, data operations, file uploads
- **firebase-admin 13.5.0**: Admin SDK for server-side operations
  - **Why**: Secure server-side access to Firebase services
  - **Use**: API routes, background jobs, secure data access

### Authentication
- **next-auth 4.24.11**: Authentication library for Next.js
  - **Why**: Provides session management, multiple providers, and security features
  - **Use**: Handles login/logout, session persistence, route protection

### UI & Styling
- **tailwindcss 4.1.12**: Utility-first CSS framework
  - **Why**: Rapid UI development with consistent design system
- **@tailwindcss/forms 0.5.10**: Form styling utilities
  - **Why**: Better form appearance and consistency
- **@headlessui/react 2.2.7**: Unstyled, accessible UI components
  - **Why**: Accessible components that work with Tailwind
- **lucide-react 0.542.0**: Icon library
  - **Why**: Consistent, customizable icons

### Utilities
- **clsx 2.1.1**: Conditional className utility
  - **Why**: Clean conditional styling
- **tailwind-merge 3.3.1**: Merge Tailwind classes without conflicts
  - **Why**: Prevents class conflicts when combining styles

### Security
- **bcryptjs 3.0.2**: Password hashing (if needed for additional security)
  - **Why**: Secure password storage (though Firebase handles this)

## 🔧 Setup Process

### 1. Environment Configuration

Create `.env.local` with Firebase credentials:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id

# NextAuth Configuration
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Firebase Console Setup

#### Authentication Setup
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Optionally enable "Google" provider for OAuth

#### Firestore Database Setup
1. Create Firestore database in test mode
2. Update security rules for authenticated access
3. Set up collections: `users`, `products`, `orders`, etc.

#### Storage Setup
1. Enable Firebase Storage
2. Configure storage rules for authenticated uploads

## 🏛️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── users/route.ts
│   ├── dashboard/page.tsx        # Protected dashboard
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── SessionProvider.tsx
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       └── Input.tsx
├── lib/                          # Library configurations
│   ├── firebase.ts              # Firebase client config
│   ├── firebase-admin.ts        # Firebase admin config
│   └── auth.ts                  # NextAuth configuration
├── services/                    # Service layer
│   ├── firebase.ts              # Client-side Firebase services
│   └── firebase-admin.ts        # Server-side Firebase services
├── types/                       # TypeScript type definitions
│   ├── firebase.ts              # Firebase data models
│   └── next-auth.d.ts           # NextAuth type extensions
├── hooks/                       # Custom React hooks
│   └── useAuth.ts               # Authentication hook
└── utils/                       # Utility functions
    └── cn.ts                    # Class name utility
```

## 🔐 Authentication Flow

### Email/Password Registration Flow
1. User fills registration form
2. NextAuth calls Firebase Auth to create user
3. User document created in Firestore
4. Session established with user data

### Email/Password Login Flow
1. User provides credentials
2. NextAuth validates with Firebase Auth
3. User data fetched from Firestore
4. Session established

### Google OAuth Flow
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. User grants permissions (email, profile, openid scopes)
4. Google redirects back to NextAuth callback
5. NextAuth processes Google OAuth response
6. User redirected to role selection page
7. User selects role (Customer, Designer, Business Owner)
8. API creates/updates user document in Firestore with selected role
9. User redirected to dashboard

### Session Management
- Sessions stored in JWT tokens
- Automatic session refresh
- Role-based access control
- User data synchronized between NextAuth and Firestore

## 🗄️ Database Schema

### Users Collection
```typescript
interface User {
  email: string;
  role: 'customer' | 'designer' | 'business_owner' | 'admin';
  isVerified: boolean;
  profile: {
    firstName: string;
    lastName: string;
    preferences: {
      notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
      theme: 'light' | 'dark';
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Products Collection
```typescript
interface Product {
  name: string;
  description: string;
  price: number;
  designerId: string;
  category: string;
  images: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔒 Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products are readable by all, writable by designers
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'designer';
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Key Features Implemented

### 1. Multi-Provider Authentication
- Email/Password authentication
- Google OAuth (optional)
- Session management with NextAuth

### 2. Role-Based Access Control
- Customer: Browse products, place orders
- Designer: Create/manage products, view analytics
- Business Owner: Manage shop, view reports
- Admin: Full system access

### 3. Protected Routes
- Automatic redirect for unauthenticated users
- Role-based route protection
- Session persistence across page reloads

### 4. Real-time Database
- Firestore for scalable NoSQL data storage
- Real-time updates for live data
- Offline support

### 5. File Storage
- Firebase Storage for image uploads
- Secure file access with authentication
- Automatic file optimization

## 🧪 Testing & Debugging

### Debug Tools
- `/debug-firebase` - Test Firebase configuration
- `/debug-session` - Session and user data debugging
- `/debug-google-oauth` - Google OAuth specific debugging
- Environment variable validation
- Direct Firebase Auth testing

### Common Issues & Solutions

#### 1. "auth/operation-not-allowed"
- **Cause**: Email/Password not enabled in Firebase Console
- **Solution**: Enable Email/Password in Authentication → Sign-in method

#### 2. "Permission denied" in Firestore
- **Cause**: Security rules too restrictive
- **Solution**: Update Firestore rules for authenticated users

#### 3. Environment variables not loading
- **Cause**: Missing or incorrect `.env.local` file
- **Solution**: Verify all required variables are set

#### 4. Google OAuth "Access Denied" Error
- **Cause**: Missing Google OAuth configuration or test users
- **Solution**: 
  1. Set up OAuth consent screen in Google Cloud Console
  2. Add required scopes: `openid`, `email`, `profile`
  3. Add your email as a test user
  4. Ensure OAuth client has correct redirect URIs

#### 5. "No document to update" Error During Role Selection
- **Cause**: User document not created during Google OAuth sign-in
- **Solution**: API route now handles this automatically by creating the document if it doesn't exist
- **Implementation**: The `/api/users/update-role` endpoint uses try/catch to update existing documents or create new ones

## 📈 Performance Considerations

### Firebase Optimizations
- Use Firestore offline persistence for better UX
- Implement proper indexing for queries
- Use Firebase Storage CDN for fast image delivery

### Next.js Optimizations
- Server-side rendering for better SEO
- Image optimization with Next.js Image component
- Code splitting for smaller bundle sizes

## 🔄 Migration from Prisma/Supabase

### What We Removed
- `@prisma/client` and `prisma` - Replaced with Firestore
- `@supabase/supabase-js` - Replaced with Firebase SDKs
- Prisma schema files - Replaced with Firestore collections

### Benefits of Migration
- **Real-time**: Built-in real-time updates
- **Scalability**: Automatic scaling with Firebase
- **Authentication**: Comprehensive auth system
- **Storage**: Integrated file storage
- **Analytics**: Built-in analytics and monitoring

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🔧 Google OAuth Setup Checklist

### Google Cloud Console Configuration
1. **Create OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

2. **Configure OAuth Consent Screen**:
   - Choose "External" for testing
   - Fill required fields (app name, user support email)
   - Add scopes: `openid`, `email`, `profile`
   - Add test users (your email address)
   - Set publishing status to "Testing"

3. **Enable Required APIs**:
   - Google Identity API
   - Google+ API (if available)

### Environment Variables
```env
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
NEXTAUTH_SECRET=generated_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### Role Selection API Enhancement
The `/api/users/update-role` endpoint includes automatic user document creation:
- Attempts to update existing user document
- If document doesn't exist, creates new document with Google OAuth data
- Ensures all Google OAuth users have proper Firestore documents

## 🔧 Firebase Email Troubleshooting

### Password Reset Email Not Received

If users are not receiving password reset emails from Firebase, follow these steps:

#### 1. Check Firebase Console Configuration
1. **Go to Firebase Console** → Your Project → Authentication → Templates
2. **Verify Email Templates are enabled**:
   - Password reset template should be active
   - Check if custom templates are configured
3. **Check Authorized Domains**:
   - Go to Authentication → Settings → Authorized domains
   - Ensure your domain is listed (localhost:3000 for development)

#### 2. Common Issues and Solutions

**Issue: Email goes to spam**
- Check spam/junk folder
- Add `noreply@firebaseapp.com` to contacts
- Configure email filters to allow Firebase emails

**Issue: User not found error**
- Verify the email address exists in Firebase Auth
- Check for typos in email address
- Ensure user account was created properly

**Issue: Too many requests**
- Wait 5-10 minutes before retrying
- Implement rate limiting on frontend
- Check for multiple rapid requests

**Issue: Invalid email format**
- Validate email format on frontend
- Check for special characters or spaces
- Ensure proper email validation

#### 3. Firebase Configuration Checklist
- [ ] Firebase project is active and not suspended
- [ ] Authentication is enabled
- [ ] Email/Password sign-in method is enabled
- [ ] Authorized domains include your domain
- [ ] Email templates are configured
- [ ] No billing issues (if using paid features)

#### 4. Testing Steps
1. **Test with a known working email**:
   ```bash
   # Use a Gmail or other reliable email service
   # Test with the same email used for account creation
   ```
2. **Check browser console**:
   - Look for Firebase errors
   - Check network requests
   - Verify API responses
3. **Check server logs**:
   - Look for Firebase error codes
   - Check for rate limiting
   - Verify email sending status

#### 5. Alternative Solutions
If Firebase email continues to fail:
1. **Use custom email service**:
   - Configure SMTP in environment variables
   - Use the custom forgot-password endpoint
   - Send emails through your own service
2. **Manual password reset**:
   - Admin can reset passwords through Firebase Console
   - Create admin interface for password management
3. **Contact Firebase Support**:
   - If issues persist, contact Firebase support
   - Provide project ID and error details

#### 6. Common Error Codes
- `auth/user-not-found`: Email doesn't exist in Firebase
- `auth/invalid-email`: Email format is invalid
- `auth/too-many-requests`: Rate limit exceeded
- `auth/network-request-failed`: Network connectivity issue
- `auth/internal-error`: Firebase internal error

#### 7. Best Practices
1. **Always check spam folder** in user instructions
2. **Implement proper error handling** for all Firebase errors
3. **Add rate limiting** to prevent abuse
4. **Provide clear user feedback** about email delivery
5. **Test with multiple email providers** (Gmail, Yahoo, Outlook)
6. **Monitor email delivery rates** in Firebase Console
7. **Keep Firebase SDK updated** to latest version

## 🔥 Firebase Indexes Required for Optimized Queries

### Current Issue
The optimized product queries are failing because Firebase requires composite indexes for queries that combine filtering and sorting.

### Required Indexes to Create

#### 1. Business Owner + CreatedAt (Most Important)
**Collection:** `products`
**Fields:**
- `businessOwnerId` (Ascending)
- `createdAt` (Descending)

**Purpose:** Enables fast queries for business owner products sorted by creation date

#### 2. Business Owner + Price
**Collection:** `products`
**Fields:**
- `businessOwnerId` (Ascending)
- `price` (Descending)

**Purpose:** Enables price-based sorting for business owner products

#### 3. Business Owner + Name
**Collection:** `products`
**Fields:**
- `businessOwnerId` (Ascending)
- `name` (Ascending)

**Purpose:** Enables name-based sorting for business owner products

#### 4. Status + CreatedAt
**Collection:** `products`
**Fields:**
- `status` (Ascending)
- `createdAt` (Descending)

**Purpose:** Enables public queries filtered by status

#### 5. Category + CreatedAt
**Collection:** `products`
**Fields:**
- `categoryId` (Ascending)
- `createdAt` (Descending)

**Purpose:** Enables category-based queries with sorting

#### 6. Business Owner + Status + CreatedAt
**Collection:** `products`
**Fields:**
- `businessOwnerId` (Ascending)
- `status` (Ascending)
- `createdAt` (Descending)

**Purpose:** Enables complex filtering for business owners

### How to Create Indexes in Firebase Console

#### Method 1: Automatic (Recommended)
1. Go to Firebase Console → Firestore Database
2. Try to run a query that needs an index
3. Firebase will show an error with a link to create the index
4. Click the link and Firebase will auto-generate the index

#### Method 2: Manual
1. Go to Firebase Console → Firestore Database
2. Click on "Indexes" tab
3. Click "Add index"
4. Select collection: `products`
5. Add fields in order:
   - Field: `businessOwnerId`, Order: `Ascending`
   - Field: `createdAt`, Order: `Descending`
6. Click "Create"

### Quick Fix (Temporary)
The system will now:
1. **Try the optimized query first**
2. **If it fails** (missing index), fall back to basic query
3. **Apply sorting in memory** instead of Firestore
4. **Log a warning** so you know indexes are needed

### Performance Impact

#### With Indexes (Optimal)
- ✅ Query time: ~100-300ms
- ✅ Scales well with data growth
- ✅ Efficient database usage

#### Without Indexes (Fallback)
- ⚠️ Query time: ~500-1000ms
- ⚠️ Fetches all products then filters
- ⚠️ Less efficient but still works

### Priority Order
Create indexes in this order:
1. **HIGH PRIORITY**: `businessOwnerId` + `createdAt`
2. **HIGH PRIORITY**: `businessOwnerId` + `price`
3. **MEDIUM PRIORITY**: `status` + `createdAt`
4. **MEDIUM PRIORITY**: `categoryId` + `createdAt`
5. **LOW PRIORITY**: `businessOwnerId` + `name`
6. **LOW PRIORITY**: `businessOwnerId` + `status` + `createdAt`

### Testing After Creating Indexes
1. **Create the first index** (`businessOwnerId` + `createdAt`)
2. **Test the products page** - should be much faster
3. **Check browser console** - should see no more warnings
4. **Create additional indexes** as needed

### Index Creation Commands (Firebase CLI)
If you prefer using Firebase CLI:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Create indexes using firestore.indexes.json
firebase deploy --only firestore:indexes
```

### Expected Results
After creating the indexes:
- ✅ **No more 500 errors**
- ✅ **Faster product loading** (2-5x improvement)
- ✅ **Better scalability**
- ✅ **Reduced database costs**

## 🔥 Firebase Quota Optimization

### Current Quota Issues
Your Firebase project has reached quota limits. This guide outlines implemented optimizations to reduce Firebase usage.

### Implemented Optimizations

#### 1. Aggressive Caching Strategy
- **Dashboard Stats**: 5-minute cache for dashboard statistics
- **Analytics**: 10-minute cache for analytics data
- **Products**: 2-minute cache for product listings
- **Individual Entities**: Cached with TTL for users, products, categories

#### 2. Query Limits
- **Users**: Limited to 1000 most recent records
- **Products**: Limited to 1000 most recent records
- **Categories**: Limited to 100 most recent records
- **Orders**: Limited to 1000 most recent records
- **Activities**: Limited to 500 most recent records for stats
- **Colors**: Limited to 200 most recent records
- **Product Images**: Limited to 10 images per product

#### 3. Optimized Data Fetching
- All queries now use `orderBy` with `limit` to reduce data transfer
- Cached responses prevent repeated database calls
- Smart cache invalidation on data updates

### Expected Quota Reduction

#### Before Optimization:
- Dashboard stats: ~4 full collection reads per request
- Analytics: ~4 full collection reads per request
- Products: Full product collection read per request
- **Total**: ~8-12 full collection reads per page load

#### After Optimization:
- Dashboard stats: 1 read every 5 minutes (cached)
- Analytics: 1 read every 10 minutes (cached)
- Products: 1 read every 2 minutes (cached)
- **Total**: ~1-2 reads per page load (90%+ reduction)

### Additional Recommendations

#### 1. Implement Pagination
```typescript
// Use pagination for large datasets
const products = await FirebaseAdminService.queryDocuments(
  Collections.PRODUCTS,
  [],
  { field: 'createdAt', direction: 'desc' },
  20 // Limit to 20 items per page
);
```

#### 2. Use Composite Indexes
Create indexes for common query patterns:
- `businessOwnerId + createdAt`
- `status + createdAt`
- `categoryId + createdAt`

#### 3. Implement Offline Support
- Cache frequently accessed data locally
- Use service workers for offline functionality
- Implement background sync for updates

#### 4. Monitor Usage
```typescript
// Add usage monitoring
console.log('Firebase reads:', readCount);
console.log('Cache hits:', cacheHits);
console.log('Cache miss rate:', (cacheMisses / totalRequests) * 100);
```

### Cache Configuration

#### Cache TTL Settings:
- **Dashboard Stats**: 5 minutes
- **Analytics**: 10 minutes
- **Products**: 2 minutes
- **Users**: 15 minutes
- **Categories**: 30 minutes
- **Activities**: 1 minute (frequently changing)
- **Activity Stats**: 5 minutes
- **Colors**: 15 minutes (rarely changing)
- **Cart**: 2 minutes (frequently changing)
- **Orders**: 3 minutes (moderately changing)

#### Cache Size Limits:
- Maximum 1000 entries
- LRU eviction policy
- Automatic cleanup of expired entries

### Monitoring & Alerts

#### Key Metrics to Track:
1. **Read Operations**: Monitor daily read counts
2. **Cache Hit Rate**: Aim for >80% hit rate
3. **Response Times**: Should improve with caching
4. **Error Rates**: Monitor for cache-related issues

#### Firebase Console Monitoring:
- Go to Firebase Console → Usage
- Monitor Firestore reads/writes
- Set up billing alerts for quota limits

### Next Steps
1. **Deploy Changes**: Deploy the optimized code
2. **Monitor Usage**: Check Firebase Console for reduced usage
3. **Fine-tune Cache**: Adjust TTL based on usage patterns
4. **Implement More Caching**: Add caching to other endpoints
5. **Consider Upgrading**: If still hitting limits, consider Firebase Blaze plan

### Pro Tips
1. **Use Firebase Emulator**: Test locally without quota usage
2. **Batch Operations**: Group multiple operations together
3. **Optimize Queries**: Use specific field selections
4. **Implement CDN**: Use Cloudflare or similar for static assets
5. **Database Design**: Normalize data to reduce document size

### Troubleshooting

#### If Still Hitting Quota:
1. Check for real-time listeners (`onSnapshot`)
2. Look for infinite loops in data fetching
3. Verify cache is working (check network tab)
4. Consider implementing request deduplication
5. Use Firebase Performance Monitoring

#### Cache Issues:
1. Clear cache: `CacheService.clear()`
2. Check cache size: `CacheService.getStats()`
3. Verify TTL settings
4. Monitor memory usage

## 🔮 Future Enhancements

1. **Advanced Analytics**: Firebase Analytics integration
2. **Push Notifications**: Firebase Cloud Messaging
3. **Advanced Security**: Custom claims and security rules
4. **Performance Monitoring**: Firebase Performance Monitoring
5. **A/B Testing**: Firebase Remote Config
6. **Account Linking**: Link multiple auth providers to single account
7. **Email Verification**: Verify email addresses for enhanced security

---

*This documentation covers the complete Firebase setup and authentication system implemented for Fabriqly. The system now supports both email/password and Google OAuth authentication with automatic user document creation and role-based access control.*
