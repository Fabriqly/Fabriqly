# How the Watermark System Works

## Overview

The watermark system protects designer intellectual property by applying watermarks to images **before** they reach the browser. This ensures that when users download images, they get watermarked versions - not clean, high-quality originals.

## Key Principle

**Watermarks are applied to FREE/PREVIEW images only.**
**Purchased images are served WITHOUT watermarks.**

## How It Works

### 1. **Image Storage**

All original images are stored in **private Supabase buckets**:
- `designs-private` - for design files
- `products-private` - for product images

These buckets are **not publicly accessible** - users cannot directly download images from them.

### 2. **Two Different Image Paths**

When a user views an image, the system checks: **"Has this user purchased this design/product?"**

#### Path A: **User HAS Purchased** ✅
```
User → WatermarkedImage Component → Purchase Verification API
→ "Yes, user purchased" → Signed URL API → Clean Image (NO watermark)
```

**Result:** User sees clean, high-quality image without watermark

#### Path B: **User HAS NOT Purchased** 🔒
```
User → WatermarkedImage Component → Purchase Verification API
→ "No, user hasn't purchased" → Watermark API → Edge Function → Watermarked Image
```

**Result:** User sees image WITH watermark overlay

### 3. **The Watermark Process (For Non-Purchased Users)**

When a non-purchased user requests an image:

1. **Frontend (`WatermarkedImage` component)** detects user hasn't purchased
2. **Calls `/api/watermark`** (Next.js API route)
3. **API route** adds authentication and calls **Supabase Edge Function**
4. **Edge Function** (`watermark` function):
   - Downloads original image from private bucket
   - Applies semi-transparent dark overlay in the center
   - Returns watermarked image to browser
5. **Browser displays** the watermarked image

### 4. **The Clean Image Process (For Purchased Users)**

When a purchased user requests an image:

1. **Frontend** detects user has purchased (via `/api/purchases/verify`)
2. **Calls `/api/images/signed-url`** (Next.js API route)
3. **API route** generates a **signed URL** (temporary access token)
4. **Signed URL** gives user temporary access to private bucket
5. **Browser displays** clean image directly from Supabase Storage

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Views Design Page                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         WatermarkedImage Component Checks Purchase           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ Has Purchased?               │ Has NOT Purchased?
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│   /api/purchases/verify   │    │   /api/purchases/verify      │
│   Returns: hasPurchased   │    │   Returns: hasPurchased      │
│   = true                  │    │   = false                   │
└───────────┬───────────────┘    └──────────────┬───────────────┘
            │                                    │
            ▼                                    ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│  /api/images/signed-url   │    │    /api/watermark           │
│  Generates temporary URL  │    │    (Next.js proxy)          │
└───────────┬───────────────┘    └──────────────┬───────────────┘
            │                                    │
            ▼                                    ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│  Supabase Storage        │    │  Supabase Edge Function      │
│  (Private Bucket)        │    │  (watermark function)        │
│                          │    │                              │
│  Returns: Clean Image    │    │  1. Downloads from bucket   │
│  (No watermark)          │    │  2. Applies watermark       │
│                          │    │  3. Returns watermarked img  │
└───────────┬───────────────┘    └──────────────┬───────────────┘
            │                                    │
            └──────────────┬─────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Browser Displays Image to User                  │
