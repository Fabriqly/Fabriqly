# 📋 Shop Owner Application Workflow - Complete Guide

## Overview
This document provides a comprehensive, step-by-step guide to the shop owner application process in Fabriqly, including every screen, field, and interaction that users will experience.

---

## 🎯 User Journey: From Customer to Shop Owner

### **Step 1: Starting Point (Customer Role)**
**Page:** `/explore`  
**User Role:** `customer`

#### What the user sees:
- Two prominent cards inviting them to upgrade their account:
  1. **"Become a Designer"** card
  2. **"Become a Shop Owner"** card ← User clicks this

**Call to Action:**
- Button: "Apply Now" or similar
- Clicking redirects to `/apply/shop`

---

### **Step 2: Shop Owner Application Form**
**Page:** `/apply/shop`  
**User Role:** `customer`

The application form consists of **8 comprehensive sections** (A through H):

---

#### **Section A: Basic Information** ⭐ (Required)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Shop Name** | Text input | ✅ Yes | The official name of the shop |
| **Description** | Textarea (min 20 chars) | ✅ Yes | Detailed description of the shop, services, and unique selling points |

**Validation:**
- Shop name: Cannot be empty
- Description: Minimum 20 characters
- Character counter displayed below description field

---

#### **Section B: Contact Information** 📞 (Required)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Phone Number** | Tel input | ✅ Yes | Primary contact phone number |
| **Email Address** | Email input | ✅ Yes | Primary contact email (pre-filled from account) |

**Validation:**
- Both fields required
- Email format validation
- Phone number format validation

---

#### **Section C: Shop Address** 📍 (Required)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Street Address** | Text input | ✅ Yes | Physical street address of the shop |
| **City** | Text input | ✅ Yes | City where the shop is located |
| **State/Province** | Text input | ⬜ No | State or province |
| **ZIP/Postal Code** | Text input | ⬜ No | Postal/ZIP code |
| **Country** | Text input | ✅ Yes | Country of operation |

**Validation:**
- Street, City, and Country are mandatory
- Complete address ensures proper shop location display

---

#### **Section D: Business Information** 📄 (Optional but Recommended)

##### **Business Documents Upload** 🗂️

**Purpose:** Verify business legitimacy and speed up approval

**Accepted Documents:**
- ✅ Business Permit / Mayor's Permit
- ✅ DTI Registration (for sole proprietors)
- ✅ SEC Registration (for corporations)
- ✅ BIR Certificate of Registration (COR)
- ✅ Barangay Clearance
- ✅ Fire Safety Inspection Certificate
- ✅ Any other valid business registration documents

**Upload Process:**
1. Click **"Add Another Document"** button to create a new upload slot
2. For each document:
   - Enter **Document Name/Type** (e.g., "DTI Registration", "Business Permit")
   - **Choose file** (PDF or image, max 10MB)
   - See upload progress
   - **Preview appears** after upload (PDF icon or image thumbnail)
   - Option to **"View document"** (opens in new tab)
   - Option to **"Remove Document"** to delete
3. Can upload **multiple documents** with custom labels
4. Each document slot can be removed independently

**File Requirements:**
- **Formats:** PDF, JPG, PNG, WebP, GIF
- **Max Size:** 10MB per file
- **Multiple files:** Yes (unlimited, but recommended 2-5 documents)

##### **Additional Business Fields**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Business Registration Number** | Text input | ⬜ No | BRN, DTI number, or SEC registration number |
| **Tax ID / TIN** | Text input | ⬜ No | Tax Identification Number |

---

#### **Section E: Shop Profile & Branding** 🖼️ (Mixed)

**Purpose:** Give the shop its visual identity and help it stand out

| Field | Type | Required | Description | Recommended Size |
|-------|------|----------|-------------|------------------|
| **Profile Banner** | Image upload | ⬜ No | Shop cover photo shown on Explore and profile pages | 1200×400px |
| **Shop Logo** | Image upload | ✅ **Yes** | Circular or square image displayed beside shop name | 300×300px |
| **Tagline / Slogan** | Text input (max 100 chars) | ⬜ No | Short phrase (e.g., "Custom Tailoring with Passion") | Max 100 characters |
| **Social Media - Facebook** | URL input | ⬜ No | Facebook page URL | |
| **Social Media - Instagram** | URL input | ⬜ No | Instagram profile URL | |
| **Social Media - TikTok** | URL input | ⬜ No | TikTok profile URL | |
| **Website URL** | URL input | ⬜ No | Existing shop website (if any) | |

