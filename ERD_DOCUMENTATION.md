# Fabriqly System - Entity Relationship Diagram (ERD) Documentation

## 📊 System Overview

This document provides a comprehensive Entity Relationship Diagram (ERD) for the Fabriqly platform, which is built on Firebase/Firestore (NoSQL database). The relationships are represented as they would appear in a traditional relational database for clarity in documentation.

---

## 🏗️ Core Entities and Relationships

### 1. **USERS** (Central Entity)
**Collection:** `users`

**Key Attributes:**
- `id` (Primary Key)
- `email`
- `displayName`
- `photoURL`
- `role` (customer | designer | business_owner | admin)
- `isVerified`
- `profile` (firstName, lastName, phone, address, preferences)
- `shippingAddresses[]`
- `createdAt`, `updatedAt`

**Relationships:**
- **One-to-One** with `DesignerProfile` (via `userId`)
- **One-to-One** with `ShopProfile` (via `userId`)
- **One-to-Many** with `Orders` (as `customerId`)
- **One-to-Many** with `Carts` (via `userId`)
- **One-to-Many** with `CustomizationRequests` (as `customerId`)
- **One-to-Many** with `Reviews` (as `customerId`)
- **One-to-Many** with `Messages` (as `senderId` or `receiverId`)
- **One-to-Many** with `Conversations` (as participant)
- **One-to-Many** with `Disputes` (as `filedBy` or `accusedParty`)

---

### 2. **DESIGNER_PROFILES**
**Collection:** `designerProfiles`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `businessName`
- `bio`
- `website`
- `socialMedia` (instagram, facebook, twitter, linkedin)
- `specialties[]`
- `isVerified`
- `isActive`
- `portfolioStats` (totalDesigns, totalDownloads, totalViews, averageRating)
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`)
- **One-to-Many** with `Designs` (via `designerId`)
- **One-to-Many** with `CustomizationRequests` (via `designerId`)
- **One-to-Many** with `DesignerVerificationRequests` (via `designerId`)
- **One-to-Many** with `DesignerAppeals` (via `designerId`)
- **One-to-Many** with `Reviews` (via `designerId`)

---

### 3. **SHOP_PROFILES**
**Collection:** `shopProfiles`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `shopName`
- `username` (unique)
- `businessOwnerName`
- `contactInfo` (email, phone)
- `location` (city, province, fullAddress, country)
- `branding` (logoUrl, bannerUrl, thumbnailUrl, tagline)
- `businessDetails` (businessType, operatingHours, registeredBusinessId, taxId)
- `description`
- `specialties[]`
- `supportedProductCategories[]`
- `customizationPolicy`
- `socialMedia`
- `website`
- `ratings` (averageRating, totalReviews, totalOrders)
- `shopStats` (totalProducts, totalOrders, totalRevenue, totalViews)
- `approvalStatus` (pending | approved | rejected | suspended)
- `isVerified`, `isActive`, `isFeatured`
- `approvedBy` (Foreign Key → Users)
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`)
- **One-to-Many** with `Products` (via `shopId`)
- **One-to-Many** with `Orders` (via `businessOwnerId`)
- **One-to-Many** with `CustomizationRequests` (via `printingShopId`)
- **One-to-Many** with `ShopApplications` (via `shopId`)
- **One-to-Many** with `ShopAppeals` (via `shopId`)
- **One-to-Many** with `Reviews` (via `shopId`)

---

### 4. **PRODUCTS**
**Collection:** `products`

**Key Attributes:**
- `id` (Primary Key)
- `shopId` (Foreign Key → ShopProfiles)
- `categoryId` (Foreign Key → ProductCategories)
- `productName`
- `shortDescription`
- `detailedDescription`
- `productSku`
- `basePrice`
- `currency`
- `isCustomizable`
- `isFeatured`
- `isActive`
- `stockQuantity`
- `minOrderQuantity`
- `weightGrams`
- `dimensions` (length, width, height, unit)
- `tags[]`
- `specifications`
- `seoTitle`, `seoDescription`
- `sizeChartId` (Foreign Key → SizeCharts, optional)
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `ShopProfiles` (via `shopId`)
- **Many-to-One** with `ProductCategories` (via `categoryId`)
- **Many-to-One** with `SizeCharts` (via `sizeChartId`, optional)
- **One-to-Many** with `ProductImages` (via `productId`)
- **One-to-Many** with `ProductVariants` (via `productId`)
- **One-to-Many** with `ProductColors` (via `productId`)
- **One-to-Many** with `OrderItems` (via `productId`)
- **One-to-Many** with `CartItems` (via `productId`)
- **One-to-Many** with `CustomizationRequests` (via `productId`)
- **One-to-Many** with `Reviews` (via `productId`)
- **One-to-One** with `ProductAnalytics` (via `productId`)

