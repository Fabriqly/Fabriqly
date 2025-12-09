# Customization System - Access Guide by Role

## 🎯 Quick Access Summary

| Role | Primary Access | URL |
|------|---------------|-----|
| **Customer** | My Customizations or Product Page | `/my-customizations` or `/products/{id}/customize` |
| **Designer** | My Customizations | `/my-customizations` |
| **Business Owner** | My Customizations (same as Designer) | `/my-customizations` |
| **Admin** | My Customizations (full access) | `/my-customizations` |

---

## 👤 CUSTOMER ACCESS

### Method 1: From Product Page (Create New Request)

1. **Browse to any product**
   ```
   /products/{productId}
   ```

2. **Look for "Customize This Product" button**
   - Only appears on customizable products
   - If product has `isCustomizable: true`

3. **Click the button** → Redirects to:
   ```
   /products/{productId}/customize
   ```

4. **Fill out the customization form:**
   - Enter quantity
   - Add detailed instructions
   - Upload design files (optional, 20MB max)
   - Upload preview image (optional, 5MB max)
   - Submit request

### Method 2: From My Customizations (Track Existing Requests)

1. **Navigate to my customizations page:**
   ```
   /my-customizations
   ```

2. **What you see:**
   - List of all YOUR requests
   - Statistics: Total, Pending, In Progress, Completed
   - Filter by status
   - Status badges for each request

3. **Actions available:**
   - View request details
   - Review final designs
   - Approve designs
   - Request revisions
   - Cancel pending requests

### Customer Workflow Example

```
Step 1: Go to Product Page
   → /products/abc123

Step 2: Click "Customize This Product"
   → Redirected to /products/abc123/customize

Step 3: Fill Form & Submit
   → Redirected to /my-customizations?success=true

Step 4: Track Progress
   → Stay on /my-customizations
   → Wait for designer to claim and work on it

Step 5: Review (when notified)
   → Click "View Details" on request
   → Review final design
   → Approve or Request Revision
```

---

## 🎨 DESIGNER ACCESS

### Primary Access: Dashboard

1. **Navigate to customizations dashboard:**
   ```
   /my-customizations
   ```