**Upload Features:**
- **Banner & Logo:**
  - Preview after upload
  - "Remove" button to delete and re-upload
  - Automatic image optimization
- **Social Media:**
  - URL validation
  - Helps users verify authenticity
  - Direct engagement links

**Validation:**
- **Shop Logo is REQUIRED** (cannot submit without it)
- URLs must be valid format

---

#### **Section F: Categories & Tags** 🏷️ (Shop Category Required)

**Purpose:** Make the shop searchable and filterable in Explore

##### **Shop Category** (Required)

| Field | Type | Required | Options |
|-------|------|----------|---------|
| **Shop Category** | Dropdown | ✅ **Yes** | Tailoring, Printing, Embroidery, Merchandising, Custom Apparel, Fabric Store, Design Studio, Mixed Services |

**Validation:**
- Must select one category
- Required for submission

##### **Service Tags** (Optional)

Multi-select checkboxes:
- ☐ Custom Designs
- ☐ Same-day Service
- ☐ Eco-friendly
- ☐ Digital Printing
- ☐ Bulk Orders
- ☐ Rush Orders
- ☐ Gift Items
- ☐ Corporate Branding

##### **Material Specialties** (Optional)

Multi-select checkboxes:
- ☐ Cotton
- ☐ Polyester
- ☐ Canvas
- ☐ Denim
- ☐ Silk
- ☐ Linen
- ☐ Leather
- ☐ Synthetic Fabrics

**Benefits:**
- Enables filtering in Explore page
- Helps customers find specialized services
- Improves shop discoverability

---

#### **Section G: Payment & Transaction Details** 💳 (Optional)

**Purpose:** Inform customers about payment options

##### **Preferred Payment Methods** (Optional)

Multi-select checkboxes:
- ☐ GCash
- ☐ PayMaya
- ☐ Bank Transfer
- ☐ Cash on Delivery
- ☐ Credit/Debit Card
- ☐ Over the Counter

##### **Account/Wallet Info** (Optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Payment Account Info** | Textarea | ⬜ No | Account numbers, wallet IDs, bank details for payouts |

**Example:**
```
GCash: 09XX-XXX-XXXX
BPI Account: XXX-XXXXXX-X
PayMaya: 09XX-XXX-XXXX
```

**Note:** Can be updated after approval

---

#### **Section H: Shop Policies** 🧾 (Optional)

**Purpose:** Set customer expectations about operations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Return Policy** | Textarea | ⬜ No | Return/refund policy (e.g., "Returns allowed within 7 days for defective items") |
| **Processing Time** | Text input | ⬜ No | How long orders take (e.g., "2-3 business days for standard orders") |
| **Shipping Options** | Multi-select | ⬜ No | Pickup, Local Delivery, Nationwide Shipping, Courier Services, Same-day Delivery |

**Benefits:**
- Reduces customer inquiries
- Sets clear expectations
- Improves trust and transparency

---

### **Step 3: Form Submission**
**Action:** User clicks **"Submit Application"** button

#### What happens:
1. **Client-side validation runs:**
   - Shop name ✅
   - Description (min 20 chars) ✅
   - Complete address (street, city, country) ✅
   - Contact info (phone, email) ✅
   - **Shop logo uploaded** ✅
   - **Shop category selected** ✅

2. **If validation fails:**
   - Error message displays at top of form
   - Form does not submit
   - User corrects issues and retries

3. **If validation passes:**
   - Button shows loading spinner: "Loading..."
   - API call to `/api/applications/shop` (POST)
   - Application created in Firestore (`shopApplications` collection)
   - User role updated to `pending_shop`
   - NextAuth session updated

4. **Success:**
   - Green success message: "Shop application submitted successfully!"
   - User redirected to `/my-applications?status=success&type=shop`