---

### 5. **PRODUCT_CATEGORIES**
**Collection:** `productCategories`

**Key Attributes:**
- `id` (Primary Key)
- `categoryName`
- `description`
- `slug`
- `iconUrl`
- `parentCategoryId` (Foreign Key → ProductCategories, optional - for hierarchy)
- `level` (0 = root, 1+ = subcategory)
- `path[]` (full path from root)
- `isActive`
- `sortOrder`
- `createdAt`, `updatedAt`

**Relationships:**
- **Self-Referencing** (One-to-Many with itself via `parentCategoryId` - hierarchical structure)
- **One-to-Many** with `Products` (via `categoryId`)
- **One-to-Many** with `SizeCharts` (via `categoryId`, optional)
- **One-to-Many** with `Designs` (via `categoryId`)

---

### 6. **PRODUCT_IMAGES**
**Collection:** `productImages`

**Key Attributes:**
- `id` (Primary Key)
- `productId` (Foreign Key → Products)
- `imageUrl`
- `thumbnailUrl`
- `altText`
- `displayOrder`
- `imageType` (main | gallery | detail)
- `uploadedAt`, `editedAt`

**Relationships:**
- **Many-to-One** with `Products` (via `productId`)

---

### 7. **PRODUCT_VARIANTS**
**Collection:** `productVariants`

