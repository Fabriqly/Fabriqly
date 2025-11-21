# Navigation Guide - Orders Page

## Current Navigation Structure

### Dashboard Sidebar Navigation
**File:** `src/components/layout/DashboardSidebar.tsx`

The sidebar already includes the Orders link:

```typescript
{
  name: 'Orders',
  href: '/dashboard/orders',
  icon: ShoppingCart,
  description: 'View and manage orders'
}
```

## Navigation Path

### For Shop Owners:
```
1. Log in as Business Owner/Shop Owner
2. Go to Dashboard
3. Look at left sidebar
4. Click "Orders" (with shopping cart icon 🛒)
5. Navigates to /dashboard/orders
```

## Sidebar Menu Structure

### For Business Owners:
1. **Dashboard** (Overview)
2. **Products** (Manage products)
3. **Shop Profile** (Manage shop)
4. **Customization** (Design requests)
5. **Orders** ← HERE (Manage orders)
6. **Finance** (Earnings & reports)
7. **Profile** (Edit profile)

### For Designers:
1. **Dashboard** (Overview)
2. **Designs** (Manage designs)
3. **Designer Profile** (Manage profile)
4. **Customization** (Design requests)
5. **Orders** ← HERE (View orders)
6. **Finance** (Earnings & reports)
7. **Profile** (Edit profile)

## Visual Appearance

### Desktop Sidebar:
```
┌──────────────────────┐
│  Dashboard           │
│  Products           │
│  Shop Profile       │
│  Customization      │
│  🛒 Orders          │ ← Click here!
│  Finance            │
│  Profile            │
└──────────────────────┘
```

### Mobile:
- Hamburger menu (☰) button at top left
- Click to open sidebar
- Same menu structure
- Click "Orders" to navigate

## Verification Steps

To verify Orders link is showing:

1. **Check User Role:**
   - Must be logged in
   - Role: business_owner or designer

2. **Check Sidebar:**
   - Left side of dashboard
   - Should see shopping cart icon
   - Text: "Orders"

3. **Click Orders:**
   - Should navigate to `/dashboard/orders`
   - Should see Orders Management page
   - Should see list of orders (if any)

## Troubleshooting

### If Orders link not visible:

1. **Check User Role:**
   ```javascript
   console.log(user?.role) // Should be 'business_owner' or 'designer'
   ```

2. **Check Path:**
   ```
   Current URL should be: /dashboard/*
   ```

3. **Refresh Page:**
   - Sometimes sidebar needs refresh
   - Hard refresh: Ctrl+Shift+R

4. **Check Browser Console:**
   - F12 → Console
   - Look for any errors

### If Orders page shows error:

1. **Check API:**
   ```
   GET /api/orders should return 200
   ```

2. **Check Auth:**
   ```
   User must be authenticated
   Session must be valid
   ```

## Quick Reference

| Element | Value |
|---------|-------|
| **Page** | `/dashboard/orders` |
| **Component** | `src/app/dashboard/orders/page.tsx` |
| **Sidebar** | `src/components/layout/DashboardSidebar.tsx` |
| **Icon** | ShoppingCart (from lucide-react) |
| **Position** | 5th item in sidebar |
| **Access** | All logged-in users |
| **Special Features** | Escrow integration for customization orders |

## Success Indicators

When working correctly, you should see:

✅ **Sidebar:**
- Orders link visible with cart icon
- Highlighted when on /dashboard/orders
- Clickable and responsive

✅ **Orders Page:**
- Title: "Orders Management"
- Search bar and filters
- List of orders (or empty state)
- Action buttons for each order

✅ **Customization Orders:**
- Purple/blue "🎨 Custom Design" badge
- Escrow notification when shipping
- Automatic payment release

---

**Status:** ✅ Navigation Already Complete
**Location:** Already in DashboardSidebar.tsx (lines 68-73)
**Action Required:** None - just navigate to Dashboard and click Orders!


