# 🏪 Smart Shop Filtering Guide

## Overview

The shop selection feature now intelligently filters printing shops based on the product type being customized. Only shops that can print the specific product (e.g., mugs, t-shirts, tote bags) will be shown to customers.

---

## 🎯 How It Works

### **1. Product Analysis**
When a customer requests shop selection, the system:
- Fetches the product details from the customization request
- Extracts product information:
  - **Category ID**: Primary product category
  - **Product Name**: E.g., "Custom Mug", "T-Shirt"
  - **Product Tags**: Additional identifiers

### **2. Shop Matching**
The system filters shops based on two criteria:

#### **A. Supported Product Categories**
Shops define which product categories they can handle via:
```typescript
shopProfile.supportedProductCategories = ['categoryId1', 'categoryId2']
```

If the product's category matches any supported category, the shop is included.

#### **B. Shop Specialties**
Shops can list their specialties:
```typescript
shopProfile.specialties = ['Mugs', 'T-Shirts', 'Tote Bags', 'Caps']
```

The system performs smart matching:
- **Name Matching**: If product name contains a specialty (case-insensitive)
  - Product: "Custom Mug" → Matches specialty: "Mugs"
- **Tag Matching**: If product tags match any specialty
  - Product tags: ["mug", "ceramic"] → Matches specialty: "Mugs"

### **3. Results Sorting**
Matched shops are organized:
1. **Designer's Shop** (if designer has one) - shown first as recommended
2. **Other Shops** - sorted by average rating (highest first)

---

## 📋 Shop Profile Configuration

### Required Fields for Filtering

```typescript
interface ShopProfile {
  // For category-based matching
  supportedProductCategories: string[]; // Array of category IDs
  
  // For specialty-based matching
  specialties?: string[]; // E.g., ["Mugs", "T-Shirts", "Caps"]
  
  // Must be active and approved to show
  isActive: boolean;
  approvalStatus: 'approved'; // Must be 'approved'
}
```

### Example Configuration

```typescript
// Shop that can print mugs and drinkware
{
  shopName: "MugMasters Printing",
  supportedProductCategories: ['cat_drinkware', 'cat_homegoods'],
  specialties: ['Mugs', 'Water Bottles', 'Tumblers'],
  isActive: true,
  approvalStatus: 'approved'
}

// Shop that can print apparel
{
  shopName: "TeeTime Prints",
  supportedProductCategories: ['cat_apparel', 'cat_clothing'],
  specialties: ['T-Shirts', 'Hoodies', 'Caps', 'Jerseys'],
  isActive: true,
  approvalStatus: 'approved'
}
```

---

## 🎨 User Experience

### Customer View

```
┌─────────────────────────────────────────┐
│  Select Printing Shop               [X] │
├─────────────────────────────────────────┤
│  🔍 Filtered for: Custom Ceramic Mug   │
│  Showing shops that can print this      │
│  product type. 3 shops found            │
│  [mug] [ceramic] [drinkware]            │
├─────────────────────────────────────────┤
│  Recommended (Designer's Shop)          │
│  ┌───────────────────────────────────┐ │
│  │ ⦿ MugMasters Printing             │ │
│  │   Expert mug and drinkware prints │ │
│  │   [Mugs] [Water Bottles]          │ │
│  │   📍 Makati, Metro Manila          │ │
│  │   ★ 4.8 (124 reviews)             │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Other Available Shops                  │
│  ┌───────────────────────────────────┐ │
│  │ ○ PrintHub Co.                    │ │
│  │   Quality printing for all items  │ │
│  │   [Mugs] [Shirts] [Bags]          │ │
│  │   📍 Quezon City, Metro Manila    │ │
│  │   ★ 4.5 (89 reviews)              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Confirm Selection]  [Cancel]          │
└─────────────────────────────────────────┘
```

### Shop Specialties Display
Each shop card shows:
- ✅ Business name
- ✅ Description
- ✅ **Specialties** (as tags)
- ✅ Location
- ✅ Rating & reviews
- ✅ "Designer's Shop" badge (if applicable)

---

## 🔧 API Endpoint

### **GET** `/api/customizations/[id]/shop/available`

Fetches shops filtered by product type.

#### **Request**
```
GET /api/customizations/abc123/shop/available
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "designerShop": {
      "id": "shop123",
      "businessName": "MugMasters Printing",
      "description": "Expert mug and drinkware printing",
      "location": "Makati, Metro Manila",
      "averageRating": 4.8,
      "totalReviews": 124,
      "specialties": ["Mugs", "Water Bottles", "Tumblers"]
    },
    "otherShops": [
      {
        "id": "shop456",
        "businessName": "PrintHub Co.",
        "description": "Quality printing for all items",
        "location": "Quezon City, Metro Manila",
        "averageRating": 4.5,
        "totalReviews": 89,
        "specialties": ["Mugs", "Shirts", "Bags"]
      }
    ],
    "productInfo": {
      "name": "Custom Ceramic Mug",
      "category": "cat_drinkware",
      "tags": ["mug", "ceramic", "drinkware"]
    },
    "matchedShopsCount": 2
  }
}
```