**Key Attributes:**
- `id` (Primary Key)
- `productId` (Foreign Key → Products)
- `variantName` (e.g., "Size", "Material")
- `variantValue` (e.g., "Large", "Cotton")
- `priceAdjustment`
- `stock`
- `sku`
- `isActive`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Products` (via `productId`)

---

### 8. **COLORS**
**Collection:** `colors`

**Key Attributes:**
- `id` (Primary Key)
- `colorName` (unique)
- `hexCode` (unique)
- `rgbCode`
- `businessOwnerId` (Foreign Key → Users, optional)
- `isActive`
- `createdAt`

**Relationships:**
- **One-to-Many** with `ProductColors` (via `colorId`)

---

### 9. **PRODUCT_COLORS** (Junction Table)
**Collection:** `productColors`

**Key Attributes:**
- `id` (Primary Key)
- `productId` (Foreign Key → Products)
- `colorId` (Foreign Key → Colors)
- `priceAdjustment`
- `isAvailable`
- `stockQuantity`
- `createdAt`

**Relationships:**
- **Many-to-One** with `Products` (via `productId`)
- **Many-to-One** with `Colors` (via `colorId`)

---

### 10. **SIZE_CHARTS**
**Collection:** `sizeCharts`

**Key Attributes:**
- `id` (Primary Key)
- `chartName`
- `description`
- `sizeData` (JSON structure with measurements)
- `categoryId` (Foreign Key → ProductCategories, optional)
- `isActive`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `ProductCategories` (via `categoryId`, optional)
- **One-to-Many** with `Products` (via `sizeChartId`)

---

### 11. **DESIGNS**
**Collection:** `designs`

**Key Attributes:**
- `id` (Primary Key)
- `designerId` (Foreign Key → DesignerProfiles)
- `categoryId` (Foreign Key → ProductCategories)
- `designName`
- `description`
- `designSlug`
- `designFileUrl`
- `thumbnailUrl`
- `previewUrl`
- `designType` (template | custom | premium)
- `fileFormat` (svg | png | jpg | pdf | ai | psd)
- `tags[]`
- `isPublic`
- `isFeatured`
- `isActive`
- `pricing` (isFree, price, currency)
- `downloadCount`
- `viewCount`
- `likesCount`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `DesignerProfiles` (via `designerId`)
- **Many-to-One** with `ProductCategories` (via `categoryId`)
- **One-to-One** with `DesignAnalytics` (via `designId`)
- **One-to-Many** with `Reviews` (via `designId`)

---

### 12. **DESIGN_ANALYTICS**
**Collection:** `designAnalytics`

**Key Attributes:**
- `id` (Primary Key)
- `designId` (Foreign Key → Designs)
- `views`
- `downloads`
- `likes`
- `shares`
- `lastViewed`
- `createdAt`, `updatedAt`

**Relationships:**
- **One-to-One** with `Designs` (via `designId`)

---

### 13. **PRODUCT_ANALYTICS**
**Collection:** `productAnalytics`

**Key Attributes:**
- `id` (Primary Key)
- `productId` (Foreign Key → Products)
- `views`
- `likes`
- `shares`
- `inquiries`
- `conversions`
- `lastViewed`
- `createdAt`, `updatedAt`

**Relationships:**
- **One-to-One** with `Products` (via `productId`)

---

### 14. **CUSTOMIZATION_REQUESTS**
**Collection:** `customizationRequests`

**Key Attributes:**
- `id` (Primary Key)
- `customerId` (Foreign Key → Users)
- `customerName`, `customerEmail`
- `productId` (Foreign Key → Products)
- `productName`, `productImage`
- `selectedColorId` (Foreign Key → Colors, optional)
- `colorPriceAdjustment`
- `customerDesignFile` (CustomizationFile)
- `customerPreviewImage` (CustomizationFile)
- `designerId` (Foreign Key → DesignerProfiles, optional)
- `designerName`
- `designerFinalFile` (CustomizationFile)
- `designerPreviewImage` (CustomizationFile)
- `customizationNotes`
- `designerNotes`
- `rejectionReason`
- `pricingAgreement` (designFee, productCost, printingCost, totalCost)
- `paymentDetails` (PaymentDetails structure)
- `printingShopId` (Foreign Key → ShopProfiles, optional)
- `printingShopName`
- `productionDetails` (ProductionDetails structure)
- `status` (CustomizationStatus enum)
- `orderId` (Foreign Key → Orders, optional)
- `requestedAt`, `assignedAt`, `completedAt`, `approvedAt`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (as `customerId`)
- **Many-to-One** with `Products` (via `productId`)
- **Many-to-One** with `DesignerProfiles` (via `designerId`, optional)
- **Many-to-One** with `ShopProfiles` (via `printingShopId`, optional)
- **Many-to-One** with `Colors` (via `selectedColorId`, optional)
- **Many-to-One** with `Orders` (via `orderId`, optional)
- **One-to-Many** with `Disputes` (via `customizationRequestId`)
- **One-to-Many** with `Reviews` (via `customizationRequestId`)

---

### 15. **ORDERS**
**Collection:** `orders`

**Key Attributes:**
- `id` (Primary Key)
- `customerId` (Foreign Key → Users)
- `businessOwnerId` (Foreign Key → Users/ShopProfiles)
- `items[]` (OrderItem[] - contains productId, quantity, price, customizations)
- `subtotal`
- `discountAmount`
- `tax`
- `shippingCost`
- `totalAmount`
- `status` (pending | processing | to_ship | shipped | delivered | cancelled)
- `shippingAddress` (Address)
- `billingAddress` (Address, optional)
- `paymentMethod`
- `paymentStatus` (pending | paid | failed | refunded)
- `trackingNumber`
- `carrier`
- `estimatedDelivery`
- `notes`
- `statusHistory[]` (OrderStatusHistory[])
- `appliedDiscounts[]`
- `appliedCouponCode`
- `customizationRequestId` (Foreign Key → CustomizationRequests, optional)
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (as `customerId`)
- **Many-to-One** with `Users/ShopProfiles` (as `businessOwnerId`)
- **Many-to-One** with `CustomizationRequests` (via `customizationRequestId`, optional)
- **One-to-Many** with `Disputes` (via `orderId`)
- **One-to-Many** with `Reviews` (via order items' productId)

---

### 16. **CARTS**
**Collection:** `carts`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `items[]` (CartItem[] - contains productId, product details, quantity, variants, color, prices)
- `totalItems`
- `totalAmount`
- `discountAmount`
- `appliedCouponCode`
- `appliedDiscounts[]`
- `createdAt`, `updatedAt`

**Relationships:**
- **One-to-One** with `Users` (via `userId` - one cart per user)

---

### 17. **REVIEWS**
**Collection:** `reviews`

**Key Attributes:**
- `id` (Primary Key)
- `customerId` (Foreign Key → Users)
- `customerName`
- `productId` (Foreign Key → Products, optional)
- `shopId` (Foreign Key → ShopProfiles, optional)
- `designerId` (Foreign Key → DesignerProfiles, optional)
- `designId` (Foreign Key → Designs, optional)
- `customizationRequestId` (Foreign Key → CustomizationRequests, optional)
- `rating` (1-5)
- `comment`
- `images[]`
- `isVerified`
- `reviewType` (product | shop | designer | design | customization)
- `reply` (ReviewReply - contains authorId, comment, timestamps)
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (as `customerId`)
- **Many-to-One** with `Products` (via `productId`, optional)
- **Many-to-One** with `ShopProfiles` (via `shopId`, optional)
- **Many-to-One** with `DesignerProfiles` (via `designerId`, optional)
- **Many-to-One** with `Designs` (via `designId`, optional)
- **Many-to-One** with `CustomizationRequests` (via `customizationRequestId`, optional)

---

### 18. **DISPUTES**
**Collection:** `disputes`

**Key Attributes:**
- `id` (Primary Key)
- `orderId` (Foreign Key → Orders, optional)
- `customizationRequestId` (Foreign Key → CustomizationRequests, optional)
- `filedBy` (Foreign Key → Users)
- `accusedParty` (Foreign Key → Users)
- `stage` (negotiation | admin_review | resolved)
- `category` (DisputeCategory enum)
- `description`
- `evidenceImages[]` (EvidenceFile[])
- `evidenceVideo` (EvidenceFile, optional)
- `status` (open | closed)
- `resolutionOutcome` (refunded | released | dismissed | partial_refund)
- `resolutionReason`
- `partialRefundOffer` (PartialRefundOffer)
- `escrowTransactionId`
- `previousEscrowStatus`
- `conversationId` (Foreign Key → Conversations)
- `deadline`
- `negotiationDeadline`
- `adminNotes`
- `resolutionNotes`
- `resolvedBy` (Foreign Key → Users)
- `resolvedAt`
- `strikeIssued`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Orders` (via `orderId`, optional)
- **Many-to-One** with `CustomizationRequests` (via `customizationRequestId`, optional)
- **Many-to-One** with `Users` (as `filedBy`)
- **Many-to-One** with `Users` (as `accusedParty`)
- **Many-to-One** with `Users` (as `resolvedBy`, optional)
- **Many-to-One** with `Conversations` (via `conversationId`)