2. **What you see:**
   - **Top Section**: "Available Requests" (pending requests from all customers)
   - **Bottom Section**: "My Active Requests" (requests you've claimed)
   - Auto-refresh every 30 seconds

3. **Actions available on Pending Requests:**
   - View customer requirements
   - See uploaded files
   - Claim request (assigns it to you)

4. **Actions available on Active Requests:**
   - View full details
   - Download customer files
   - Upload final design
   - Add notes for customer

### Designer Workflow Example

```
Step 1: Open Dashboard
   → /my-customizations

Step 2: View Available Requests
   → See list of pending requests
   → Read customer requirements
   → Click "View Details" to see more

Step 3: Claim a Request
   → Click "Claim Request"
   → Request moves to "My Active Requests" section

Step 4: Work on Design
   → Download customer files
   → Create design in Photoshop/Illustrator
   → Export final files

Step 5: Upload Final Work
   → Click "View Details" on your active request
   → Upload final design file (20MB max)
   → Upload preview image (5MB max, required)
   → Add notes (optional)
   → Submit

Step 6: Handle Revisions (if needed)
   → If customer rejects, see their feedback
   → Revise design
   → Re-upload
```

---

## 👔 BUSINESS OWNER ACCESS

**Business owners have the same access as designers.**

1. **Navigate to:**
   ```
   /my-customizations
   ```

2. **Features:**
   - View pending customer requests
   - Claim requests for your business
   - Upload final designs
   - Track your active work

---

## 🔧 ADMIN ACCESS

### Full System Access

1. **Navigate to customizations dashboard:**
   ```
   /my-customizations
   ```

2. **What you see (expanded access):**
   - All pending requests (like designers)
   - All active requests from all designers
   - Full system statistics
   - All customer requests

3. **Admin capabilities:**
   - View any request
   - Claim requests (like a designer)
   - Cancel any request
   - View all statistics
   - Monitor designer workload

### Admin-Specific API Access

```typescript
// View all requests (no filters)
GET /api/customizations

// View any specific request
GET /api/customizations/{anyRequestId}

// View system-wide statistics
GET /api/customizations/stats

// View all designer workloads
GET /api/customizations/workload
```

---

## 🗺️ Navigation Setup

### Add to Your Navigation Menu

You need to add the customization link to your existing navigation component:

```tsx
// In your navigation/sidebar component

const navigationItems = [
  // ... existing items
  
  // Add this for all authenticated users
  {
    name: 'Customizations',
    href: '/my-customizations',
    icon: Paintbrush, // or any icon you prefer
    roles: ['customer', 'designer', 'business_owner', 'admin']
  }
];
```

### Add Customize Button to Product Pages

In your product detail page component:

```tsx
import { CustomizeButton } from '@/components/customization/CustomizeButton';

export default function ProductDetailPage({ product }) {
  return (
    <div>
      {/* ... product details ... */}
      
      {/* Add this button */}
      <CustomizeButton 
        productId={product.id}
        isCustomizable={product.isCustomizable}
        variant="primary"
        className="mt-4"
      />
      
      {/* ... rest of page ... */}
    </div>
  );
}
```

---

## 📱 Direct URL Access

### For Customers
```
Create Request:  /products/{productId}/customize
View Requests:   /my-customizations
```

### For Designers
```
Dashboard:       /my-customizations
```

### For Business Owners
```
Dashboard:       /my-customizations
```

### For Admins
```
Dashboard:       /my-customizations
```

---

## 🎭 Role-Based UI Differences

### Customer View (`/my-customizations`)
```
┌─────────────────────────────────────────┐
│  My Customization Requests              │
├─────────────────────────────────────────┤
│  Statistics: Total, Pending, etc.       │
├─────────────────────────────────────────┤
│  Filter: All | Pending | In Progress    │
├─────────────────────────────────────────┤
│  [Request 1]  Status: In Progress       │
│    View Details  ▶                      │
│  [Request 2]  Status: Awaiting Approval │
│    View Details  ▶                      │
│  [Request 3]  Status: Completed         │
│    View Details  ▶                      │
└─────────────────────────────────────────┘
```

### Designer View (`/my-customizations`)
```
┌─────────────────────────────────────────┐
│  Available Requests                     │
├─────────────────────────────────────────┤
│  [Request A]  Customer: John Doe        │
│    View Details | Claim Request ▶       │
│  [Request B]  Customer: Jane Smith      │
│    View Details | Claim Request ▶       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  My Active Requests                     │
├─────────────────────────────────────────┤
│  Statistics: Active, Completed Today    │
├─────────────────────────────────────────┤
│  [Request 1]  Status: In Progress       │
│    View Details ▶                       │
│  [Request 2]  Status: Awaiting Approval │
│    View Details ▶                       │
└─────────────────────────────────────────┘
```

### Admin View (`/my-customizations`)
```
┌─────────────────────────────────────────┐
│  Customization Requests (System-wide)   │
├─────────────────────────────────────────┤
│  Available Requests: 5                  │
│  Active Requests: 12                    │
│  Awaiting Approval: 3                   │
├─────────────────────────────────────────┤
│  [Same interface as Designer]           │
│  + Access to all requests               │
│  + Full statistics                      │
│  + Workload monitoring                  │
└─────────────────────────────────────────┘
```

---

## 🔐 Access Control Summary

| Action | Customer | Designer | Business Owner | Admin |
|--------|----------|----------|----------------|-------|
| Create Request | ✅ | ❌ | ❌ | ✅ |
| View Own Requests | ✅ | ✅ | ✅ | ✅ |
| View All Requests | ❌ | ❌ | ❌ | ✅ |
| View Pending | ❌ | ✅ | ✅ | ✅ |
| Claim Request | ❌ | ✅ | ✅ | ✅ |
| Upload Final Design | ❌ | ✅ | ✅ | ✅ |
| Approve/Reject | ✅ Own | ❌ | ❌ | ✅ |
| Cancel Request | ✅ Own | ❌ | ❌ | ✅ |

---

## 🚀 Testing Access

### Test as Customer

1. **Login as customer**
2. **Go to any product page** with `isCustomizable: true`
3. **Click "Customize This Product"**
4. **Submit a test request**
5. **Go to `/my-customizations`** to track it

### Test as Designer

1. **Login as designer**
2. **Go to `/my-customizations`**
3. **See pending requests in "Available Requests" section**
4. **Click "Claim Request"**
5. **Upload final work**

### Test as Admin

1. **Login as admin**
2. **Go to `/my-customizations`**
3. **See all system requests**
4. **View statistics**
5. **Monitor designer workload**

---

## 💡 Pro Tips

### For Customers
- Provide detailed instructions for better results
- Upload reference images when possible
- Check dashboard regularly for updates
- Be specific in revision requests

### For Designers
- Check dashboard frequently for new requests
- Download all customer files before starting
- Upload high-quality preview images
- Add helpful notes for customers

### For Admins
- Monitor pending requests to ensure timely claims
- Track designer workload for load balancing
- Review statistics to optimize the system

---

## 📞 Quick Help

**Can't see customization option on product?**
- Product must have `isCustomizable: true` in database
- Check if you're logged in

**Don't see pending requests as designer?**
- Refresh the page (auto-refreshes every 30s)
- Check if all requests have been claimed

**Can't access dashboard?**
- Verify you're authenticated
- Check your user role
- URL: `/my-customizations`

---

## 🎯 Summary

**One Dashboard, Different Views:**
- **Everyone goes to**: `/my-customizations`
- **What you see depends on your role**
- **System automatically shows the right interface**

**Customer Journey**: Product Page → Customize → Dashboard  
**Designer Journey**: Dashboard → Claim → Work → Upload  
**Admin Journey**: Dashboard → Monitor Everything

