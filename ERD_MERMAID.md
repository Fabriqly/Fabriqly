# Fabriqly System - Mermaid ERD Diagram (Segmented by Foreign Keys)

## Complete Entity Relationship Diagram

> **Note**: This diagram is organized by segments, showing each main entity followed by all entities that connect to it via foreign keys.

```mermaid
erDiagram
    %% ============================================
    %% SEGMENT 1: USER SYSTEM
    %% ============================================
    USERS {
        int id PK
        string email
        string displayName
        string photoURL
        string role
        boolean isVerified
        string profile
        string shippingAddresses
        datetime createdAt
        datetime updatedAt
    }
    
    DESIGNER_PROFILES {
        int id PK
        int userId FK
        string businessName
        string bio
        string website
        string socialMedia
        string specialties
        boolean isVerified
        boolean isActive
        string portfolioStats
        datetime createdAt
        datetime updatedAt
    }
    
    SHOP_PROFILES {
        int id PK
        int userId FK
        string shopName
        string username
        string businessOwnerName
        string contactInfo
        string location
        string branding
        string businessDetails
        string description
        string specialties
        string supportedProductCategories
        string customizationPolicy
        string socialMedia
        string website
        string ratings
        string shopStats
        string approvalStatus
        boolean isVerified
        boolean isActive
        boolean isFeatured
        int approvedBy FK
        datetime createdAt
        datetime updatedAt
    }
    
    CARTS {
        int id PK
        int userId FK
        string items
        int totalItems
        float totalAmount
        float discountAmount
        string appliedCouponCode
        string appliedDiscounts
        datetime createdAt
        datetime updatedAt
    }
    
    ORDERS {
        int id PK
        int customerId FK
        int businessOwnerId FK
        string items
        float subtotal
        float discountAmount
        float tax
        float shippingCost
        float totalAmount
        string status
        string shippingAddress
        string billingAddress
        string paymentMethod
        string paymentStatus
        string trackingNumber
        string carrier
        string estimatedDelivery
        string notes
        string statusHistory
        string appliedDiscounts
        string appliedCouponCode
        int customizationRequestId FK
        datetime createdAt
        datetime updatedAt
    }
    
    CUSTOMIZATION_REQUESTS {
        int id PK
        int customerId FK
        string customerName
        string customerEmail
        int productId FK
        string productName
        string productImage
        int selectedColorId FK
        float colorPriceAdjustment
        string customerDesignFile
        string customerPreviewImage
        int designerId FK
        string designerName
        string designerFinalFile
        string designerPreviewImage
        string customizationNotes
        string designerNotes
        string rejectionReason
        float pricingAgreement
        string paymentDetails
        int printingShopId FK
        string printingShopName
        string productionDetails
        string status
        int orderId FK
        datetime requestedAt
        datetime assignedAt
        datetime completedAt
        datetime approvedAt
        datetime createdAt
        datetime updatedAt
    }
    
    REVIEWS {
        int id PK
        int customerId FK
        string customerName
        int productId FK
        int shopId FK
        int designerId FK
        int designId FK
        int customizationRequestId FK
        int rating
        string comment
        string images
        boolean isVerified
        string reviewType
        string reply
        datetime createdAt
        datetime updatedAt
    }
    
    MESSAGES {
        int id PK
        int senderId FK
        int receiverId FK
        int conversationId FK
        string content
        string type
        boolean isRead
        string attachments
        datetime createdAt
        datetime updatedAt
    }
    
    DISPUTES {
        int id PK
        int orderId FK
        int customizationRequestId FK
        int filedBy FK
        int accusedParty FK
        string stage
        string category
        string description
        string evidenceImages
        string evidenceVideo
        string status
        string resolutionOutcome
        string resolutionReason
        float partialRefundOffer
        string escrowTransactionId
        string previousEscrowStatus
        int conversationId FK
        datetime deadline
        datetime negotiationDeadline
        string adminNotes
        string resolutionNotes
        int resolvedBy FK
        datetime resolvedAt
        boolean strikeIssued
        datetime createdAt
        datetime updatedAt
    }
    
    NOTIFICATIONS {
        int id PK
        int userId FK
        string type
        string title
        string message
        boolean isRead
        string relatedEntityType
        string relatedEntityId
        datetime createdAt
        datetime updatedAt
    }
    
    USER_LIKES {
        int id PK
        int userId FK
        string likedEntityType
        string likedEntityId
        datetime createdAt
    }
    
    PASSWORD_RESET_TOKENS {
        int id PK
        int userId FK
        string token
        datetime expiresAt
        boolean used
        datetime createdAt
    }
    
    ACTIVITIES {
        int id PK
        int userId FK
        string activityType
        string description
        string relatedEntityType
        string relatedEntityId
        datetime createdAt
    }
    
    DESIGNER_VERIFICATION_REQUESTS {
        int id PK
        int designerId FK
        int userId FK
        string status
        string portfolioUrl
        string portfolioDescription
        string specializations
        int yearsExperience
        string certifications
        string documents
        datetime submittedAt
        int reviewedBy FK
        datetime reviewedAt
        string reviewReason
        string reviewNotes
        datetime createdAt
        datetime updatedAt
    }
    
    DESIGNER_APPEALS {
        int id PK
        int designerId FK
        int userId FK
        string businessName
        string appealReason
        string additionalInfo
        string status
        datetime submittedAt
        int reviewedBy FK
        datetime reviewedAt
        string reviewNotes
        datetime createdAt
        datetime updatedAt
    }
    
    DESIGNER_APPLICATIONS {
        int id PK
        int userId FK
        string status
        string applicationData
        datetime submittedAt
        int reviewedBy FK
        datetime reviewedAt
        datetime createdAt
        datetime updatedAt
    }
    
    SHOP_APPEALS {
        int id PK
        int shopId FK
        int userId FK
        string shopName
        string appealReason
        string additionalInfo
        string status
        datetime submittedAt
        int reviewedBy FK
        datetime reviewedAt
        string reviewNotes
        datetime createdAt
        datetime updatedAt
    }
    
    SHOP_APPLICATIONS {
        int id PK
        int userId FK
        string status
        string applicationData
        datetime submittedAt
        int reviewedBy FK
        datetime reviewedAt
        datetime createdAt
        datetime updatedAt
    }
    
    COLORS {
        int id PK
        string colorName
        string hexCode
        string rgbCode
        int businessOwnerId FK
        boolean isActive
        datetime createdAt
    }
    
    %% User System Relationships
    USERS ||--o| DESIGNER_PROFILES : has
    USERS ||--o| SHOP_PROFILES : has
    USERS ||--|| CARTS : has
    USERS ||--o{ ORDERS : places
    USERS ||--o{ CUSTOMIZATION_REQUESTS : creates
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ MESSAGES : receives
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ USER_LIKES : has
    USERS ||--o{ PASSWORD_RESET_TOKENS : has
    USERS ||--o{ ACTIVITIES : performs
    USERS ||--o{ DISPUTES : files
    USERS ||--o{ DISPUTES : accused
    USERS ||--o{ DISPUTES : resolves
    USERS ||--o{ DESIGNER_VERIFICATION_REQUESTS : submits
    USERS ||--o{ DESIGNER_VERIFICATION_REQUESTS : reviews
    USERS ||--o{ DESIGNER_APPEALS : submits
    USERS ||--o{ DESIGNER_APPEALS : reviews
    USERS ||--o{ DESIGNER_APPLICATIONS : submits
    USERS ||--o{ DESIGNER_APPLICATIONS : reviews
    USERS ||--o{ SHOP_APPEALS : submits
    USERS ||--o{ SHOP_APPEALS : reviews
    USERS ||--o{ SHOP_APPLICATIONS : submits
    USERS ||--o{ SHOP_APPLICATIONS : reviews
    USERS ||--o{ COLORS : owns
    
    %% ============================================
    %% SEGMENT 2: DESIGNER SYSTEM
    %% ============================================
    DESIGNS {
        int id PK
        int designerId FK
        int categoryId FK
        string designName
        string description
        string designSlug
        string designFileUrl
        string thumbnailUrl
        string previewUrl
        string designType
        string fileFormat
        string tags
        boolean isPublic
        boolean isFeatured
        boolean isActive
        float pricing
        int downloadCount
        int viewCount
        int likesCount
        datetime createdAt
        datetime updatedAt
    }
    
    DESIGN_ANALYTICS {
        int id PK
        int designId FK
        int views
        int downloads
        int likes
        int shares
        datetime lastViewed
        datetime createdAt
        datetime updatedAt
    }
    
    %% Designer System Relationships
    DESIGNER_PROFILES ||--o{ DESIGNS : creates
    DESIGNER_PROFILES ||--o{ CUSTOMIZATION_REQUESTS : handles
    DESIGNER_PROFILES ||--o{ DESIGNER_VERIFICATION_REQUESTS : has
    DESIGNER_PROFILES ||--o{ DESIGNER_APPEALS : has
    DESIGNER_PROFILES ||--o{ REVIEWS : receives
    DESIGNS ||--|| DESIGN_ANALYTICS : has
    DESIGNS ||--o{ REVIEWS : receives
    
    %% ============================================
    %% SEGMENT 3: SHOP SYSTEM
    %% ============================================
    PRODUCTS {
        int id PK
        int shopId FK
        int categoryId FK
        string productName
        string shortDescription
        string detailedDescription
        string productSku
        float basePrice
        string currency
        boolean isCustomizable
        boolean isFeatured
        boolean isActive
        int stockQuantity
        int minOrderQuantity
        float weightGrams
        string dimensions
        string tags
        string specifications
        string seoTitle
        string seoDescription
        int sizeChartId FK
        datetime createdAt
        datetime updatedAt
    }
    
    %% Shop System Relationships
    SHOP_PROFILES ||--o{ PRODUCTS : owns
    SHOP_PROFILES ||--o{ ORDERS : fulfills
    SHOP_PROFILES ||--o{ CUSTOMIZATION_REQUESTS : prints
    SHOP_PROFILES ||--o{ SHOP_APPLICATIONS : has
    SHOP_PROFILES ||--o{ SHOP_APPEALS : has
    SHOP_PROFILES ||--o{ REVIEWS : receives
    
    %% ============================================
    %% SEGMENT 4: PRODUCT SYSTEM
    %% ============================================
    PRODUCT_IMAGES {
        int id PK
        int productId FK
        string imageUrl
        string thumbnailUrl
        string altText
        int displayOrder
        string imageType
        datetime uploadedAt
        datetime editedAt
    }
    
    PRODUCT_VARIANTS {
        int id PK
        int productId FK
        string variantName
        string variantValue
        float priceAdjustment
        int stock
        string sku
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    PRODUCT_COLORS {
        int id PK
        int productId FK
        int colorId FK
        float priceAdjustment
        boolean isAvailable
        int stockQuantity
        datetime createdAt
    }
    
    PRODUCT_ANALYTICS {
        int id PK
        int productId FK
        int views
        int likes
        int shares
        int inquiries
        int conversions
        datetime lastViewed
        datetime createdAt
        datetime updatedAt
    }
    
    %% Product System Relationships
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCTS ||--o{ PRODUCT_COLORS : has
    PRODUCTS ||--|| PRODUCT_ANALYTICS : has
    PRODUCTS ||--o{ CUSTOMIZATION_REQUESTS : customized_in
    PRODUCTS ||--o{ REVIEWS : reviewed
    PRODUCTS }o--|| SHOP_PROFILES : belongs_to
    PRODUCTS }o--|| PRODUCT_CATEGORIES : categorized_as
    PRODUCTS }o--o| SIZE_CHARTS : uses
    
    %% ============================================
    %% SEGMENT 5: CATEGORY SYSTEM
    %% ============================================
    PRODUCT_CATEGORIES {
        int id PK
        string categoryName
        string description
        string slug
        string iconUrl
        int parentCategoryId FK
        int level
        string path
        boolean isActive
        int sortOrder
        datetime createdAt
        datetime updatedAt
    }
    
    SIZE_CHARTS {
        int id PK
        string chartName
        string description
        string sizeData
        int categoryId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    %% Category System Relationships
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCT_CATEGORIES ||--o{ DESIGNS : categorizes
    PRODUCT_CATEGORIES ||--o{ SIZE_CHARTS : has
    PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORIES : parent_of
    SIZE_CHARTS }o--o| PRODUCT_CATEGORIES : belongs_to
    
    %% ============================================
    %% SEGMENT 6: COLOR SYSTEM
    %% ============================================
    %% Color System Relationships
    COLORS ||--o{ PRODUCT_COLORS : used_in
    PRODUCT_COLORS }o--|| PRODUCTS : applies_to
    PRODUCT_COLORS }o--|| COLORS : references
    
    %% ============================================
    %% SEGMENT 7: ORDER SYSTEM
    %% ============================================
    %% Order System Relationships
    ORDERS ||--o{ DISPUTES : disputed
    ORDERS }o--|| USERS : placed_by
    ORDERS }o--|| SHOP_PROFILES : fulfilled_by
    CUSTOMIZATION_REQUESTS ||--o| ORDERS : becomes
    
    %% ============================================
    %% SEGMENT 8: CUSTOMIZATION SYSTEM
    %% ============================================
    %% Customization System Relationships
    CUSTOMIZATION_REQUESTS }o--|| PRODUCTS : for
    CUSTOMIZATION_REQUESTS }o--o| DESIGNER_PROFILES : assigned_to
    CUSTOMIZATION_REQUESTS }o--o| SHOP_PROFILES : printed_by
    CUSTOMIZATION_REQUESTS }o--o| COLORS : uses
    CUSTOMIZATION_REQUESTS ||--o{ DISPUTES : disputed
    CUSTOMIZATION_REQUESTS ||--o{ REVIEWS : reviewed
    
    %% ============================================
    %% SEGMENT 9: REVIEW SYSTEM
    %% ============================================
    %% Review System Relationships (Polymorphic)
    REVIEWS }o--|| USERS : written_by
    REVIEWS }o--o| PRODUCTS : for_product
    REVIEWS }o--o| SHOP_PROFILES : for_shop
    REVIEWS }o--o| DESIGNER_PROFILES : for_designer
    REVIEWS }o--o| DESIGNS : for_design
    REVIEWS }o--o| CUSTOMIZATION_REQUESTS : for_customization
    
    %% ============================================
    %% SEGMENT 10: CONVERSATION SYSTEM
    %% ============================================
    CONVERSATIONS {
        int id PK
        string participants
        string lastMessage
        datetime lastMessageAt
        int unreadCount
        datetime createdAt
        datetime updatedAt
    }
    
    %% Conversation System Relationships
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ DISPUTES : discussed_in
    MESSAGES }o--|| USERS : sent_by
    MESSAGES }o--|| USERS : received_by
    MESSAGES }o--|| CONVERSATIONS : belongs_to
    
    %% ============================================
    %% SEGMENT 11: DISPUTE SYSTEM
    %% ============================================
    %% Dispute System Relationships
    DISPUTES }o--o| ORDERS : about
    DISPUTES }o--o| CUSTOMIZATION_REQUESTS : about
    DISPUTES }o--|| CONVERSATIONS : discussed_in
    
    %% ============================================
    %% SEGMENT 12: DISCOUNT SYSTEM
    %% ============================================
    DISCOUNTS {
        int id PK
        string discountName
        string discountType
        float discountValue
        string scope
        string targetIds
        float minOrderAmount
        float maxDiscountAmount
        datetime startDate
        datetime endDate
        boolean isActive
        int usageLimit
        int usageCount
        datetime createdAt
        datetime updatedAt
    }
    
    COUPONS {
        int id PK
        string couponCode
        int discountId FK
        int usageLimit
        int usageCount
        datetime startDate
        datetime endDate
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    %% Discount System Relationships
    DISCOUNTS ||--o{ COUPONS : has
    
    %% ============================================
    %% SEGMENT 13: APPLICATION SYSTEM
    %% ============================================
    %% Application System Relationships
    DESIGNER_VERIFICATION_REQUESTS }o--|| DESIGNER_PROFILES : for
    SHOP_APPEALS }o--|| SHOP_PROFILES : for
    
    %% ============================================
    %% SEGMENT 14: STANDALONE ENTITIES
    %% ============================================
    DASHBOARD_SNAPSHOTS {
        int id PK
        string snapshotType
        datetime snapshotDate
        string metrics
        datetime createdAt
    }
```