---

### **Step 4: Pending State (Application Under Review)**
**Page:** `/explore`  
**User Role:** `pending_shop`

#### What the user sees:

**Banner at top of page:**
```
⏳ Application Under Review

Your shop owner application is currently being reviewed by our team.
You'll receive an email notification once your application is processed.

[Check Application Status] button
```

**Changes:**
- ❌ "Become a Designer/Shop" cards are now **hidden**
- ✅ User can browse Explore page normally
- ✅ Can access other customer features

**Navigation:**
- Clicking **"Check Application Status"** → Redirects to `/my-applications`

---

### **Step 5: Application Tracking**
**Page:** `/my-applications`  
**User Role:** `pending_shop` (or after review: `business_owner` / `customer`)

#### What the user sees:

##### **While Pending:**

```
┌───────────────────────────────────────────────────┐
│ 🏪 Shop Owner Application                         │
│                                                   │
│ Status: 🟡 Pending                                │
│ Applied: November 12, 2025                        │
│                                                   │
│ Shop Name: [User's shop name]                    │
│ Category: [Selected category]                    │
│ Description: [First 100 characters...]           │
│ Location: [City, State]                          │
│                                                   │
│ ⏳ We're reviewing your application.              │
│    You'll be notified via email.                 │
└───────────────────────────────────────────────────┘
```

##### **After Approval:**

```
┌───────────────────────────────────────────────────┐
│ 🏪 Shop Owner Application                         │
│                                                   │
│ Status: ✅ Approved                               │
│ Applied: November 12, 2025                        │
│ Reviewed: November 12, 2025                       │
│                                                   │
│ Shop Name: [User's shop name]                    │
│ Category: [Selected category]                    │
│                                                   │
│ 🎉 Congratulations! Your application has been    │
│    approved. You can now access your Business    │
│    Dashboard.                                     │
│                                                   │
│ Admin Notes: [Optional feedback from admin]      │
│                                                   │
│ [Go to Business Dashboard] button                │
└───────────────────────────────────────────────────┘
```

##### **After Rejection:**

```
┌───────────────────────────────────────────────────┐
│ 🏪 Shop Owner Application                         │
│                                                   │
│ Status: ❌ Rejected                               │
│ Applied: November 12, 2025                        │
│ Reviewed: November 12, 2025                       │
│                                                   │
│ Shop Name: [User's shop name]                    │
│                                                   │
│ ⚠️ Unfortunately, your application was not        │
│    approved.                                      │
│                                                   │
│ Reason: [Admin's rejection reason]               │
│                                                   │
│ [Reapply] button                                 │
└───────────────────────────────────────────────────┘
```

---

### **Step 6: Admin Review Process**
**Page:** `/dashboard/admin/applications`  
**User Role:** `admin`

#### Admin sees:

**Tabs:**
- Designer Applications
- **Shop Applications** ← Admin clicks here

**Application Card displays:**
- **Shop Info:**
  - Shop name
  - Shop logo preview
  - Banner preview (if uploaded)
  - Tagline
  - Category
  - Description

- **Applicant Info:**
  - User name
  - Email
  - Applied date

- **Contact & Address:**
  - Phone, email
  - Full address

- **Business Documents:**
  - List of uploaded documents with labels
  - "View Document" links for each
  - Can download and verify

- **Branding:**
  - Social media links
  - Website URL

- **Services & Tags:**
  - Selected service tags
  - Material specialties
  - Services offered

- **Payment & Policies:**
  - Payment methods
  - Account info
  - Return policy
  - Processing time
  - Shipping options

#### Admin Actions:

**Option 1: Approve ✅**
- Admin clicks **"Approve"** button
- Optional: Add admin notes
- System updates:
  - Application status → `approved`
  - User role → `business_owner`
  - Records `reviewedAt`, `reviewedBy`
- Email notification sent to user

**Option 2: Reject ❌**
- Admin clicks **"Reject"** button
- **Required:** Enter rejection reason
- Optional: Add admin notes
- System updates:
  - Application status → `rejected`
  - User role → `customer` (reverted)
  - Records `reviewedAt`, `reviewedBy`, `rejectionReason`