---

### 19. **CONVERSATIONS**
**Collection:** `conversations`

**Key Attributes:**
- `id` (Primary Key)
- `participants[]` (User IDs)
- `lastMessage`
- `lastMessageAt`
- `unreadCount` (Record<string, number>)
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-Many** with `Users` (via `participants[]`)
- **One-to-Many** with `Messages` (via `conversationId`)
- **One-to-Many** with `Disputes` (via `conversationId`)

---

### 20. **MESSAGES**
**Collection:** `messages`

**Key Attributes:**
- `id` (Primary Key)
- `senderId` (Foreign Key → Users)
- `receiverId` (Foreign Key → Users)
- `conversationId` (Foreign Key → Conversations)
- `content`
- `type` (text | image | file)
- `isRead`
- `attachments[]` (MessageAttachment[])
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (as `senderId`)
- **Many-to-One** with `Users` (as `receiverId`)
- **Many-to-One** with `Conversations` (via `conversationId`)

---

### 21. **DISCOUNTS**
**Collection:** `discounts`

**Key Attributes:**
- `id` (Primary Key)
- `discountName`
- `discountType` (percentage | fixed_amount)
- `discountValue`
- `scope` (product | category | order | shipping)
- `targetIds[]` (product/category IDs)
- `minOrderAmount`
- `maxDiscountAmount`
- `startDate`
- `endDate`
- `isActive`
- `usageLimit`
- `usageCount`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-Many** with `Products` (via `targetIds[]` when scope is 'product')
- **Many-to-Many** with `ProductCategories` (via `targetIds[]` when scope is 'category')
- **Referenced in** `Orders.appliedDiscounts[]`
- **Referenced in** `Carts.appliedDiscounts[]`

