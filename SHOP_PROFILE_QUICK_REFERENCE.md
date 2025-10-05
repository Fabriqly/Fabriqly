# Shop Profile System - Quick Reference Card

## 📁 File Locations

| Component | Path |
|-----------|------|
| Types | `src/types/shop-profile.ts` |
| Repository | `src/repositories/ShopProfileRepository.ts` |
| Service | `src/services/ShopProfileService.ts` |
| API Routes | `src/app/api/shop-profiles/` |
| Components | `src/components/shop/` |
| Pages | `src/app/shops/` |
| Admin | `src/app/dashboard/admin/shops/` |

## 🔗 Quick Links

| Route | Description |
|-------|-------------|
| `/shops` | Browse all shops |
| `/shops/create` | Create shop |
| `/shops/[username]` | View shop |
| `/shops/[username]/edit` | Edit shop |
| `/dashboard/admin/shops` | Admin panel |

## 🌐 API Endpoints

### Public
```
GET    /api/shop-profiles                    # List shops
GET    /api/shop-profiles/[id]               # Get by ID
GET    /api/shop-profiles/username/[username] # Get by username
GET    /api/shop-profiles/search?q=term      # Search
GET    /api/shop-profiles/featured           # Featured shops
GET    /api/shop-profiles/[id]/stats         # Shop stats
```

### Authenticated
```
POST   /api/shop-profiles                    # Create
PATCH  /api/shop-profiles/[id]               # Update
DELETE /api/shop-profiles/[id]               # Delete
```

### Admin
```
GET    /api/admin/shop-profiles/pending      # Pending list
GET    /api/admin/shop-profiles/stats        # Approval stats
POST   /api/admin/shop-profiles/approve      # Approve
POST   /api/admin/shop-profiles/reject       # Reject
```

## 💻 Code Examples

### Create Shop
```typescript
const response = await fetch('/api/shop-profiles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shopName: 'My Shop',
    username: 'myshop',
    businessOwnerName: 'John Doe',
    contactInfo: { email: 'shop@example.com' },
    businessDetails: { businessType: 'msme' },
    description: 'We create...',
    supportedProductCategories: ['cat-id-1']
  })
});
```

### Get Shops
```typescript
// All shops
const shops = await fetch('/api/shop-profiles?approvalStatus=approved');

// Search
const results = await fetch('/api/shop-profiles/search?q=custom');

// By username
const shop = await fetch('/api/shop-profiles/username/myshop');
```

### Use Components
```tsx
// Form
import ShopProfileForm from '@/components/shop/ShopProfileForm';
<ShopProfileForm onSubmit={handleSubmit} isEditing={false} />

// View
import ShopProfileView from '@/components/shop/ShopProfileView';
<ShopProfileView shop={shopData} showEditButton={true} />

// List
import ShopList from '@/components/shop/ShopList';
<ShopList initialShops={shops} />
```

## 🔐 Permissions

| Action | Required Role |
|--------|---------------|
| View shops | None (public) |
| Create shop | Authenticated user |
| Edit shop | Shop owner |
| Delete shop | Shop owner |
| Approve/Reject | Admin |
| Verify shop | Admin |
| View pending | Admin |

## 📊 Shop Profile Fields

### Required Fields
- ✅ shopName
- ✅ username
- ✅ businessOwnerName
- ✅ contactInfo.email
- ✅ businessDetails.businessType
- ✅ description (20-1000 chars)
- ✅ supportedProductCategories (min 1)

### Optional Fields
- contactInfo.phone
- location (city, province, address)
- branding (logo, banner, tagline)
- businessDetails (hours, permits)
- specialties
- customizationPolicy
- socialMedia (facebook, instagram, tiktok, twitter)
- website

## ⚙️ Business Types
```typescript
'individual'        // Individual seller
'msme'             // MSME business
'printing_partner' // Printing partner
```

## 📋 Approval Status
```typescript
'pending'    // Awaiting approval
'approved'   // Active and visible
'rejected'   // Not approved
'suspended'  // Temporarily disabled
```

## ✅ Validation Rules

| Field | Rule |
|-------|------|
| shopName | 2-100 chars, unique |
| username | 3-50 chars, alphanumeric + `-_`, unique |
| email | Valid email format |
| phone | Valid phone format |
| description | 20-1000 chars |
| specialties | Max 20 items |
| URL fields | Valid URL format |

## 🎯 Common Queries

```typescript
// Service methods
shopProfileService.getShopProfile(id)
shopProfileService.getShopProfileByUsername(username)
shopProfileService.searchShops(term)
shopProfileService.getTopRatedShops(10)
shopProfileService.getFeaturedShops(6)
shopProfileService.approveShop(id, adminId)
shopProfileService.rejectShop(id, adminId, reason)
```

## 🗄️ Database

**Collection**: `shopProfiles`

**Key Fields**:
- id, shopName, username, userId
- approvalStatus, isVerified, isActive, isFeatured
- ratings, shopStats
- createdAt, updatedAt

## 🚀 Quick Commands

```bash
# Development
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Username taken | Use different username |
| Shop not found | Check approval status |
| Permission denied | Verify ownership/admin role |
| Images not loading | Check URL validity |
| Validation failed | Review required fields |

## 📈 Performance

- **Cache Duration**: 
  - Profiles: 15 minutes
  - Lists: 5 minutes
  - Stats: 5 minutes
- **View Increment**: Async (non-blocking)
- **Query Limit**: Use `limit` parameter

## 🎨 UI Components

### ShopProfileForm Props
```typescript
{
  onSubmit: (data) => Promise<void>
  initialData?: Partial<CreateShopProfileData>
  isEditing?: boolean
}
```

### ShopProfileView Props
```typescript
{
  shop: ShopProfile
  showEditButton?: boolean
  onEdit?: () => void
}
```

### ShopList Props
```typescript
{
  initialShops?: ShopProfile[]
  searchTerm?: string
  category?: string
}
```

## 🔔 Key Features

- ✅ Multi-step form validation
- ✅ Real-time availability check
- ✅ Image preview support
- ✅ Responsive design
- ✅ Search & filter
- ✅ Admin approval workflow
- ✅ Statistics tracking
- ✅ Activity logging
- ✅ Caching strategy
- ✅ Permission system

## 📚 Documentation

- **Full Docs**: `docs/SHOP_PROFILE_SYSTEM.md`
- **Setup Guide**: `docs/SHOP_PROFILE_SETUP.md`
- **Summary**: `SHOP_PROFILE_IMPLEMENTATION_SUMMARY.md`

## 🆘 Support

1. Check documentation
2. Review error messages
3. Verify permissions
4. Check browser console
5. Review API responses
6. Contact dev team

---

**Quick Reference v1.0** | Last Updated: Oct 4, 2025


