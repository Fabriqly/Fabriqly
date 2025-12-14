# Shop Product Integration Guide

## Overview

This document describes the integration between the Shop Profile system and Product Management system, allowing business owners to associate products with their shops and manage them through the shop interface.

## What Was Implemented

### 1. Type System Updates

#### Product Types (`src/types/products.ts`)
Added `shopId` field to product-related interfaces:

- **Product Interface**: Added optional `shopId?: string` field
- **CreateProductData**: Added optional `shopId?: string` field
- **ProductFilters**: Added optional `shopId?: string` for filtering
- **ProductWithDetails**: Added optional `shop` object with shop information

```typescript
export interface Product {
  // ... existing fields
  shopId?: string; // Shop this product belongs to (optional)
  // ... other fields
}

export interface ProductWithDetails extends Product {
  // ... existing fields
  shop?: {
    id: string;
    shopName: string;
    username: string;
  };
}
```

### 2. Backend Services

#### ProductService Updates (`src/services/ProductService.ts`)

**New Methods:**
- `validateShopOwnership(shopId, businessOwnerId)`: Validates that a shop belongs to the specified business owner
- `updateShopProductCount(shopId, delta)`: Updates the product count for a shop

**Updated Methods:**
- `createProduct()`: Now validates shop ownership and updates shop product count
- `deleteProduct()`: Now decrements shop product count when product is deleted

**Features:**
- Validates shop ownership before allowing product association
- Automatically updates shop product statistics
- Ensures only approved shops can have products associated

#### ProductRepository Updates (`src/repositories/ProductRepository.ts`)

**New Methods:**
- `findByShop(shopId)`: Find all products for a specific shop
- `getProductCountByShop(shopId)`: Get product count for a shop

**Updated Methods:**
- `findWithFilters()`: Now supports filtering by `shopId`

### 3. API Routes

#### Products API (`src/app/api/products/route.ts`)

**GET /api/products**
- Added `shopId` query parameter support
- Example: `/api/products?shopId=shop123`

**POST /api/products**
- Accepts `shopId` in request body
- Validates shop ownership automatically

### 4. Frontend Components

#### ProductForm Updates (`src/components/products/ProductForm.tsx`)

**New Features:**
- Shop selector dropdown for business owners
- Loads user's approved shops automatically
- Optional shop association (products can still be personal)
- Shows shop information in the form

**UI Changes:**
- Added "Shop (Optional)" field in Basic Information section
- Displays shops as dropdown with shop name and username
- Shows loading state while fetching shops

#### ShopProfileView Updates (`src/components/shop/ShopProfileView.tsx`)

**New Section:**
- Products section showing total product count
- Link to shop products page
- "Browse Products" button when products are available

#### New Shop Products Page (`src/app/shops/[username]/products/page.tsx`)

**Features:**
- Displays all products for a specific shop
- Product management (view, edit, delete) for shop owners
- Product statistics (total products, active products, total stock)
- Responsive table layout with product images
- Empty state for shops without products

**Access Control:**
- Public viewing of shop products
- Management actions only visible to shop owner
- Links to product details and editing

### 5. Shop Statistics Integration

The system automatically maintains shop statistics:
- `shopStats.totalProducts` is incremented when a product is added to a shop
- `shopStats.totalProducts` is decremented when a product is deleted from a shop
- Statistics are updated in real-time

## User Workflows

### For Business Owners

#### Creating a Product with Shop Association

1. Navigate to product creation page
2. Fill in product details
3. Select shop from dropdown (or leave as "No shop" for personal product)
4. Submit product

The system will:
- Validate shop ownership
- Create product with shop association
- Update shop product count
- Log activity

#### Managing Shop Products

1. Navigate to shop profile page (`/shops/{username}`)
2. Click "View All Products" or "Browse Products"
3. View all products associated with the shop
4. Edit or delete products as needed

### For Customers

#### Browsing Shop Products

1. Visit shop profile (`/shops/{username}`)
2. See total product count in Products section
3. Click "Browse Products" to see all products
4. View product details and make purchases

## API Examples

### Create Product with Shop Association

