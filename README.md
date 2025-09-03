# Fabriqly - Firebase Authentication System

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 📚 Documentation

- **[Firebase Setup Guide](docs/FIREBASE_SETUP.md)** - Complete setup and configuration
- **[Dependencies Reference](docs/DEPENDENCIES_REFERENCE.md)** - Why we chose each dependency

## 🏗️ What We Built

### ✅ Completed Features

1. **Firebase Integration**
   - Client SDK for frontend operations
   - Admin SDK for server-side operations
   - Real-time Firestore database
   - Firebase Storage for file uploads

2. **Authentication System**
   - Email/Password authentication
   - Google OAuth (optional)
   - Session management with NextAuth.js
   - Role-based access control (Customer, Designer, Business Owner, Admin)

3. **User Interface**
   - Modern, responsive design with Tailwind CSS
   - Login and registration forms
   - Protected routes and navigation
   - Reusable UI components

4. **Security**
   - Environment variable protection
   - Firebase security rules
   - JWT session tokens
   - Route protection

### 🔄 Migration Summary

**From:** Prisma + Supabase  
**To:** Firebase (Auth + Firestore + Storage)

**Benefits:**
- Real-time data updates
- Automatic scaling
- Integrated authentication
- Better offline support

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 + React 18 + TypeScript
- **Database:** Firebase Firestore
- **Authentication:** NextAuth.js + Firebase Auth
- **Storage:** Firebase Storage
- **Styling:** Tailwind CSS + Headless UI
- **Icons:** Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   └── dashboard/         # Protected pages
├── components/            # React components
│   ├── auth/              # Auth components
│   └── ui/                # Reusable UI
├── lib/                   # Library configs
├── services/              # Firebase services
├── types/                 # TypeScript types
├── hooks/                 # Custom hooks
└── utils/                 # Utilities
```

## 🔐 Authentication Flow

1. **Registration:** User fills form → Firebase Auth creates user → Firestore stores profile
2. **Login:** User provides credentials → NextAuth validates → Session established
3. **Protection:** Routes check authentication → Redirect if unauthorized

## 🧪 Testing

Visit `/debug-firebase` to test:
- Environment variables
- Firebase configuration
- Direct authentication

## 🚀 Next Steps

Ready to build more features:

1. **User Profiles** - Profile management pages
2. **Product Catalog** - Browse and search products
3. **Designer Portfolio** - Showcase designer work
4. **Shop Management** - Business owner dashboard
5. **Messaging System** - User communication
6. **Order Management** - Purchase flow
7. **Payment Processing** - Stripe integration
8. **Admin Dashboard** - Analytics and management

## 📞 Support

- **Firebase Console:** https://console.firebase.google.com/project/fabriqly-cb104
- **Documentation:** Check the `docs/` folder
- **Issues:** Check Firebase Console for errors

---

Built with ❤️ using Next.js, Firebase, and Tailwind CSS