│  ✅ Purchased: Clean image (no watermark)                   │
│  🔒 Not Purchased: Watermarked image (with overlay)         │
└─────────────────────────────────────────────────────────────┘
```

## Security Features

### 1. **Server-Side Watermarking**
- Watermarks are applied **on the server** (Edge Function)
- Users cannot bypass watermarks by inspecting browser code
- "Save Image As" saves the watermarked version

### 2. **Private Storage**
- Original images are in **private buckets**
- Cannot be accessed without authentication
- Only service role key can access them

### 3. **Purchase Verification**
- Checks Firestore `Orders` collection
- Verifies user actually purchased the item
- Server-side verification (cannot be faked)

### 4. **Signed URLs for Purchased Content**
- Temporary access tokens (expire after 1 hour)
- Only generated for verified purchases
- Direct access to clean images

## When Watermarks Are Applied

### ✅ **Watermarks ARE Applied:**
- **Premium designs** - ALWAYS watermarked (even if free) until purchased
- **Paid Template/Custom designs** viewed by **non-purchased users**
- **Paid products** viewed by **non-purchased users**
- **Anyone** viewing paid content they haven't purchased
- **Logged-out users** viewing paid designs/products

### ❌ **Watermarks are NOT Applied:**
- **Free Template/Custom designs** (marked as "This design is free to download")
- **Users who purchased** the design/product (any type)
- **Anyone** viewing free Template/Custom designs (no purchase required)
- **Designers viewing their own** uploaded designs (if you add this feature)
- **Admins** (if you add admin bypass)

## Design Type Rules

The watermark system applies different rules based on design type:

### **Premium Designs** 🏆
- **Always watermarked** (even if marked as free)
- **Maximum protection** - requires purchase to remove watermark
- **Use case:** High-value, exclusive designs that need extra protection

### **Template Designs** 📋
- **Free templates:** No watermark (accessible to everyone)
- **Paid templates:** Watermarked until purchased
- **Use case:** Reusable templates meant to be shared

### **Custom Designs** 🎨
- **Free custom:** No watermark (accessible to everyone)
- **Paid custom:** Watermarked until purchased
- **Use case:** Custom designs follow standard pricing rules

## Example Scenarios

### Scenario 1: Free User Browsing PAID Design
```
1. User visits paid design page (not logged in or hasn't purchased)
2. System checks: Design is NOT free, user hasn't purchased
3. Image loads via Edge Function with watermark
4. User sees watermarked preview
5. User right-clicks "Save Image As" → Gets watermarked image ✅
```

### Scenario 1b: User Browsing FREE Template/Custom Design
```
1. User visits free Template/Custom design page (anyone, logged in or not)
2. System checks: Design IS free (pricing.isFree = true) AND type is Template/Custom
3. Image loads via signed URL (clean image, no watermark)
4. User sees clean, high-quality image
5. User right-clicks "Save Image As" → Gets clean image ✅
```

### Scenario 1c: User Browsing FREE Premium Design
```
1. User visits free Premium design page (anyone, logged in or not)
2. System checks: Design IS free BUT type is Premium
3. Premium rule: Always watermarked (even if free)
4. Image loads via Edge Function with watermark
5. User sees watermarked preview
6. User right-clicks "Save Image As" → Gets watermarked image ✅
7. User must purchase to get clean image
```

### Scenario 2: User Purchases PAID Design
```
1. User completes purchase → Order created in Firestore
2. User views design page again
3. System checks: Design is NOT free, but purchase found ✅
4. Image loads via signed URL (clean image)
5. User sees clean, high-quality image
6. User right-clicks "Save Image As" → Gets clean image ✅
```

### Scenario 3: User Tries to Bypass
```
1. User inspects browser code
2. Tries to find direct image URL
3. Finds only Edge Function URL or signed URL
4. Cannot access private bucket directly
5. All downloads are watermarked (if not purchased) ✅
```

## Technical Components

### 1. **WatermarkedImage Component** (`src/components/ui/WatermarkedImage.tsx`)
- React component that decides which URL to use
- Checks purchase status
- Handles image loading and errors

### 2. **Purchase Verification API** (`/api/purchases/verify`)
- Server-side endpoint
- Queries Firestore for user's orders
- Returns purchase status

### 3. **Watermark Proxy API** (`/api/watermark`)
- Next.js API route
- Adds authentication headers
- Proxies requests to Edge Function

### 4. **Edge Function** (`supabase/functions/watermark/index.ts`)
- Server-side image processing
- Downloads from private bucket
- Applies watermark overlay
- Returns watermarked image

### 5. **Signed URL API** (`/api/images/signed-url`)
- Generates temporary access tokens
- Only for purchased content
- Direct access to clean images

## Summary

**Watermark Rules by Design Type:**

| Design Type | Free Status | Watermark Applied? |
|------------|-------------|-------------------|
| **Premium** | Free | ✅ **YES** (always, even if free) |
| **Premium** | Paid (not purchased) | ✅ **YES** |
| **Premium** | Paid (purchased) | ❌ **NO** |
| **Template/Custom** | Free | ❌ **NO** (accessible to everyone) |
| **Template/Custom** | Paid (not purchased) | ✅ **YES** |
| **Template/Custom** | Paid (purchased) | ❌ **NO** |

**Key Principles:**
- ✅ **Premium designs** = Maximum protection (always watermarked unless purchased)
- ✅ **Template/Custom designs** = Standard rules (free = no watermark, paid = watermark until purchased)
- ✅ Designers' IP is protected
- ✅ Free Template/Custom users get clean images
- ✅ Premium designs require purchase for clean images (even if marked free)
- ✅ Downloads are always watermarked (unless purchased or free Template/Custom)
- ✅ Cannot be bypassed by browser inspection

