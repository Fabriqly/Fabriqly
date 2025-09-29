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
