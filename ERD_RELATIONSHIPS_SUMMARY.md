# Fabriqly ERD - Quick Relationships Summary

## 🔗 Entity Relationships at a Glance

### Core User System
```
Users (1) ──< (1) DesignerProfiles
Users (1) ──< (1) ShopProfiles
Users (1) ──< (1) Carts
Users (1) ──< (Many) Orders
Users (1) ──< (Many) CustomizationRequests
Users (1) ──< (Many) Reviews
Users (1) ──< (Many) Messages
Users (1) ──< (Many) Notifications
```

### Designer System
```
DesignerProfiles (1) ──< (Many) Designs
DesignerProfiles (1) ──< (Many) CustomizationRequests
DesignerProfiles (1) ──< (Many) DesignerVerificationRequests
DesignerProfiles (1) ──< (Many) DesignerAppeals
DesignerProfiles (1) ──< (Many) Reviews
Designs (1) ──< (1) DesignAnalytics
```

### Shop System
```
ShopProfiles (1) ──< (Many) Products
ShopProfiles (1) ──< (Many) Orders
ShopProfiles (1) ──< (Many) CustomizationRequests (as printingShopId)
ShopProfiles (1) ──< (Many) ShopApplications
ShopProfiles (1) ──< (Many) ShopAppeals
ShopProfiles (1) ──< (Many) Reviews
```

### Product System
```
Products (Many) ──> (1) ShopProfiles
Products (Many) ──> (1) ProductCategories
Products (Many) ──> (1) SizeCharts (optional)
Products (1) ──< (Many) ProductImages
Products (1) ──< (Many) ProductVariants
Products (1) ──< (Many) ProductColors
Products (1) ──< (1) ProductAnalytics
Products (1) ──< (Many) CustomizationRequests
Products (1) ──< (Many) Reviews
Products (1) ──< (Many) OrderItems (via Orders)
Products (1) ──< (Many) CartItems (via Carts)
```

### Category System (Hierarchical)
```
ProductCategories (1) ──< (1) ProductCategories (self-referencing, parentCategoryId)
ProductCategories (1) ──< (Many) Products
ProductCategories (1) ──< (Many) Designs
ProductCategories (1) ──< (Many) SizeCharts (optional)
```

### Color System
```
Colors (1) ──< (Many) ProductColors
ProductColors (Many) ──> (1) Products
ProductColors (Many) ──> (1) Colors
```

### Order Flow
```
CustomizationRequests (1) ──> (1) Orders (optional, after approval)
CustomizationRequests (1) ──> (1) Products
CustomizationRequests (1) ──> (1) DesignerProfiles (optional)
CustomizationRequests (1) ──> (1) ShopProfiles (optional, printingShopId)
CustomizationRequests (1) ──> (1) Colors (optional, selectedColorId)
Orders (1) ──< (Many) Disputes
CustomizationRequests (1) ──< (Many) Disputes
```

### Review System (Polymorphic)
```
Reviews (Many) ──> (1) Users (as customerId)
Reviews (Many) ──> (1) Products (optional)
Reviews (Many) ──> (1) ShopProfiles (optional)
Reviews (Many) ──> (1) DesignerProfiles (optional)
Reviews (Many) ──> (1) Designs (optional)
Reviews (Many) ──> (1) CustomizationRequests (optional)
```

### Communication System
```
Conversations (1) ──< (Many) Messages
Conversations (1) ──< (Many) Disputes
Users (Many) ──< (Many) Conversations (via participants[])
Messages (Many) ──> (1) Users (as senderId)
Messages (Many) ──> (1) Users (as receiverId)
Messages (Many) ──> (1) Conversations
```

### Dispute System
```
Disputes (Many) ──> (1) Orders (optional)
Disputes (Many) ──> (1) CustomizationRequests (optional)
Disputes (Many) ──> (1) Users (as filedBy)
Disputes (Many) ──> (1) Users (as accusedParty)
Disputes (Many) ──> (1) Users (as resolvedBy, optional)
Disputes (Many) ──> (1) Conversations
```

### Promotion System
```
Discounts (1) ──< (Many) Coupons
Discounts ──> Products (Many:Many via targetIds when scope='product')
Discounts ──> ProductCategories (Many:Many via targetIds when scope='category')
Coupons ──> Orders (referenced in appliedCouponCode)
Coupons ──> Carts (referenced in appliedCouponCode)
```

### Application System
```
DesignerApplications (Many) ──> (1) Users
DesignerApplications (Many) ──> (1) Users (as reviewedBy, optional)
ShopApplications (Many) ──> (1) Users
ShopApplications (Many) ──> (1) Users (as reviewedBy, optional)
```

### Analytics & Tracking
```
DesignAnalytics (1) ──> (1) Designs
ProductAnalytics (1) ──> (1) Products
UserLikes (Many) ──> (1) Users
UserLikes ──> Products or Designs (polymorphic via likedEntityType)
Activities (Many) ──> (1) Users (optional)
```

### Utility Collections
```
PasswordResetTokens (Many) ──> (1) Users
DashboardSnapshots (standalone, aggregated data)
```

---

## 📊 Relationship Types

### One-to-One (1:1)
- Users ↔ DesignerProfiles
- Users ↔ ShopProfiles
- Users ↔ Carts
- Designs ↔ DesignAnalytics
- Products ↔ ProductAnalytics
- CustomizationRequests ↔ Orders (optional, after approval)

