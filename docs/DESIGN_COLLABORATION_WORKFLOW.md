# Design Collaboration Workflow - Complete Implementation

## Overview

This document describes the complete end-to-end workflow for design collaboration in Fabriqly, from initial customer request through production completion and reviews.

## System Architecture

### Core Components

1. **Messaging System** - Real-time chat between customer and designer
2. **Payment System** - Flexible payment options (upfront, half-payment, milestone)
3. **Shop Selection** - Choose printing shop after design approval
4. **Production Management** - Business owner production workflow
5. **Review System** - Customer reviews for designer, shop, and service

## Complete Workflow

### Phase 1: Initial Request & Designer Assignment

**Status**: `pending_designer_review` → `in_progress`

1. Customer submits customization request
2. Designers view pending requests
3. Designer claims the request
4. Request status changes to `in_progress`

### Phase 2: Design Collaboration

**Status**: `in_progress`

**Features Available**:
- **Transaction Chat**: Real-time messaging between customer and designer
- **Pricing Agreement**: Designer proposes pricing breakdown

**Steps**:

1. Designer and customer communicate via Transaction Chat
2. Designer creates pricing agreement:
   ```typescript
   POST /api/customizations/{id}/pricing
   {
     designFee: number,
     productCost: number,
     printingCost: number,
     paymentType: 'upfront' | 'half_payment' | 'milestone',
     milestones?: Array<{ description, amount }>
   }
   ```
3. Customer reviews and agrees to pricing:
   ```typescript
   PATCH /api/customizations/{id}/pricing
   ```

### Phase 3: Payment

**Payment Types**:

1. **Upfront Payment** - 100% before production starts
2. **Half Payment** - 50% upfront, 50% on completion
3. **Milestone-based** - Custom payment schedule

**Process**:

```typescript
POST /api/customizations/{id}/payment
{
  amount: number,
  paymentMethod: string,
  milestoneId?: string  // For milestone payments
}
```

**Payment Integration**:
- Uses Xendit for payment processing
- Generates invoice with redirect URLs
- Webhook handles payment confirmation
- Updates `paymentDetails` in request

### Phase 4: Design Submission & Approval

**Status**: `in_progress` → `awaiting_customer_approval` → `approved`

**Steps**:

1. Designer uploads final design
2. Customer reviews design
3. Customer either:
   - Approves → Status: `approved`
   - Rejects → Status: `in_progress` (for revisions)

### Phase 5: Printing Shop Selection

**Status**: `approved`

**Options**:

1. **Shop-Affiliated Printing**: Designer's own shop (recommended)
2. **Independent Shop**: Customer chooses from available shops

**API**:

```typescript
// Get available shops
GET /api/customizations/{id}/shop/available

// Select shop
POST /api/customizations/{id}/shop
{
  shopId: string
}
```

**Response includes**:
- `designerShop`: Designer's affiliated shop (if exists)
- `otherShops`: Other available printing shops

### Phase 6: Production Workflow

**Status**: `approved` → `in_production` → `ready_for_pickup`

**Business Owner Actions**:

#### 6.1 Confirm Production

```typescript
POST /api/production/{requestId}
{
  estimatedCompletionDate: Date,
  materials?: string,
  notes?: string
}
```

**Requirements**:
- Payment verification:
  - Upfront: Must be fully paid
  - Half payment: At least 50% paid
  - Milestone: First milestone paid

**Result**:
- Status: `in_production`
- `productionDetails.status`: `confirmed`

#### 6.2 Start Production

```typescript
PATCH /api/production/{requestId}
{
  action: 'start'
}
```

**Result**:
- `productionDetails.status`: `in_progress`
- `startedAt` timestamp recorded

#### 6.3 Update Production

```typescript
PATCH /api/production/{requestId}
{
  status?: 'in_progress' | 'quality_check',
  estimatedCompletionDate?: Date,
  materials?: string,
  notes?: string
}
```

#### 6.4 Complete Production

```typescript
PATCH /api/production/{requestId}
{
  action: 'complete',
  qualityCheckPassed: boolean,
  qualityCheckNotes?: string
}
```

**Requirements**:
- Quality check must pass

**Result**:
- Status: `ready_for_pickup`
- `productionDetails.status`: `completed`

#### 6.5 View Shop Production

```typescript
GET /api/production/shop/{shopId}
```

