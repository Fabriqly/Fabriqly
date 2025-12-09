# User Workflow System - Implementation Guide

## Overview

This document describes the revised user workflow system for Fabriqly, where users progress through different roles based on admin approval.

---

## 🔄 Complete User Workflow

### 1. Registration Phase

**User Action:** Registers an account using basic details (name, email, password)

**System Role Assigned:** `customer` (default for all new registrations)

**Outcome:** User can now log in and access the "Explore" section as a regular customer.

**Files:**
- Registration Form: `src/components/auth/RegisterForm.tsx`
- Registration API: `src/app/api/auth/register/route.ts`

---

### 2. Explore Phase

**User Action:** After login, the user is redirected to the Explore Page

**Available Actions:**
- Browse products
- View shop and designer profiles
- See "Become a Designer" or "Become a Shop" application cards (only visible to customers)

**Files:**
- Explore Page: `src/app/explore/page.tsx`

---

### 3. Application Phase

#### 3A. Register as Designer

**User Action:** Clicks "Apply as Designer" button

**System Process:**
1. Shows Designer Application Form requiring:
   - Business/Designer Name
   - Bio (min. 20 characters)
   - Portfolio URL (optional)
   - Sample designs (optional)
   - Specialties
   - Contact information
   - Social media links (optional)

2. User submits the form

3. **System Role:** Changes from `customer` to `pending_designer`

4. Application is created with status: `pending`

**Files:**
- Application Form: `src/components/applications/DesignerApplicationForm.tsx`
- Application Page: `src/app/apply/designer/page.tsx`
- API Endpoint: `src/app/api/applications/designer/route.ts`

**User can:**
- View application status at `/my-applications`
- Continue browsing as a customer
- Cannot apply again while pending

---

#### 3B. Register as Shop

**User Action:** Clicks "Apply as Shop Owner" button

**System Process:**
1. Shows Shop Application Form requiring:
   - Shop Name
   - Description (min. 20 characters)
   - Complete Address (street, city, country)
   - Contact Information (phone, email)
   - Business Permit URL (optional)
   - Business Registration Number (optional)
   - Tax ID (optional)
   - Services Offered

2. User submits the form

3. **System Role:** Changes from `customer` to `pending_shop`

4. Application is created with status: `pending`

**Files:**
- Application Form: `src/components/applications/ShopApplicationForm.tsx`
- Application Page: `src/app/apply/shop/page.tsx`
- API Endpoint: `src/app/api/applications/shop/route.ts`

**User can:**
- View application status at `/my-applications`
- Continue browsing as a customer
- Cannot apply again while pending

---

### 4. Admin Review Workflow

**Admin Action:** Reviews applications in the admin dashboard

**Access:** `/dashboard/admin/applications`

**Admin Can:**
1. View all pending designer applications
2. View all pending shop applications
3. Review supporting documents and information
4. Approve or reject applications with reason

**Approval Process:**

#### Approve Designer Application:
1. Admin clicks "Approve" button
2. Confirmation dialog appears
3. On confirmation:
   - Application status → `approved`
   - User role → `designer`
   - Designer profile is automatically created
   - Activity is logged
   - User receives notification (future feature)

#### Approve Shop Application:
1. Admin clicks "Approve" button
2. Confirmation dialog appears
3. On confirmation:
   - Application status → `approved`
   - User role → `business_owner`
   - Shop profile is automatically created
   - Activity is logged
   - User receives notification (future feature)

#### Reject Application:
1. Admin clicks "Reject" button
2. Modal opens requesting rejection reason
3. Admin enters reason
4. On confirmation:
   - Application status → `rejected`
   - User role → `customer` (reverted)
   - Rejection reason is saved
   - Activity is logged
   - User can see rejection reason and reapply

**Files:**
- Admin Page: `src/app/dashboard/admin/applications/page.tsx`
- Admin Layout (Navigation): `src/components/admin/AdminLayout.tsx`
- API Endpoints:
  - Designer: `src/app/api/applications/designer/[id]/route.ts`
  - Shop: `src/app/api/applications/shop/[id]/route.ts`

---

### 5. User Application Tracking

**User Access:** `/my-applications`

**Features:**
- View all submitted applications (designer and shop)
- See application status (Pending, Approved, Rejected)
- View applied date and reviewed date
- See rejection reasons (if rejected)
- Resubmit applications (if rejected)
- Quick access to dashboard (if approved)

**Files:**
- My Applications Page: `src/app/my-applications/page.tsx`

---

## 📊 Role Progression Summary

| Stage | Role | Access Level | Can Apply |
|-------|------|--------------|-----------|
| After registration | `customer` | Browse, buy, explore | ✅ Yes |
| After applying (pending) | `pending_designer` or `pending_shop` | Browse, buy, view status | ❌ No |
| After admin approval | `designer` or `business_owner` | Full access to dashboard | N/A |
| After admin rejection | `customer` (reverted) | Browse, buy, explore | ✅ Yes (reapply) |