---

### 22. **COUPONS**
**Collection:** `coupons`

**Key Attributes:**
- `id` (Primary Key)
- `couponCode` (unique)
- `discountId` (Foreign Key → Discounts)
- `usageLimit`
- `usageCount`
- `startDate`
- `endDate`
- `isActive`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Discounts` (via `discountId`)
- **Referenced in** `Orders.appliedCouponCode`
- **Referenced in** `Carts.appliedCouponCode`

---

### 23. **DESIGNER_VERIFICATION_REQUESTS**
**Collection:** `designerVerificationRequests`

**Key Attributes:**
- `id` (Primary Key)
- `designerId` (Foreign Key → DesignerProfiles)
- `userId` (Foreign Key → Users)
- `status` (pending | approved | rejected | suspended | restored)
- `portfolioUrl`
- `portfolioDescription`
- `specializations[]`
- `yearsExperience`
- `certifications[]`
- `documents` (businessLicense, portfolio, certifications[])
- `submittedAt`
- `reviewedBy` (Foreign Key → Users)
- `reviewedAt`
- `reviewReason`
- `reviewNotes`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `DesignerProfiles` (via `designerId`)
- **Many-to-One** with `Users` (via `userId`)
- **Many-to-One** with `Users` (as `reviewedBy`, optional)

---

### 24. **DESIGNER_APPEALS**
**Collection:** `designerAppeals`

**Key Attributes:**
- `id` (Primary Key)
- `designerId` (Foreign Key → DesignerProfiles)
- `userId` (Foreign Key → Users)
- `businessName`
- `appealReason`
- `additionalInfo`
- `status` (pending | approved | rejected)
- `submittedAt`
- `reviewedBy` (Foreign Key → Users)
- `reviewedAt`
- `reviewNotes`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `DesignerProfiles` (via `designerId`)
- **Many-to-One** with `Users` (via `userId`)
- **Many-to-One** with `Users` (as `reviewedBy`, optional)

---

### 25. **SHOP_APPEALS**
**Collection:** `shopAppeals`

**Key Attributes:**
- `id` (Primary Key)
- `shopId` (Foreign Key → ShopProfiles)
- `userId` (Foreign Key → Users)
- `shopName`
- `appealReason`
- `additionalInfo`
- `status` (pending | approved | rejected)
- `submittedAt`
- `reviewedBy` (Foreign Key → Users)
- `reviewedAt`
- `reviewNotes`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `ShopProfiles` (via `shopId`)
- **Many-to-One** with `Users` (via `userId`)
- **Many-to-One** with `Users` (as `reviewedBy`, optional)

---

### 26. **DESIGNER_APPLICATIONS**
**Collection:** `designerApplications`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `status` (pending | approved | rejected)
- `applicationData` (varies)
- `submittedAt`
- `reviewedBy` (Foreign Key → Users)
- `reviewedAt`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`)
- **Many-to-One** with `Users` (as `reviewedBy`, optional)

---