### One-to-Many (1:Many)
- Users → Orders
- Users → CustomizationRequests
- Users → Reviews
- Users → Messages
- DesignerProfiles → Designs
- DesignerProfiles → CustomizationRequests
- ShopProfiles → Products
- ShopProfiles → Orders
- Products → ProductImages
- Products → ProductVariants
- Products → ProductColors
- Products → CustomizationRequests
- ProductCategories → Products (hierarchical)
- Colors → ProductColors
- Orders → Disputes
- CustomizationRequests → Disputes
- Conversations → Messages
- Conversations → Disputes

### Many-to-Many (Many:Many)
- Products ↔ Colors (via ProductColors junction table)
- Users ↔ Conversations (via participants array)
- Discounts ↔ Products (via targetIds when scope='product')
- Discounts ↔ ProductCategories (via targetIds when scope='category')

### Self-Referencing
- ProductCategories → ProductCategories (hierarchical parent-child)

### Polymorphic
- Reviews can reference: Products, ShopProfiles, DesignerProfiles, Designs, or CustomizationRequests
- UserLikes can reference: Products or Designs

---

## 🎯 Key Business Rules

1. **User Roles**: A User can have at most one DesignerProfile AND one ShopProfile
2. **Cart Ownership**: Each User has exactly one Cart (1:1)
3. **Order Creation**: Orders can be created from Carts OR from approved CustomizationRequests
4. **Customization Flow**: CustomizationRequests → (approval) → Orders → (production) → Delivery
5. **Dispute Resolution**: Disputes can be filed against Orders OR CustomizationRequests
6. **Review Flexibility**: Reviews can target multiple entity types (polymorphic)
7. **Category Hierarchy**: ProductCategories form a tree (max 5 levels deep)
8. **Color Management**: Colors are centralized; Products link to Colors via ProductColors with price adjustments

---

## 🔑 Foreign Key Reference Guide

| Entity | Foreign Key Field | References |
|--------|------------------|------------|
| DesignerProfiles | userId | Users.id |
| ShopProfiles | userId | Users.id |
| Products | shopId | ShopProfiles.id |
| Products | categoryId | ProductCategories.id |
| Products | sizeChartId | SizeCharts.id (optional) |
| ProductImages | productId | Products.id |
| ProductVariants | productId | Products.id |
| ProductColors | productId | Products.id |
| ProductColors | colorId | Colors.id |
| Designs | designerId | DesignerProfiles.id |
| Designs | categoryId | ProductCategories.id |
| DesignAnalytics | designId | Designs.id |
| ProductAnalytics | productId | Products.id |
| CustomizationRequests | customerId | Users.id |
| CustomizationRequests | productId | Products.id |
| CustomizationRequests | designerId | DesignerProfiles.id (optional) |
| CustomizationRequests | printingShopId | ShopProfiles.id (optional) |
| CustomizationRequests | selectedColorId | Colors.id (optional) |
| CustomizationRequests | orderId | Orders.id (optional) |
| Orders | customerId | Users.id |
| Orders | businessOwnerId | Users.id / ShopProfiles.userId |
| Orders | customizationRequestId | CustomizationRequests.id (optional) |
| Carts | userId | Users.id |
| Reviews | customerId | Users.id |
| Reviews | productId | Products.id (optional) |
| Reviews | shopId | ShopProfiles.id (optional) |
| Reviews | designerId | DesignerProfiles.id (optional) |
| Reviews | designId | Designs.id (optional) |
| Reviews | customizationRequestId | CustomizationRequests.id (optional) |
| Disputes | orderId | Orders.id (optional) |
| Disputes | customizationRequestId | CustomizationRequests.id (optional) |
| Disputes | filedBy | Users.id |
| Disputes | accusedParty | Users.id |
| Disputes | resolvedBy | Users.id (optional) |
| Disputes | conversationId | Conversations.id |
| Messages | senderId | Users.id |
| Messages | receiverId | Users.id |
| Messages | conversationId | Conversations.id |
| Coupons | discountId | Discounts.id |
| DesignerVerificationRequests | designerId | DesignerProfiles.id |
| DesignerVerificationRequests | userId | Users.id |
| DesignerVerificationRequests | reviewedBy | Users.id (optional) |
| DesignerAppeals | designerId | DesignerProfiles.id |
| DesignerAppeals | userId | Users.id |
| DesignerAppeals | reviewedBy | Users.id (optional) |
| ShopAppeals | shopId | ShopProfiles.id |
| ShopAppeals | userId | Users.id |
| ShopAppeals | reviewedBy | Users.id (optional) |
| DesignerApplications | userId | Users.id |
| DesignerApplications | reviewedBy | Users.id (optional) |
| ShopApplications | userId | Users.id |
| ShopApplications | reviewedBy | Users.id (optional) |
| Notifications | userId | Users.id |
| UserLikes | userId | Users.id |
| PasswordResetTokens | userId | Users.id |
| Activities | userId | Users.id (optional) |
| ProductCategories | parentCategoryId | ProductCategories.id (self-reference, optional) |
| SizeCharts | categoryId | ProductCategories.id (optional) |

---

This summary provides a quick reference for all relationships in the Fabriqly system.