```bash
POST /api/products
Content-Type: application/json

{
  "name": "Custom T-Shirt",
  "description": "High-quality custom t-shirt",
  "price": 299.99,
  "categoryId": "cat-123",
  "shopId": "shop-456",  // Optional shop association
  "stockQuantity": 100,
  "status": "active",
  "isCustomizable": true,
  "isDigital": false
}
```

### Get Products for a Shop

```bash
GET /api/products?shopId=shop-456
```

### Get Shop Products Page

```
Visit: /shops/{username}/products
```

## Database Schema Changes

### Products Collection

```typescript
{
  id: string;
  name: string;
  // ... other fields
  shopId?: string;  // New field: Links to shopProfiles collection
  businessOwnerId: string;
  // ... other fields
}
```

## Validation Rules

1. **Shop Ownership**: Products can only be associated with shops owned by the product creator
2. **Shop Approval**: Only approved shops can have products associated
3. **Optional Association**: Products can exist without shop association (personal products)
4. **Consistency**: When a product is deleted, shop statistics are updated automatically

## Permission Checks

- **Product Creation**: Requires `business_owner` or `admin` role
- **Shop Association**: User must own the shop
- **Product Management**: Only product owner can edit/delete
- **Shop Products View**: Public (read-only for non-owners)

## Future Enhancements

Potential improvements for future releases:

1. **Bulk Operations**
   - Move multiple products to a shop
   - Change shop association for multiple products

2. **Product Categories by Shop**
   - Filter shop products by category
   - Category-specific product display

3. **Shop Product Analytics**
   - Views per product
   - Conversion rates
   - Best-selling products

4. **Product Collections**
   - Create product collections within shops
   - Featured products section
   - Seasonal collections

5. **Inventory Management**
   - Shop-level inventory tracking
   - Low stock alerts per shop
   - Automatic reordering

6. **Shop Product Templates**
   - Reusable product templates
   - Quick product duplication
   - Template marketplace

## Testing Checklist

- [x] Create product without shop association
- [x] Create product with shop association
- [x] Edit product and change shop association
- [x] Delete product updates shop statistics
- [x] Only shop owner can associate products
- [x] Only approved shops can have products
- [x] Shop products page displays correctly
- [x] Shop profile shows accurate product count
- [x] Filter products by shopId works
- [x] Product form loads shops correctly
- [x] Empty state shows when shop has no products

## Troubleshooting

### Common Issues

**Issue**: "Shop does not belong to this business owner"
- **Solution**: Ensure the shop is owned by the authenticated user

**Issue**: Shop dropdown is empty
- **Solution**: User must have at least one approved shop

**Issue**: Shop product count not updating
- **Solution**: Check that ProductService is properly updating shop statistics

**Issue**: Can't see shop products
- **Solution**: Ensure shop is approved and has products with `shopId` set

## Migration Guide

If you have existing products and want to associate them with shops:

1. Create a migration script to add `shopId` to existing products
2. Match products to shops by `businessOwnerId` and shop `userId`
3. Update shop statistics after migration
4. Verify all products have correct associations

Example migration:
```javascript
// Get all products and shops
const products = await productRepository.findAll();
const shops = await shopProfileRepository.findAll();

// Create mapping
const userToShopMap = new Map();
shops.forEach(shop => {
  if (shop.approvalStatus === 'approved') {
    userToShopMap.set(shop.userId, shop.id);
  }
});

// Update products
for (const product of products) {
  const shopId = userToShopMap.get(product.businessOwnerId);
  if (shopId) {
    await productRepository.update(product.id, { shopId });
  }
}

// Recalculate shop statistics
for (const shop of shops) {
  const count = await productRepository.getProductCountByShop(shop.id);
  await shopProfileRepository.update(shop.id, {
    'shopStats.totalProducts': count
  });
}
```

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in modified files
3. Check existing issues in the repository
4. Contact the development team

## Version History

### Version 1.0.0 (October 5, 2025)
- Initial integration implementation
- Product-shop association
- Shop products management page
- Automatic statistics updates
- Shop selector in product form
- Products section in shop profile

---

**Last Updated**: October 5, 2025  
**Status**: ✅ Complete & Production Ready  
**Maintained By**: Fabriqly Development Team
