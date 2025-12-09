# Customer Access Guide - Correct Routing Structure

## ⚠️ Important: Separation of Concerns

**Customers should NEVER access the business dashboard** (`/dashboard`).

The `/dashboard` route is **ONLY for**:
- Designers
- Business Owners
- Admins

Customers have their **own dedicated pages** outside the dashboard.

---

## ✅ Correct Access Routes

### **For Customers** 👤

#### 1. **Main Customer Page**
- Route: `/my-customizations`
- Access: Customer navigation menu (user dropdown)
- Purpose: View all customization requests

#### 2. **Create Customization**
- Route: `/products/{productId}/customize`
- Access: From product detail page
- Purpose: Create new customization request

#### 3. **Browse Products**
- Route: `/explore` or `/products`
- Access: Main navigation
- Purpose: Browse customizable products

#### 4. **Orders**
- Route: `/orders`
- Access: Customer navigation menu
- Purpose: View orders (separate from customizations)

---

### **For Designers** 🎨

#### 1. **Designer Dashboard**
- Route: `/dashboard/customizations`
- Access: Dashboard sidebar
- Purpose: Manage customization requests

#### 2. **Design Portfolio**
- Route: `/dashboard/designs`
- Access: Dashboard sidebar
- Purpose: Manage design uploads

---

### **For Business Owners** 🏭

#### 1. **Production Management**
- Route: `/dashboard/production`
- Access: Dashboard sidebar
- Purpose: Manage production workflow

#### 2. **Shop Management**
- Route: `/dashboard/shop-profile`
- Access: Dashboard sidebar
- Purpose: Manage shop settings

---

## 🧪 Manual Testing - Customer Flow

### Step 1: Login as Customer

```bash
# Navigate to
http://localhost:3000/login
```

### Step 2: Access Customizations

**Option A: Via Navigation Menu**
1. Click user avatar/name in top right
2. Click "My Customizations"
3. You'll be at: `/my-customizations`

**Option B: Direct URL**
```bash
http://localhost:3000/my-customizations
```

### Step 3: What You'll See

The customer customization page (`/my-customizations`) shows:

- ✅ All your customization requests
- ✅ Status of each request
- ✅ Transaction Chat (when designer assigned)
- ✅ Pricing agreement (if created by designer)
- ✅ Payment options
- ✅ Shop selection button (after approval)
- ✅ Production tracker
- ✅ Complete transaction button
- ✅ Review submission

### Step 4: Full Customer Workflow

```
1. Browse Products → /explore
2. Select Product → /products/{id}
3. Click "Customize" → /products/{id}/customize
4. Submit Request
5. Track Request → /my-customizations
6. Chat with Designer
7. Agree to Pricing
8. Make Payment
9. Approve Design
10. Select Printing Shop
11. Track Production
12. Complete Transaction
13. Leave Reviews
```

---

## 🚫 What Customers CANNOT Access

Customers should be **blocked** from:

- `/dashboard` - Business dashboard
- `/dashboard/customizations` - Designer view
- `/dashboard/production` - Production management
- `/dashboard/designs` - Design management
- `/dashboard/products` - Product management
- `/dashboard/admin/*` - Admin pages

### Security Implementation

The `/my-customizations` page already includes:

```typescript
useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/login');
  } else if (status === 'authenticated' && session?.user?.role !== 'customer') {
    router.push('/dashboard'); // Redirect non-customers to dashboard
  }
}, [status, session, router]);
```

---

## 📊 Route Summary Table

| User Type | Customization Route | Purpose |
|-----------|-------------------|---------|
| **Customer** | `/my-customizations` | View and manage their requests |
| **Designer** | `/dashboard/customizations` | Claim and work on requests |
| **Business Owner** | `/dashboard/production` | Manage production |
| **Admin** | `/dashboard/customizations` | Overview of all requests |

---

## 🔧 Quick Setup Checklist

### For Customers:

- [x] Create `/my-customizations` page
- [x] Add link to customer navigation menu
- [x] Implement role-based access control
- [x] Integrate all features (chat, payment, shop selection, reviews)

### For Designers/Business Owners:

- [x] Keep existing `/dashboard/customizations` page
- [x] Add `/dashboard/production` page for business owners
- [x] Maintain dashboard sidebar navigation

---

## 🎯 Testing Access Control

### Test 1: Customer tries to access dashboard
```
1. Login as customer
2. Try to access: http://localhost:3000/dashboard/customizations
3. Expected: Redirect to /my-customizations or /dashboard
```

### Test 2: Designer tries to access customer page
```
1. Login as designer
2. Try to access: http://localhost:3000/my-customizations
3. Expected: Redirect to /dashboard
```

### Test 3: Customer accesses their page
```
1. Login as customer
2. Access: http://localhost:3000/my-customizations
3. Expected: See their customization requests
```

---

## 🚀 How to Access New Features (Correct Way)

### **As a Customer:**

1. **Login**: Go to `/login`
2. **Navigate**: Click your profile icon → "My Customizations"
3. **Or Direct**: Go to `/my-customizations`
4. **Features Available**:
   - View all requests
   - Chat with designer
   - Agree to pricing
   - Make payments
   - Select printing shop
   - Track production
   - Complete transaction
   - Leave reviews

### **As a Designer:**

1. **Login**: Go to `/login`
2. **Navigate**: Dashboard sidebar → "Customizations"
3. **Or Direct**: Go to `/dashboard/customizations`
4. **Features Available**:
   - View pending requests
   - Claim requests
   - Chat with customer
   - Create pricing
   - Upload designs
   - Track status

### **As a Business Owner:**

1. **Login**: Go to `/login`
2. **Navigate**: Dashboard sidebar → "Production"
3. **Or Direct**: Go to `/dashboard/production`
4. **Features Available**:
   - View production requests
   - Confirm production
   - Start production
   - Update status
   - Complete production

---

## 📝 Key Takeaways

✅ **Customers use**: `/my-customizations`
✅ **Designers use**: `/dashboard/customizations`
✅ **Business Owners use**: `/dashboard/production`

❌ **Don't mix customer pages with business dashboard**
❌ **Don't give customers access to `/dashboard` routes**

---

## 🔗 Related Documentation

- **Customer Features**: See `/my-customizations` page implementation
- **Full Workflow**: See `DESIGN_COLLABORATION_WORKFLOW.md`
- **Quick Start**: See `QUICK_START_GUIDE.md`
- **API Routes**: All work the same regardless of user interface

---

**The separation is clear: Customers have their own dedicated page at `/my-customizations`, completely separate from the business dashboard!** ✨



