---

## 🔐 User Roles

### All Roles:
```typescript
type UserRole = 
  | 'customer'           // Default role for new registrations
  | 'pending_designer'   // Waiting for designer application approval
  | 'pending_shop'       // Waiting for shop application approval
  | 'designer'           // Approved designer
  | 'business_owner'     // Approved shop owner
  | 'admin';            // System administrator
```

**Files:**
- Type Definition: `src/types/next-auth.d.ts`
- Auth Hook: `src/hooks/useAuth.ts`

---

## 📝 Application Data Structure

### Designer Application:
```typescript
interface DesignerApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  businessName: string;
  bio: string;
  portfolioUrl?: string;
  sampleDesigns?: string[];
  specialties: string[];
  contactInfo: {
    phone?: string;
    website?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}
```

### Shop Application:
```typescript
interface ShopApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  shopName: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
  };
  businessPermit?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  operatingHours?: object;
  specialties?: string[];
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
}
```

**Files:**
- Type Definitions: `src/types/applications.ts`

---

## 🗄️ Database Collections

### New Collections:
1. **`designerApplications`** - Stores all designer applications
2. **`shopApplications`** - Stores all shop applications

**Collections Constant:**
```typescript
export const Collections = {
  // ... existing collections
  DESIGNER_APPLICATIONS: 'designerApplications',
  SHOP_APPLICATIONS: 'shopApplications'
} as const;
```

**File:** `src/services/firebase.ts`

---

## 🛣️ Key Routes

### User Routes:
- `/register` - User registration (creates customer account)
- `/explore` - Browse products and see application options
- `/apply/designer` - Designer application form
- `/apply/shop` - Shop application form
- `/my-applications` - Track application status

### Admin Routes:
- `/dashboard/admin/applications` - Review and manage applications

---

## 🔧 API Endpoints

### Designer Applications:
- `GET /api/applications/designer` - List applications (admin or own)
- `POST /api/applications/designer` - Submit new application
- `GET /api/applications/designer/[id]` - Get specific application
- `PATCH /api/applications/designer/[id]` - Approve/reject (admin only)

### Shop Applications:
- `GET /api/applications/shop` - List applications (admin or own)
- `POST /api/applications/shop` - Submit new application
- `GET /api/applications/shop/[id]` - Get specific application
- `PATCH /api/applications/shop/[id]` - Approve/reject (admin only)

---

## 🎨 UI Components

### Application Forms:
- `DesignerApplicationForm` - Designer application form component
- `ShopApplicationForm` - Shop application form component

### Admin Components:
- Admin Applications Page - Unified page for reviewing both types

**Location:** `src/components/applications/`

---

## ✅ Validation Rules

### Designer Application:
- Business name: Required
- Bio: Required, min. 20 characters
- At least one contact method recommended
- No duplicate pending/approved applications

### Shop Application:
- Shop name: Required
- Description: Required, min. 20 characters
- Address: Street, city, and country required
- Contact: Phone and email required
- No duplicate pending/approved applications

---

## 🔔 Future Enhancements

### Planned Features:
1. **Email Notifications**
   - Notify admin when new application is submitted
   - Notify user when application is approved/rejected

2. **Application Analytics**
   - Track application approval rates
   - Monitor average review time
   - Application trends dashboard

3. **Application Updates**
   - Allow users to update pending applications
   - Request additional information from applicants

4. **Bulk Actions**
   - Admin can approve/reject multiple applications at once

---

## 🧪 Testing Workflow

### Test as Customer:
1. Register new account → Should be `customer`
2. Login and go to `/explore` → Should see application cards
3. Apply as designer → Role should become `pending_designer`
4. Check `/my-applications` → Should see pending application

### Test as Admin:
1. Login as admin
2. Navigate to `/dashboard/admin/applications`
3. Review pending applications
4. Approve/reject applications
5. Verify user roles are updated correctly

---

## 📚 Related Documentation

- [Firebase Setup](./FIREBASE_SETUP.md)
- [Admin Dashboard](./NAVIGATION_LAYOUT_UPDATE.md)
- [Shop Profile System](./SHOP_PROFILE_SYSTEM.md)
- [Authentication System](./CUSTOMIZATION_ARCHITECTURE.md)

---

## 🆘 Troubleshooting

### Application Not Showing in Admin:
- Check if application status is "pending"
- Verify user role was updated correctly
- Check Firebase collection name matches

### User Stuck in Pending:
- Admin must approve/reject through admin dashboard
- Cannot manually change role in Firebase (role is updated by API)

### Cannot Reapply After Rejection:
- Check if old application status is "rejected"
- Only rejected applications allow reapplication
- Pending/approved applications block new submissions

---

## Summary

The revised user workflow provides a structured path for users to become designers or shop owners on the platform. All new users start as customers, can apply for elevated roles through dedicated forms, and must receive admin approval before accessing designer or shop features. The system includes comprehensive tracking, clear status indicators, and admin management tools to ensure quality control.