### 27. **SHOP_APPLICATIONS**
**Collection:** `shopApplications`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `status` (pending | approved | rejected)
- `applicationData` (varies)
- `submittedAt`
- `reviewedBy` (Foreign Key → Users)
- `reviewedAt`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`)
- **Many-to-One** with `Users` (as `reviewedBy`, optional)

---

### 28. **NOTIFICATIONS**
**Collection:** `notifications`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `type` (varies)
- `title`
- `message`
- `isRead`
- `relatedEntityType` (order | customization | dispute | etc.)
- `relatedEntityId`
- `createdAt`, `updatedAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`)

---

### 29. **USER_LIKES**
**Collection:** `userLikes`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `likedEntityType` (product | design)
- `likedEntityId`
- `createdAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`)
- **Polymorphic** relationship to `Products` or `Designs` (via `likedEntityType` and `likedEntityId`)

---

### 30. **PASSWORD_RESET_TOKENS**
**Collection:** `passwordResetTokens`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `token` (unique)
- `expiresAt`
- `used`
- `createdAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`)

---

### 31. **ACTIVITIES**
**Collection:** `activities`

**Key Attributes:**
- `id` (Primary Key)
- `userId` (Foreign Key → Users, optional)
- `activityType` (varies)
- `description`
- `relatedEntityType`
- `relatedEntityId`
- `createdAt`

**Relationships:**
- **Many-to-One** with `Users` (via `userId`, optional)

---

### 32. **DASHBOARD_SNAPSHOTS**
**Collection:** `dashboardSnapshots`

**Key Attributes:**
- `id` (Primary Key)
- `snapshotType` (daily | weekly | monthly)
- `snapshotDate`
- `metrics` (varies by snapshot type)
- `createdAt`

**Relationships:**
- **No direct foreign key relationships** (aggregated data)

---

## 🔗 Relationship Summary

### Primary Relationships:

1. **Users** → **DesignerProfiles** (1:1)
2. **Users** → **ShopProfiles** (1:1)
3. **Users** → **Orders** (1:Many)
4. **Users** → **Carts** (1:1)
5. **Users** → **CustomizationRequests** (1:Many, as customer)
6. **DesignerProfiles** → **Designs** (1:Many)
7. **DesignerProfiles** → **CustomizationRequests** (1:Many)
8. **ShopProfiles** → **Products** (1:Many)
9. **ShopProfiles** → **Orders** (1:Many)
10. **Products** → **ProductImages** (1:Many)
11. **Products** → **ProductVariants** (1:Many)
12. **Products** → **ProductColors** (1:Many)
13. **Products** → **ProductCategories** (Many:1)
14. **ProductCategories** → **ProductCategories** (Self-referencing, hierarchical)
15. **Colors** → **ProductColors** (1:Many)
16. **ProductColors** → **Products** (Many:1)
17. **Products** → **CustomizationRequests** (1:Many)
18. **CustomizationRequests** → **Orders** (1:1, optional)
19. **Orders** → **Disputes** (1:Many)
20. **CustomizationRequests** → **Disputes** (1:Many)
21. **Users** → **Reviews** (1:Many, as customer)
22. **Products** → **Reviews** (1:Many)
23. **ShopProfiles** → **Reviews** (1:Many)
24. **DesignerProfiles** → **Reviews** (1:Many)
25. **Designs** → **Reviews** (1:Many)
26. **Users** → **Messages** (1:Many, as sender/receiver)
27. **Conversations** → **Messages** (1:Many)
28. **Conversations** → **Disputes** (1:Many)

---

## 📝 Notes for ERD Diagram Creation

### Cardinality Symbols:
- **1:1** = One-to-One
- **1:Many** = One-to-Many
- **Many:Many** = Many-to-Many (implemented via junction tables)

### Key Design Patterns:
1. **Polymorphic Relationships**: Reviews can reference multiple entity types (product, shop, designer, design, customization)
2. **Hierarchical Structure**: ProductCategories uses self-referencing for parent-child relationships
3. **Junction Tables**: ProductColors links Products and Colors with additional attributes
4. **Optional Relationships**: Many foreign keys are optional (e.g., `designerId` in CustomizationRequests)
5. **Status Enums**: Many entities use status fields with predefined enum values

### Important Business Rules:
1. A User can have at most one DesignerProfile and one ShopProfile
2. A Cart belongs to exactly one User (1:1 relationship)
3. CustomizationRequests can optionally link to Orders after approval
4. Disputes can reference either Orders or CustomizationRequests
5. Reviews are polymorphic and can reference multiple entity types
6. ProductCategories form a hierarchical tree structure (max 5 levels)

---

## 🎨 ERD Visualization Recommendations

When creating your visual ERD diagram, consider:

1. **Central Entity**: Place **Users** in the center as it connects to most entities
2. **User Role Extensions**: Group **DesignerProfiles** and **ShopProfiles** near **Users**
3. **Product System**: Group **Products**, **ProductCategories**, **ProductImages**, **ProductVariants**, **ProductColors**, **Colors**, and **SizeCharts** together
4. **Order Flow**: Show **CustomizationRequests** → **Orders** → **Disputes** flow
5. **Communication**: Group **Conversations** and **Messages** together
6. **Review System**: Show **Reviews** connecting to multiple entity types (polymorphic)
7. **Analytics**: Place **DesignAnalytics** and **ProductAnalytics** near their respective entities

---

This documentation provides a complete overview of all entities and their relationships in the Fabriqly system for your capstone paper.