#### **Authorization**
- Customer or designer on the customization request

#### **Error Responses**
- `401` - Unauthorized (no session)
- `403` - Forbidden (not part of this customization)
- `404` - Customization request or product not found
- `500` - Server error

---

## 📊 Matching Examples

### Example 1: Mug Product
```typescript
Product: {
  name: "Custom Ceramic Mug",
  categoryId: "cat_drinkware",
  tags: ["mug", "ceramic"]
}

Shop 1: {
  supportedProductCategories: ["cat_drinkware"],
  specialties: ["Mugs", "Tumblers"]
}
✅ MATCHED (category match)

Shop 2: {
  supportedProductCategories: ["cat_apparel"],
  specialties: ["T-Shirts", "Hoodies"]
}
❌ NOT MATCHED (no match)

Shop 3: {
  supportedProductCategories: ["cat_homegoods"],
  specialties: ["Mugs", "Plates", "Bowls"]
}
✅ MATCHED (specialty match: "Mugs")
```

### Example 2: T-Shirt Product
```typescript
Product: {
  name: "Premium Cotton T-Shirt",
  categoryId: "cat_apparel",
  tags: ["shirt", "clothing", "cotton"]
}

Shop 1: {
  supportedProductCategories: ["cat_apparel"],
  specialties: ["T-Shirts", "Hoodies"]
}
✅ MATCHED (category + specialty match)

Shop 2: {
  supportedProductCategories: ["cat_drinkware"],
  specialties: ["Mugs", "Bottles"]
}
❌ NOT MATCHED (no match)
```

---

## 🚀 Testing

### Manual Testing Steps

1. **Create Shop Profiles with Specialties**
   - Go to shop profile creation
   - Add `specialties` like "Mugs", "T-Shirts", etc.
   - Set `supportedProductCategories`
   - Ensure `isActive: true` and `approvalStatus: 'approved'`

2. **Create Customization Request**
   - Select a product (e.g., a mug)
   - Submit customization request
   - Assign to designer

3. **Test Shop Selection**
   - Customer approves design
   - Click "Select Printing Shop"
   - Verify only matching shops appear
   - Check that specialties are displayed

4. **Test Different Product Types**
   - Repeat with different products (shirts, bags, etc.)
   - Verify correct shops are filtered

### Expected Results
- ✅ Only shops with matching categories/specialties shown
- ✅ Designer's shop appears first (if applicable)
- ✅ Shops sorted by rating
- ✅ Specialties displayed as tags
- ✅ Product info shown at top
- ✅ Clear message if no shops match

---

## 🎯 Benefits

### For Customers
- ✅ Only see relevant shops that can handle their product
- ✅ No confusion with shops that can't print their item
- ✅ Better shopping experience

### For Shop Owners
- ✅ Only receive requests they can fulfill
- ✅ Better conversion rates
- ✅ Less rejected/cancelled orders

### For Designers
- ✅ Can recommend their own shop (if applicable)
- ✅ Customers more likely to find suitable shops
- ✅ Smoother workflow

---

## 🔄 Future Enhancements

### Planned Features
1. **Location-based filtering** - Show nearby shops first
2. **Price range filtering** - Filter by budget
3. **Turnaround time** - Show shops with fastest delivery
4. **Material matching** - Match based on material capabilities
5. **Minimum order quantity** - Filter by MOQ requirements

### Advanced Matching
1. **ML-based matching** - Learn from successful orders
2. **Shop capacity** - Check if shop can handle volume
3. **Quality scores** - Factor in quality ratings
4. **Past performance** - Show shops with best track record

---

## 📝 Notes

### Important Considerations

1. **Shop Profile Setup**
   - Shops must properly configure `specialties` and `supportedProductCategories`
   - Incomplete profiles may not appear in search results

2. **Product Data Quality**
   - Products should have accurate category and tags
   - Better product data = better shop matching

3. **No Matches Fallback**
   - If no shops match, provide helpful message
   - Consider allowing "View All Shops" option as fallback

4. **Performance**
   - Filtering is done server-side for security
   - Results cached where appropriate
   - Consider pagination for large shop counts

---

## 🐛 Troubleshooting

### Shop Not Appearing

**Possible Causes:**
1. Shop not active (`isActive: false`)
2. Shop not approved (`approvalStatus !== 'approved'`)
3. No matching categories or specialties
4. Specialty names don't match product names/tags

**Solution:**
- Verify shop profile settings
- Check specialty spelling and casing (matching is case-insensitive)
- Ensure product has correct category and tags

### All Shops Showing

**Possible Causes:**
1. Filter logic not executing
2. Product missing category/tags
3. All shops have broad specialties

**Solution:**
- Check API logs for filtering results
- Verify product data quality
- Review shop specialty configurations

---

## 📚 Related Documentation

- [Design Collaboration Workflow](./DESIGN_COLLABORATION_WORKFLOW.md)
- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Integration Complete](./INTEGRATION_COMPLETE.md)
- [Shop Profile Management](../src/types/shop-profile.ts)

---

**Last Updated:** November 5, 2025  
**Version:** 1.0.0
