- Email notification sent to user with reason

---

### **Step 7: Post-Approval (Business Owner)**
**User Role:** `business_owner`

#### What the user gains access to:

**1. Business Dashboard** (`/business/dashboard`)
- Shop management
- Product/listing management
- Order processing
- Analytics

**2. Shop Profile Setup** (First-time)
- If any required fields are missing from application:
  - Setup wizard appears
  - Guides through completing profile
  - Ensures all branding is complete

**3. Full Shop Owner Features:**
- Create and manage listings
- Process customer orders
- Update shop profile
- View analytics
- Manage inventory

---

### **Step 8: Reapplication (If Rejected)**
**User Role:** `customer` (after rejection)

#### User can reapply:
1. Navigate to `/explore`
2. **"Become a Shop Owner"** card reappears
3. Click to apply again at `/apply/shop`
4. Previous rejection reason is visible
5. Can submit improved application
6. Process repeats from Step 2

---

## 📊 Application Data Structure

### Stored in Firestore: `shopApplications` collection

```javascript
{
  // System Fields
  id: "auto-generated",
  userId: "user_id",
  userEmail: "user@example.com",
  userName: "John Doe",
  status: "pending" | "approved" | "rejected",
  appliedAt: Timestamp,
  reviewedAt?: Timestamp,
  reviewedBy?: "admin_id",
  adminNotes?: "string",
  rejectionReason?: "string",

  // Section A: Basic Info
  shopName: "My Shop",
  description: "Shop description...",

  // Section B: Contact
  contactInfo: {
    phone: "+1234567890",
    email: "shop@example.com"
  },

  // Section C: Address
  address: {
    street: "123 Main St",
    city: "City",
    state: "State",
    zipCode: "12345",
    country: "Country"
  },

  // Section D: Business Info
  businessDocuments: [
    {
      id: "doc-1",
      label: "DTI Registration",
      url: "https://...",
      fileName: "dti-reg.pdf"
    }
  ],
  businessRegistrationNumber: "BRN-123456",
  taxId: "000-000-000-000",
  specialties: ["Screen Printing", "Embroidery"],

  // Section E: Branding
  profileBanner: "https://...",
  shopLogo: "https://...",
  tagline: "Custom Tailoring with Passion",
  socialMedia: {
    facebook: "https://facebook.com/shop",
    instagram: "https://instagram.com/shop",
    tiktok: "https://tiktok.com/@shop"
  },
  websiteUrl: "https://shop.com",

  // Section F: Categories
  shopCategory: "Tailoring",
  serviceTags: ["Custom Designs", "Same-day Service"],
  materialSpecialties: ["Cotton", "Denim"],

  // Section G: Payment
  paymentMethods: ["GCash", "Bank Transfer"],
  paymentAccountInfo: "GCash: 0912-XXX-XXXX",

  // Section H: Policies
  returnPolicy: "Returns within 7 days...",
  processingTime: "2-3 business days",
  shippingOptions: ["Pickup", "Local Delivery"]
}
```

---

## 🔄 User Role Progression Summary

| Stage | Role | Can Apply? | Can Access Business Dashboard? |
|-------|------|------------|-------------------------------|
| 1. New User | `customer` | ✅ Yes | ❌ No |
| 2. Application Submitted | `pending_shop` | ❌ No (already pending) | ❌ No |
| 3. Application Approved | `business_owner` | ✅ No (already owner) | ✅ **Yes** |
| 4. Application Rejected | `customer` | ✅ Yes (can reapply) | ❌ No |

---

## 🎯 Key Validation Rules

### **Required Fields (Cannot submit without these):**
1. ✅ Shop Name
2. ✅ Description (min 20 characters)
3. ✅ Street Address
4. ✅ City
5. ✅ Country
6. ✅ Phone
7. ✅ Email
8. ✅ **Shop Logo**
9. ✅ **Shop Category**

### **Recommended Fields (Optional but encouraged):**
- Profile Banner
- Business Documents
- Social Media Links
- Service Tags
- Material Specialties
- Payment Methods
- Shop Policies

---

## 💡 Tips for Applicants

