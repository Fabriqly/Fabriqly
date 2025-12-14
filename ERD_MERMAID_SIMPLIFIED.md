# Fabriqly System - Simplified Mermaid ERD Diagram

## Core Entities and Relationships (Simplified View)

This is a simplified version focusing on the main relationships. For the complete diagram, see `ERD_MERMAID.md`.

```mermaid
erDiagram
    %% Core Entities
    USERS {
        id PK
        email
        role
        isVerified
    }
    
    DESIGNER_PROFILES {
        id PK
        userId FK
        businessName
        isVerified
    }
    
    SHOP_PROFILES {
        id PK
        userId FK
        shopName
        approvalStatus
    }
    
    PRODUCTS {
        id PK
        shopId FK
        categoryId FK
        productName
        basePrice
    }
    
    PRODUCT_CATEGORIES {
        id PK
        categoryName
        parentCategoryId FK
    }
    
    DESIGNS {
        id PK
        designerId FK
        categoryId FK
        designName
    }
    
    CUSTOMIZATION_REQUESTS {
        id PK
        customerId FK
        productId FK
        designerId FK
        printingShopId FK
        orderId FK
        status
    }
    
    ORDERS {
        id PK
        customerId FK
        businessOwnerId FK
        customizationRequestId FK
        status
        totalAmount
    }
    
    CARTS {
        id PK
        userId FK
        totalAmount
    }
    
    REVIEWS {
        id PK
        customerId FK
        productId FK
        shopId FK
        designerId FK
        designId FK
        rating
    }
    
    DISPUTES {
        id PK
        orderId FK
        customizationRequestId FK
        filedBy FK
        accusedParty FK
        conversationId FK
        status
    }
    
    CONVERSATIONS {
        id PK
        participants
    }
    
    MESSAGES {
        id PK
        senderId FK
        receiverId FK
        conversationId FK
    }
    
    %% Core Relationships
    USERS ||--o| DESIGNER_PROFILES : "has"
    USERS ||--o| SHOP_PROFILES : "has"
    USERS ||--|| CARTS : "has"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ CUSTOMIZATION_REQUESTS : "creates"
    USERS ||--o{ REVIEWS : "writes"
    USERS ||--o{ MESSAGES : "sends/receives"
    USERS ||--o{ DISPUTES : "files/accused"
    
    DESIGNER_PROFILES ||--o{ DESIGNS : "creates"
    DESIGNER_PROFILES ||--o{ CUSTOMIZATION_REQUESTS : "handles"
    DESIGNER_PROFILES ||--o{ REVIEWS : "receives"
    
    SHOP_PROFILES ||--o{ PRODUCTS : "owns"
    SHOP_PROFILES ||--o{ ORDERS : "fulfills"
    SHOP_PROFILES ||--o{ CUSTOMIZATION_REQUESTS : "prints"
    SHOP_PROFILES ||--o{ REVIEWS : "receives"
    
    PRODUCTS }o--|| SHOP_PROFILES : "belongs_to"
    PRODUCTS }o--|| PRODUCT_CATEGORIES : "categorized_as"
    PRODUCTS ||--o{ CUSTOMIZATION_REQUESTS : "customized_in"
    PRODUCTS ||--o{ REVIEWS : "reviewed"
    
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCT_CATEGORIES ||--o{ DESIGNS : "categorizes"
    PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORIES : "parent_of"
    
    DESIGNS }o--|| DESIGNER_PROFILES : "created_by"
    DESIGNS }o--|| PRODUCT_CATEGORIES : "categorized_as"
    DESIGNS ||--o{ REVIEWS : "reviewed"
    
    CUSTOMIZATION_REQUESTS ||--o| ORDERS : "becomes"
    CUSTOMIZATION_REQUESTS }o--|| PRODUCTS : "for"
    CUSTOMIZATION_REQUESTS }o--o| DESIGNER_PROFILES : "assigned_to"
    CUSTOMIZATION_REQUESTS }o--o| SHOP_PROFILES : "printed_by"
    CUSTOMIZATION_REQUESTS ||--o{ DISPUTES : "disputed"
    CUSTOMIZATION_REQUESTS ||--o{ REVIEWS : "reviewed"
    
    ORDERS ||--o{ DISPUTES : "disputed"
    ORDERS }o--|| USERS : "placed_by"
    ORDERS }o--|| SHOP_PROFILES : "fulfilled_by"
    
    REVIEWS }o--|| USERS : "written_by"
    REVIEWS }o--o| PRODUCTS : "for_product"
    REVIEWS }o--o| SHOP_PROFILES : "for_shop"
    REVIEWS }o--o| DESIGNER_PROFILES : "for_designer"
    REVIEWS }o--o| DESIGNS : "for_design"
    
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    CONVERSATIONS ||--o{ DISPUTES : "discussed_in"
    
    MESSAGES }o--|| USERS : "sent_by"
    MESSAGES }o--|| USERS : "received_by"
    MESSAGES }o--|| CONVERSATIONS : "belongs_to"
    
    DISPUTES }o--o| ORDERS : "about"
    DISPUTES }o--o| CUSTOMIZATION_REQUESTS : "about"
    DISPUTES }o--|| CONVERSATIONS : "discussed_in"
```

## Relationship Flow Summary

### User Flow:
1. **User** → Creates **CustomizationRequest** → Assigned to **Designer** → Sent to **Shop** → Becomes **Order**
2. **User** → Adds to **Cart** → Creates **Order** → **Shop** fulfills

### Review Flow:
- **Reviews** can target: Products, Shops, Designers, Designs, or CustomizationRequests

### Dispute Flow:
- **Disputes** can be filed against **Orders** or **CustomizationRequests**
- **Disputes** are discussed in **Conversations**

### Category Hierarchy:
- **ProductCategories** form a tree structure (self-referencing)