**Returns**:
- List of production requests
- Production statistics

### Phase 7: Transaction Completion

**Status**: `ready_for_pickup` → `completed`

**Steps**:

1. Customer confirms receipt
2. Complete transaction:
   ```typescript
   POST /api/customizations/{id}/complete
   ```
3. Final payment (if using half-payment or remaining milestones)
4. Status changes to `completed`

### Phase 8: Reviews

**Status**: `completed`

**Customer can review**:
1. Designer
2. Printing Shop
3. Overall Service

**API**:

```typescript
POST /api/reviews
{
  rating: 1-5,
  comment: string,
  reviewType: 'designer' | 'shop' | 'customization',
  designerId?: string,
  shopId?: string,
  customizationRequestId?: string
}
```

**Effects**:
- Updates designer average rating
- Updates shop average rating
- Helps future customers make informed decisions

## Data Models

### CustomizationRequest (Extended)

```typescript
interface CustomizationRequest {
  id: string;
  
  // Customer & Designer
  customerId: string;
  designerId?: string;
  
  // Product
  productId: string;
  productName: string;
  
  // Files
  customerDesignFile?: CustomizationFile;
  designerFinalFile?: CustomizationFile;
  
  // Pricing & Payment
  pricingAgreement?: PricingAgreement;
  paymentDetails?: PaymentDetails;
  
  // Printing Shop
  printingShopId?: string;
  printingShopName?: string;
  
  // Production
  productionDetails?: ProductionDetails;
  
  // Status
  status: CustomizationStatus;
  
  // Timestamps
  requestedAt: Timestamp;
  assignedAt?: Timestamp;
  approvedAt?: Timestamp;
  completedAt?: Timestamp;
}
```

### PricingAgreement

```typescript
interface PricingAgreement {
  designFee: number;
  productCost: number;
  printingCost: number;
  totalCost: number;
  agreedAt: Timestamp;
  agreedByCustomer: boolean;
  agreedByDesigner: boolean;
}
```

### PaymentDetails

```typescript
interface PaymentDetails {
  paymentType: 'upfront' | 'half_payment' | 'milestone';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'pending' | 'partially_paid' | 'fully_paid';
  currency: string;
  milestones?: Array<Milestone>;
  payments: Array<Payment>;
}
```

### ProductionDetails

```typescript
interface ProductionDetails {
  status: 'pending' | 'confirmed' | 'in_progress' | 'quality_check' | 'completed';
  confirmedAt?: Timestamp;
  startedAt?: Timestamp;
  estimatedCompletionDate?: Timestamp;
  actualCompletionDate?: Timestamp;
  materials?: string;
  notes?: string;
  qualityCheckPassed?: boolean;
  qualityCheckNotes?: string;
}
```

## UI Components

### 1. TransactionChat

**Location**: `src/components/messaging/TransactionChat.tsx`

**Usage**:
```tsx
<TransactionChat
  customizationRequestId={requestId}
  otherUserId={designerId}
  otherUserName={designerName}
  otherUserRole="designer"
/>
```

### 2. PricingAgreementForm

**Location**: `src/components/customization/PricingAgreementForm.tsx`

**Usage** (Designer):
```tsx
<PricingAgreementForm
  customizationRequestId={requestId}
  onSuccess={() => {}}
  onCancel={() => {}}
/>
```

### 3. ShopSelectionModal

**Location**: `src/components/customization/ShopSelectionModal.tsx`

**Usage** (Customer):
```tsx
<ShopSelectionModal
  customizationRequestId={requestId}
  onSelect={() => {}}
  onClose={() => {}}
/>
```

### 4. ProductionTracker

**Location**: `src/components/customization/ProductionTracker.tsx`

**Usage**:
```tsx
<ProductionTracker request={customizationRequest} />
```

### 5. ReviewForm

**Location**: `src/components/reviews/ReviewForm.tsx`

**Usage**:
```tsx
<ReviewForm
  reviewType="designer"
  targetId={designerId}
  targetName={designerName}
  onSuccess={() => {}}
  onCancel={() => {}}
/>
```

## API Routes Summary

### Messaging
- `GET /api/messages` - Get user's conversations
- `POST /api/messages` - Send a message
- `GET /api/messages/conversation/{id}` - Get messages
- `PATCH /api/messages/conversation/{id}` - Mark as read
- `GET /api/messages/customization/{requestId}` - Get/create conversation for request