### **To Increase Approval Chances:**
1. **Upload Business Documents** - Speeds up verification
2. **Complete All Sections** - Shows professionalism
3. **Add High-Quality Images** - Logo and banner make a strong impression
4. **Write Detailed Description** - Explain services clearly
5. **Fill Social Media Links** - Builds trust and authenticity
6. **Set Clear Policies** - Return policy, processing time, shipping

### **Common Rejection Reasons:**
- ❌ Incomplete business documents
- ❌ Suspicious or fake information
- ❌ Low-quality images
- ❌ Vague or unclear shop description
- ❌ Missing contact information
- ❌ Duplicate application (already has a shop)

---

## 🔐 Security & Validation

### **Client-Side:**
- Form field validation
- File type and size checks
- URL format validation
- Character count limits

### **Server-Side:**
- Session authentication
- Role permission checks
- Duplicate application prevention
- Input sanitization
- Firebase security rules

---

## 📧 Email Notifications

### **User Receives:**
1. **Application Submitted** - Confirmation email
2. **Application Approved** - Congratulations email with dashboard link
3. **Application Rejected** - Notification with reason and reapply option

### **Admin Receives:**
1. **New Application** - Notification of new shop application for review

---

## 🚀 Future Enhancements (Roadmap)

### **Step 7.1: First-Time Setup Wizard** (Planned)
After approval, when user visits `/business/dashboard`:
- Show "Complete Your Shop Profile" wizard if fields are missing
- Guided steps:
  1. Confirm/upload logo and banner
  2. Add shop category and tags
  3. Set operating hours
  4. Add social media links
  5. Add first product/listing
- Ensures complete shop profiles before going live

### **Step 9: Analytics & Verification** (Planned)
- **Shop Verification Badge** - After admin verifies documents or performance
- **Analytics Dashboard** - Insights like visits, orders, reviews
- **Performance Metrics** - Track shop success and customer satisfaction

---

## 📝 Testing Checklist

### **For Manual Testing:**

- [ ] Can navigate to `/apply/shop` as customer
- [ ] All form sections render correctly
- [ ] Can upload business documents (multiple files)
- [ ] Can upload banner and logo images
- [ ] Can select category (required)
- [ ] Can select multiple service tags
- [ ] Can select multiple material specialties
- [ ] Can enter social media links
- [ ] Can select payment methods
- [ ] Can enter shop policies
- [ ] Form validation works (missing required fields)
- [ ] Shop logo validation works (required)
- [ ] Shop category validation works (required)
- [ ] Submit button shows loading state
- [ ] Application submits successfully
- [ ] User role updates to `pending_shop`
- [ ] Application appears in `/my-applications`
- [ ] "Under Review" banner shows on `/explore`
- [ ] Admin can see application in dashboard
- [ ] Admin can view all uploaded documents
- [ ] Admin can approve application
- [ ] User role updates to `business_owner` on approval
- [ ] User can access `/business/dashboard`
- [ ] Admin can reject application with reason
- [ ] User role reverts to `customer` on rejection
- [ ] User can reapply after rejection

---

## 🎨 UI/UX Highlights

### **Visual Indicators:**
- 🏪 Icons for each section
- 📋 Blue info boxes for document guidelines
- ✅ Green checkmarks for uploaded files
- 🟡 Yellow for pending status
- ✅ Green for approved status
- ❌ Red for rejected status

### **User-Friendly Features:**
- Character counter for description
- Image previews for uploads
- "Remove" buttons for uploaded files
- Loading spinners during uploads
- Clear error messages
- Helpful placeholder text
- Tooltips and help text

---

## 🎯 Conclusion

The shop owner application workflow is designed to be:
- **Comprehensive** - Collects all necessary information
- **User-Friendly** - Clear guidance at every step
- **Secure** - Proper validation and authentication
- **Transparent** - Users can track application status
- **Flexible** - Optional fields for quick applications
- **Professional** - Complete branding and business information

This ensures that approved shop owners have complete, professional profiles ready to attract customers on the Fabriqly platform.

---

**Document Version:** 2.0  
**Last Updated:** November 12, 2025  
**Status:** ✅ Implemented & Ready for Testing












