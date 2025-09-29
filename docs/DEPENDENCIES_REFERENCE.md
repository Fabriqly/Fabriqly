# Dependencies Quick Reference

## 📦 Package.json Dependencies Explained

### Core Dependencies

```json
{
  "next": "^14.2.0",           // React framework with SSR, routing, API routes
  "react": "^18.3.0",          // UI library for building interfaces
  "react-dom": "^18.3.0",      // React DOM rendering for web
  "typescript": "^5"           // Type safety and better DX
}
```

### Firebase Ecosystem

```json
{
  "firebase": "^10.13.0",      // Client SDK: Auth, Firestore, Storage
  "firebase-admin": "^13.5.0"  // Admin SDK: Server-side operations
}
```

**Why Firebase?**
- **Real-time**: Live data updates without polling
- **Scalable**: Automatic scaling with usage
- **Integrated**: Auth, DB, Storage in one platform
- **Offline**: Works without internet connection

### Authentication

```json
{
  "next-auth": "^4.24.11"      // Session management, multiple providers
}
```

**Why NextAuth?**
- **Session Management**: JWT tokens, secure sessions
- **Multiple Providers**: Email, Google, GitHub, etc.
- **Route Protection**: Easy protected routes
- **TypeScript**: Full type safety

### UI & Styling

```json
{
  "tailwindcss": "^4.1.12",           // Utility-first CSS framework
  "@tailwindcss/forms": "^0.5.10",    // Better form styling
  "@headlessui/react": "^2.2.7",      // Accessible UI components
  "lucide-react": "^0.542.0"          // Icon library
}
```

**Why This Stack?**
- **Tailwind**: Rapid UI development
- **Headless UI**: Accessible, unstyled components
- **Lucide**: Consistent, customizable icons

### Utilities

```json
{
  "clsx": "^2.1.1",            // Conditional className utility
  "tailwind-merge": "^3.3.1"   // Merge Tailwind classes safely
}
```

**Why These?**
- **clsx**: Clean conditional styling
- **tailwind-merge**: Prevent class conflicts

### Security

```json
{
  "bcryptjs": "^3.0.2",        // Password hashing (if needed)
  "@types/bcryptjs": "^2.4.6"  // TypeScript types for bcryptjs
}
```

## 🔄 Migration Summary

### Removed (Prisma/Supabase)
```json
{
  "@prisma/client": "removed",     // Replaced with Firestore
  "prisma": "removed",             // Replaced with Firestore
  "@supabase/supabase-js": "removed" // Replaced with Firebase
}
```

### Added (Firebase)
```json
{
  "firebase": "^10.13.0",          // Client SDK
  "firebase-admin": "^13.5.0"      // Admin SDK
}
```

## 🎯 Key Benefits of Our Stack

### 1. **Developer Experience**
- TypeScript for type safety
- Hot reloading with Next.js
- Tailwind for rapid styling

### 2. **Performance**
- Server-side rendering
- Automatic code splitting
- Firebase CDN for assets

### 3. **Scalability**
- Firebase auto-scaling
- Real-time updates
- Offline support

### 4. **Security**
- NextAuth session management
- Firebase security rules
- Environment variable protection

## 🛠️ Development Workflow

```bash
# Install all dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## 📚 Learning Resources

- **Firebase**: https://firebase.google.com/docs
- **NextAuth**: https://next-auth.js.org/
- **Next.js**: https://nextjs.org/docs
- **Tailwind**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs
