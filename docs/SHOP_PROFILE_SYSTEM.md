# Shop Profile System Documentation

## Overview

The Shop Profile System is a comprehensive module that allows business owners on Fabriqly to create, manage, and showcase their shop identity. It provides a complete workflow from profile creation to admin approval and public visibility.

## System Architecture

### Components

1. **Type System** (`src/types/shop-profile.ts`)
   - TypeScript interfaces for shop profiles
   - Business type enums
   - Approval status tracking
   - Validation types

2. **Data Access Layer** (`src/repositories/ShopProfileRepository.ts`)
   - CRUD operations
   - Search and filtering
   - Statistics and analytics
   - Approval management

3. **Business Logic Layer** (`src/services/ShopProfileService.ts`)
   - Profile validation
   - Caching strategies
   - Activity logging
   - Permission checking

4. **API Routes** (`src/app/api/shop-profiles/`)
   - RESTful endpoints
   - Authentication and authorization
   - Admin operations

5. **UI Components** (`src/components/shop/`)
   - ShopProfileForm - Creation and editing
   - ShopProfileView - Display profile
   - ShopList - Browse and search

6. **Pages** (`src/app/shops/`)
   - Shop creation page
   - Shop profile page
   - Shop browse page
   - Admin management page

## Features

### For Business Owners

#### Profile Creation
- **Basic Information**: Shop name, username/handle, business owner name
- **Contact Details**: Email (verified), phone number (optional), location
- **Branding**: Logo, banner, tagline
- **Business Details**: Business type (Individual/MSME/Printing Partner), permits, tax ID
- **Description**: Rich description, specialties/niches
- **Customization Policy**: Turnaround time, revisions, rush orders
- **Social Links**: Facebook, Instagram, TikTok, Twitter, website

#### Profile Management
- Edit profile information
- Update branding assets
- Manage product categories
- Track statistics and performance

#### Statistics Dashboard
- Total products
- Total orders
- Total revenue
- Total views
- Average rating
- Total reviews

### For Customers

#### Shop Discovery
- Browse all approved shops
- Search by name, description, or specialties
- Filter by location, business type, rating
- View featured shops

#### Shop Profile View
- Comprehensive shop information
- Business details and contact
- Ratings and reviews
- Social media links
- Customization policies

### For Administrators

#### Approval Management
- Review pending shop profiles
- Approve or reject profiles
- Provide rejection reasons
- View approval statistics

#### Shop Management
- Monitor all shops
- Suspend/activate shops
- Verify shops (verified badge)
- Track shop performance

## Database Schema

### ShopProfile Collection

```typescript
{
  id: string;
  shopName: string;
  username: string; // Unique
  businessOwnerName: string;
  userId: string; // Foreign key to users
  
  contactInfo: {
    email: string;
    phone?: string;
  };
  
  location?: {
    city?: string;
    province?: string;
    fullAddress?: string;
    country?: string;
  };
  
  branding: {
    logoUrl?: string;
    bannerUrl?: string;
    thumbnailUrl?: string;
    tagline?: string;
  };
  
  businessDetails: {
    businessType: 'individual' | 'msme' | 'printing_partner';
    operatingHours?: Record<string, { open: string; close: string; isOpen: boolean }>;
    registeredBusinessId?: string;
    taxId?: string;
  };
  
  description: string;
  specialties?: string[];
  supportedProductCategories: string[]; // Category IDs
  
  customizationPolicy?: {
    turnaroundTime?: string;
    revisionsAllowed?: number;
    rushOrderAvailable?: boolean;
    customInstructions?: string;
  };
  
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };
  website?: string;
  
  ratings: {
    averageRating: number;
    totalReviews: number;
    totalOrders: number;
  };
  
  shopStats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalViews: number;
  };
  
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## API Endpoints

### Public Endpoints

#### GET /api/shop-profiles
Get all shop profiles with optional filtering

**Query Parameters:**
- `userId` - Filter by user ID
- `username` - Filter by username
- `businessType` - Filter by business type
- `approvalStatus` - Filter by approval status
- `isVerified` - Filter verified shops
- `isActive` - Filter active shops
- `isFeatured` - Filter featured shops
- `search` - Search term
- `city` - Filter by city
- `province` - Filter by province
- `minRating` - Minimum rating
- `sortBy` - Sort field (name, rating, createdAt, etc.)
- `sortOrder` - Sort direction (asc, desc)
- `limit` - Results limit

**Response:**
```json
{
  "success": true,
  "data": [/* shop profiles */],
  "total": 10
}
```

#### GET /api/shop-profiles/[id]
Get single shop profile by ID

**Response:**
```json
{
  "success": true,
  "data": {/* shop profile */}
}
```

#### GET /api/shop-profiles/username/[username]
Get shop profile by username

**Response:**
```json
{
  "success": true,
  "data": {/* shop profile */}
}
```

#### GET /api/shop-profiles/search
Search shops

**Query Parameters:**
- `q` or `query` - Search term (required)

**Response:**
```json
{
  "success": true,
  "data": [/* matching shops */],
  "total": 5,
  "query": "custom shirts"
}
```

#### GET /api/shop-profiles/featured
Get featured shops

**Query Parameters:**
- `limit` - Number of shops (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [/* featured shops */],
  "total": 6
}
```

#### GET /api/shop-profiles/[id]/stats
Get shop statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 25,
    "totalOrders": 150,
    "totalRevenue": 50000,
    "totalViews": 1200,
    "averageRating": 4.8,
    "totalReviews": 45,
    "isVerified": true,
    "isActive": true,
    "approvalStatus": "approved",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

### Authenticated Endpoints

#### POST /api/shop-profiles
Create new shop profile (requires authentication)

**Request Body:**
```json
{
  "shopName": "My Shop",
  "username": "myshop",
  "businessOwnerName": "John Doe",
  "contactInfo": {
    "email": "shop@example.com",
    "phone": "+63 912 345 6789"
  },
  "location": {
    "city": "Manila",
    "province": "Metro Manila"
  },
  "branding": {
    "logoUrl": "https://...",
    "bannerUrl": "https://...",
    "tagline": "Quality custom products"
  },
  "businessDetails": {
    "businessType": "msme",
    "registeredBusinessId": "BN-12345"
  },
  "description": "We create custom...",
  "specialties": ["Custom Shirts", "Mugs"],
  "supportedProductCategories": ["cat-id-1", "cat-id-2"],
  "customizationPolicy": {
    "turnaroundTime": "3-5 business days",
    "revisionsAllowed": 2,
    "rushOrderAvailable": true
  },
  "socialMedia": {
    "facebook": "https://facebook.com/myshop",
    "instagram": "https://instagram.com/myshop"
  },
  "website": "https://myshop.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {/* created shop profile */},
  "message": "Shop profile created successfully"
}
```

#### PATCH /api/shop-profiles/[id]
Update shop profile (requires authentication and ownership)

**Request Body:**
```json
{
  "shopName": "Updated Shop Name",
  "description": "Updated description",
  // ... other fields to update
}
```

**Response:**
```json
{
  "success": true,
  "data": {/* updated shop profile */},
  "message": "Shop profile updated successfully"
}
```

#### DELETE /api/shop-profiles/[id]
Delete shop profile (requires authentication and ownership)

**Response:**
```json
{
  "success": true,
  "message": "Shop profile deleted successfully"
}
```

### Admin Endpoints

#### GET /api/admin/shop-profiles/pending
Get pending shop profiles (admin only)

**Query Parameters:**
- `limit` - Number of shops (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [/* pending shops */],
  "total": 5
}
```

#### GET /api/admin/shop-profiles/stats
Get approval statistics (admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPending": 10,
    "totalApproved": 150,
    "totalRejected": 5,
    "totalSuspended": 2,
    "totalActive": 148
  }
}
```

#### POST /api/admin/shop-profiles/approve
Approve shop profile (admin only)

**Request Body:**
```json
{
  "shopId": "shop-id-here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {/* approved shop */},
  "message": "Shop profile approved successfully"
}
```

#### POST /api/admin/shop-profiles/reject
Reject shop profile (admin only)

**Request Body:**
```json
{
  "shopId": "shop-id-here",
  "reason": "Incomplete business information"
}
```

**Response:**
```json
{
  "success": true,
  "data": {/* rejected shop */},
  "message": "Shop profile rejected successfully"
}
```

## Workflow

### Shop Creation Workflow

1. **User Registration/Login**
   - Business owner registers or logs in
   - User role: business_owner

2. **Profile Creation**
   - Navigate to `/shops/create`
   - Fill in shop profile form
   - Submit for review

3. **Admin Review**
   - Admin receives notification
   - Reviews shop profile at `/dashboard/admin/shops`
   - Approves or rejects with reason

4. **Shop Goes Live**
   - If approved: Shop becomes searchable
   - Shop appears in public shop directory
   - Owner can start adding products

5. **Profile Management**
   - Owner can edit profile at `/shops/[username]/edit`
   - Changes don't require re-approval (unless policy changes)
   - Statistics update automatically

### Validation Rules

#### Shop Name
- Required, 2-100 characters
- Must be unique

#### Username
- Required, 3-50 characters
- Only letters, numbers, hyphens, and underscores
- Must be unique
- Converted to lowercase

#### Description
- Required, 20-1000 characters
- Plain text

#### Email
- Required, valid email format
- Verified through account

#### Phone
- Optional, valid phone format

#### URLs (Website, Social Media)
- Optional, valid URL format
- Must match expected domain for social media

#### Specialties
- Optional, max 20 items

#### Supported Product Categories
- Required, at least one category

## UI Routes

### Public Routes
- `/shops` - Browse all shops
- `/shops/[username]` - View shop profile
- `/shops/create` - Create shop profile (authenticated)

### Protected Routes
- `/shops/[username]/edit` - Edit shop profile (owner only)

### Admin Routes
- `/dashboard/admin/shops` - Shop management (admin only)

## Components Usage

### ShopProfileForm

```tsx
import ShopProfileForm from '@/components/shop/ShopProfileForm';

<ShopProfileForm
  onSubmit={handleSubmit}
  initialData={shopData} // Optional
  isEditing={false} // true for edit mode
/>
```

### ShopProfileView

```tsx
import ShopProfileView from '@/components/shop/ShopProfileView';

<ShopProfileView
  shop={shopData}
  showEditButton={true} // Optional
  onEdit={handleEdit} // Optional
/>
```

### ShopList

```tsx
import ShopList from '@/components/shop/ShopList';

<ShopList
  initialShops={shops} // Optional
  searchTerm="" // Optional
  category="" // Optional
/>
```

## Best Practices

### For Developers

1. **Always validate user permissions** before allowing modifications
2. **Use caching** for frequently accessed shop profiles
3. **Log all admin actions** for audit trail
4. **Increment view counts** asynchronously
5. **Handle image loading errors** gracefully

### For Business Owners

1. **Complete all profile sections** for better visibility
2. **Use high-quality images** for logo and banner
3. **Write clear, descriptive shop descriptions**
4. **Keep contact information up to date**
5. **Respond to reviews and feedback**
6. **Update customization policies** as needed

### For Administrators

1. **Review shops within 24-48 hours** of submission
2. **Provide clear rejection reasons**
3. **Verify business permits** when claimed
4. **Monitor shop performance** regularly
5. **Handle suspension appeals** fairly

## Security Considerations

1. **Authentication**: All write operations require authentication
2. **Authorization**: Users can only edit their own shops
3. **Admin Access**: Admin operations require admin role
4. **Input Validation**: All inputs validated on client and server
5. **URL Validation**: External URLs validated for safety
6. **Rate Limiting**: Consider implementing for API endpoints
7. **Data Sanitization**: All user inputs sanitized

## Future Enhancements

1. **Image Upload Integration**: Direct upload to Supabase storage
2. **Operating Hours Widget**: Interactive time picker
3. **Verification Documents**: Upload and review system
4. **Shop Analytics Dashboard**: Detailed insights for owners
5. **Review System**: Customer reviews and ratings
6. **Product Integration**: Link to shop's products
7. **Messaging System**: Direct communication with shop
8. **Subscription Tiers**: Premium features for shops
9. **Shop Templates**: Pre-designed profile templates
10. **SEO Optimization**: Better search engine visibility

## Testing

### Manual Testing Checklist

- [ ] Create shop profile with all fields
- [ ] Create shop profile with minimal fields
- [ ] Edit existing shop profile
- [ ] Search for shops
- [ ] Filter shops by location
- [ ] Admin approve shop
- [ ] Admin reject shop
- [ ] View shop statistics
- [ ] Check username uniqueness
- [ ] Verify form validation
- [ ] Test permission checks
- [ ] Test image loading errors
- [ ] Test mobile responsiveness

### API Testing

```bash
# Get all shops
curl http://localhost:3000/api/shop-profiles

# Search shops
curl http://localhost:3000/api/shop-profiles/search?q=custom

# Get shop by username
curl http://localhost:3000/api/shop-profiles/username/myshop

# Create shop (requires auth token)
curl -X POST http://localhost:3000/api/shop-profiles \
  -H "Content-Type: application/json" \
  -d '{"shopName":"Test Shop","username":"testshop",...}'
```

## Troubleshooting

### Common Issues

**Issue**: "Username is already taken"
- **Solution**: Choose a different, unique username

**Issue**: "Shop profile not found"
- **Solution**: Verify shop is approved and active

**Issue**: "Permission denied"
- **Solution**: Ensure user owns the shop or is admin

**Issue**: "Validation failed"
- **Solution**: Check all required fields and formats

**Issue**: Images not loading
- **Solution**: Verify image URLs are accessible and valid

## Support

For questions or issues:
1. Check this documentation
2. Review code comments
3. Check existing issues
4. Contact development team

## Changelog

### Version 1.0.0 (2025-10-04)
- Initial implementation
- Complete CRUD operations
- Admin approval workflow
- Search and filtering
- Statistics tracking
- Responsive UI components

---

**Last Updated**: October 4, 2025
**Maintained By**: Fabriqly Development Team


