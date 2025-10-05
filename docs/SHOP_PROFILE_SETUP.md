# Shop Profile System - Quick Setup Guide

## Prerequisites

- Node.js installed
- Firebase project configured
- Next.js application running
- User authentication setup

## Installation Steps

### 1. Verify File Structure

Ensure all files are in place:

```
src/
├── types/
│   └── shop-profile.ts
├── repositories/
│   └── ShopProfileRepository.ts
├── services/
│   ├── ShopProfileService.ts
│   └── interfaces/
│       └── IShopProfileService.ts
├── app/
│   ├── api/
│   │   └── shop-profiles/
│   │       ├── route.ts
│   │       ├── [id]/
│   │       │   ├── route.ts
│   │       │   └── stats/route.ts
│   │       ├── search/route.ts
│   │       ├── featured/route.ts
│   │       └── username/[username]/route.ts
│   │   └── admin/
│   │       └── shop-profiles/
│   │           ├── approve/route.ts
│   │           ├── reject/route.ts
│   │           ├── pending/route.ts
│   │           └── stats/route.ts
│   ├── shops/
│   │   ├── page.tsx
│   │   ├── create/page.tsx
│   │   └── [username]/
│   │       ├── page.tsx
│   │       └── edit/page.tsx
│   └── dashboard/
│       └── admin/
│           └── shops/page.tsx
└── components/
    └── shop/
        ├── ShopProfileForm.tsx
        ├── ShopProfileView.tsx
        └── ShopList.tsx
```

### 2. Firebase Collection Setup

The `shopProfiles` collection will be created automatically when the first shop is created. No manual setup required.

### 3. Configure Firestore Indexes (if needed)

If you encounter query errors, add these indexes in Firebase Console:

```
Collection: shopProfiles
Fields:
- approvalStatus (Ascending) + createdAt (Descending)
- isActive (Ascending) + approvalStatus (Ascending) + ratings.averageRating (Descending)
- businessDetails.businessType (Ascending) + isActive (Ascending)
- location.city (Ascending) + approvalStatus (Ascending)
```

### 4. Update Navigation

Add shop profile links to your navigation:

```tsx
// In your navigation component
<Link href="/shops">Browse Shops</Link>
<Link href="/shops/create">Create Shop</Link>
```

### 5. Add Admin Navigation

For admin dashboard:

```tsx
// In admin dashboard navigation
<Link href="/dashboard/admin/shops">Shop Management</Link>
```

## Usage Examples

### Creating a Shop Profile

```typescript
// On the client side
const handleCreateShop = async () => {
  const response = await fetch('/api/shop-profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopName: 'My Awesome Shop',
      username: 'myshop',
      businessOwnerName: 'John Doe',
      contactInfo: {
        email: 'shop@example.com',
        phone: '+63 912 345 6789'
      },
      businessDetails: {
        businessType: 'msme'
      },
      description: 'We create amazing custom products...',
      supportedProductCategories: ['category-id-1']
    })
  });
  
  const data = await response.json();
  console.log(data);
};
```

### Fetching Shop Profiles

```typescript
// Get all approved shops
const shops = await fetch('/api/shop-profiles?approvalStatus=approved&isActive=true');

// Search shops
const results = await fetch('/api/shop-profiles/search?q=custom+shirts');

// Get shop by username
const shop = await fetch('/api/shop-profiles/username/myshop');
```

### Admin Operations

```typescript
// Approve a shop
const response = await fetch('/api/admin/shop-profiles/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ shopId: 'shop-id-here' })
});

// Reject a shop
const response = await fetch('/api/admin/shop-profiles/reject', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    shopId: 'shop-id-here',
    reason: 'Incomplete information' 
  })
});
```

## Testing the System

### 1. Test Shop Creation

1. Navigate to `/shops/create`
2. Fill in all required fields
3. Submit the form
4. Verify shop appears in pending approvals

### 2. Test Admin Approval

1. Login as admin
2. Navigate to `/dashboard/admin/shops`
3. Review pending shop
4. Approve or reject the shop

### 3. Test Shop Viewing

1. Navigate to `/shops`
2. Browse shops
3. Click on a shop to view details
4. Verify all information displays correctly

### 4. Test Shop Editing

1. Navigate to your shop page
2. Click "Edit Profile"
3. Make changes
4. Save and verify updates

## Common Customizations

### Changing Business Types

Edit `src/types/shop-profile.ts`:

```typescript
export type BusinessType = 'individual' | 'msme' | 'printing_partner' | 'your_new_type';
```

### Adding Custom Fields

1. Update type in `src/types/shop-profile.ts`
2. Update repository if needed
3. Update form component
4. Update view component
5. Update validation in service

### Modifying Approval Workflow

Edit `src/services/ShopProfileService.ts` methods:
- `approveShop()`
- `rejectShop()`
- `suspendShop()`
- `activateShop()`

### Customizing UI

Components are in `src/components/shop/`:
- Modify `ShopProfileForm.tsx` for form fields
- Modify `ShopProfileView.tsx` for display layout
- Modify `ShopList.tsx` for shop cards

## Environment Variables

No additional environment variables needed. The system uses existing Firebase and authentication configuration.

## Permissions Setup

Ensure your Next.js authentication handles these roles:
- `customer` - Can view shops
- `business_owner` - Can create and manage own shop
- `admin` - Can approve/reject/manage all shops

## Security Checklist

- [x] Authentication required for creation
- [x] Owner verification for editing
- [x] Admin role check for approvals
- [x] Input validation on all fields
- [x] URL validation for external links
- [x] Permission checks in API routes

## Troubleshooting

### "Collection not found" error
- The collection is created automatically on first write
- Check Firebase permissions

### "Username already taken"
- Usernames must be unique
- Check existing shops in Firebase

### Images not displaying
- Verify image URLs are accessible
- Check CORS settings if hosting images
- Implement error handling for broken images

### Permission denied errors
- Verify user authentication
- Check user role
- Verify shop ownership

## Next Steps

After setup:

1. **Create test shop profiles** to verify functionality
2. **Set up admin accounts** for approval management
3. **Configure Firebase indexes** if needed
4. **Customize styling** to match your brand
5. **Add analytics tracking** for shop views
6. **Implement image upload** if not using external URLs
7. **Set up email notifications** for approvals
8. **Add shop reviews** system
9. **Integrate with product management**
10. **Set up monitoring** for shop performance

## Support Resources

- **Full Documentation**: See `SHOP_PROFILE_SYSTEM.md`
- **API Reference**: Check API endpoints section
- **Component Docs**: See component usage examples
- **Database Schema**: Review collection structure

## Quick Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linter
npm run lint
```

## Performance Tips

1. **Enable caching** - Shop profiles are cached for 15 minutes
2. **Use pagination** - Limit results in shop lists
3. **Optimize images** - Use appropriate sizes for logos/banners
4. **Lazy load** - Implement lazy loading for shop lists
5. **CDN** - Use CDN for static assets

## Monitoring

Track these metrics:
- Shop creation rate
- Approval time
- Active shops count
- Shop views
- Search queries
- Error rates

## Deployment Checklist

Before deploying to production:

- [ ] Test all API endpoints
- [ ] Verify authentication works
- [ ] Test admin approvals
- [ ] Check mobile responsiveness
- [ ] Verify image loading
- [ ] Test search functionality
- [ ] Review security settings
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test error handling

---

**Quick Start Date**: October 4, 2025
**Last Updated**: October 4, 2025