### Pricing & Payment
- `POST /api/customizations/{id}/pricing` - Create pricing agreement
- `PATCH /api/customizations/{id}/pricing` - Agree to pricing
- `POST /api/customizations/{id}/payment` - Process payment
- `GET /api/customizations/{id}/payment` - Get payment status

### Shop Selection
- `GET /api/customizations/{id}/shop/available` - Get available shops
- `POST /api/customizations/{id}/shop` - Select shop

### Production
- `POST /api/production/{requestId}` - Confirm production
- `PATCH /api/production/{requestId}` - Update/start/complete production
- `GET /api/production/shop/{shopId}` - Get shop production requests

### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/average` - Get average rating
- `POST /api/customizations/{id}/complete` - Complete transaction

## Events

The system emits events for real-time notifications:

```typescript
// Messaging
'message.sent'

// Pricing
'customization.pricing.created'
'customization.pricing.agreed'

// Payment
'customization.payment.updated'

// Shop Selection
'customization.shop.selected'

// Production
'customization.production.confirmed'
'customization.production.started'
'customization.production.updated'
'customization.production.completed'

// Completion
'customization.transaction.completed'

// Reviews
'review.created'
```

## Integration with Existing Dashboard

### Customer Dashboard (`/dashboard/customizations`)

**Add sections**:
1. **Active Requests** - Show transaction chat button
2. **Pending Payment** - Show payment options
3. **Awaiting Approval** - Show approved designs needing shop selection
4. **In Production** - Show production tracker
5. **Ready for Pickup** - Show completion button
6. **Completed** - Show review buttons

### Designer Dashboard (`/dashboard/customizations`)

**Add sections**:
1. **Active Projects** - Show chat and pricing form
2. **Awaiting Payment** - Track payment status
3. **In Production** - Track production status

### Business Owner Dashboard (`/dashboard/production`)

**Create new page**:
1. **Pending Confirmations** - Requests awaiting confirmation
2. **In Production** - Active production requests
3. **Completed** - Completed productions
4. **Statistics** - Production metrics

## Testing Checklist

### Phase 1-2: Messaging & Pricing
- [ ] Send/receive messages
- [ ] Create pricing agreement
- [ ] Customer agrees to pricing

### Phase 3: Payment
- [ ] Upfront payment
- [ ] Half payment
- [ ] Milestone payment
- [ ] Webhook handling

### Phase 4-5: Approval & Shop Selection
- [ ] Approve design
- [ ] View available shops
- [ ] Select designer's shop
- [ ] Select independent shop

### Phase 6: Production
- [ ] Confirm production (check payment requirements)
- [ ] Start production
- [ ] Update production status
- [ ] Complete production with quality check

### Phase 7-8: Completion & Reviews
- [ ] Complete transaction
- [ ] Submit designer review
- [ ] Submit shop review
- [ ] View average ratings

## Security Considerations

1. **Authorization**: All endpoints verify user ownership
2. **Payment Verification**: Production requires payment confirmation
3. **Quality Control**: Production completion requires quality check
4. **Review Authenticity**: Only completed transactions can be reviewed

## Future Enhancements

1. **Real-time Updates**: WebSocket for live chat and status updates
2. **File Sharing**: Enhanced file upload in chat
3. **Dispute Resolution**: Handle payment disputes
4. **Analytics**: Advanced metrics for designers and shops
5. **Automated Reminders**: Email/SMS notifications for status changes

## Troubleshooting

### Common Issues

1. **Payment not processing**
   - Check Xendit configuration
   - Verify webhook endpoint
   - Check payment method validity

2. **Cannot start production**
   - Verify payment requirements met
   - Check shop ownership
   - Ensure request is in approved status

3. **Reviews not submitting**
   - Verify transaction is completed
   - Check for duplicate reviews
   - Validate rating (1-5)

## Conclusion

This implementation provides a complete end-to-end workflow for design collaboration, incorporating all requirements from the specification:

✅ Transaction Chat between customer and designer
✅ Flexible payment options (upfront, half-payment, milestone)
✅ Printing shop selection (affiliated or independent)
✅ Business owner production workflow
✅ Transaction completion and review system

All features are integrated with the existing customization system and follow consistent patterns for maintainability and scalability.



