## Diagram Organization

This diagram is organized into **14 segments** based on foreign key relationships:

1. **User System** - USERS and all entities with `userId` FK
2. **Designer System** - DESIGNER_PROFILES and entities with `designerId` FK
3. **Shop System** - SHOP_PROFILES and entities with `shopId` FK
4. **Product System** - PRODUCTS and entities with `productId` FK
5. **Category System** - PRODUCT_CATEGORIES and entities with `categoryId` FK
6. **Color System** - COLORS and entities with `colorId` FK
7. **Order System** - ORDERS and entities with `orderId` FK
8. **Customization System** - CUSTOMIZATION_REQUESTS and related entities
9. **Review System** - REVIEWS (polymorphic relationships)
10. **Conversation System** - CONVERSATIONS and entities with `conversationId` FK
11. **Dispute System** - DISPUTES and related entities
12. **Discount System** - DISCOUNTS and entities with `discountId` FK
13. **Application System** - Application and appeal entities
14. **Standalone Entities** - Entities with no foreign key dependencies

## Diagram Notes

### Cardinality Symbols:
- `||--||` = One-to-One (1:1)
- `||--o{` = One-to-Many (1:Many)
- `}o--||` = Many-to-One (Many:1)
- `}o--o|` = Many-to-One Optional (Many:1, optional)
- `||--o|` = One-to-One Optional (1:1, optional)

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
