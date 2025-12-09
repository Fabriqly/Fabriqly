# Customization System Documentation

## Overview

The Customization System allows customers to request custom designs for products, have designers work on those designs, review and approve the final work, and proceed to order fulfillment. This document provides a comprehensive guide to the system's architecture, features, and usage.

## System Architecture

### Workflow

```
Customer                  System                  Designer
   |                         |                        |
   |--- Select Product ----->|                        |
   |--- Upload Design ------>|                        |
   |                         |--- Generate Preview -->|
   |                         |<-- Show Preview -------|
   |--- Submit Request ----->|                        |
   |                         |--- Notify ------------>|
   |                         |                        |
   |                         |<--- Download Request --|
   |                         |                        |--- Work in Photoshop
   |                         |                        |--- Upload Final Design -->
   |                         |--- Notify ------------>|
   |<--- Review Final -------|                        |
   |--- Approve/Reject ----->|                        |
   |                         |                        |
   |                         |--- If Approved: Send to Order Management --->|
```

### Request Statuses

1. **pending_designer_review**: Customer submitted, waiting for designer to claim
2. **in_progress**: Designer claimed and is working on it
3. **awaiting_customer_approval**: Designer uploaded final design, customer needs to review
4. **approved**: Customer approved, ready for order processing
5. **rejected**: Customer rejected, needs revision (loops back to in_progress)
6. **completed**: Order fulfilled
7. **cancelled**: Request cancelled by customer

## Technology Stack

### Backend

- **Type Definitions**: `src/types/customization.ts`
- **Repository**: `src/repositories/CustomizationRepository.ts`
- **Service**: `src/services/CustomizationService.ts`
- **API Routes**: `src/app/api/customizations/`

### Frontend

- **Customer Components**:
  - `CustomizationRequestForm.tsx` - Submit new request
  - `CustomizationRequestList.tsx` - View all requests
  - `CustomizationReviewModal.tsx` - Review and approve/reject

- **Designer Components**:
  - `DesignerPendingRequests.tsx` - View available requests
  - `DesignerWorkModal.tsx` - Upload final design

### Database

- **Collection**: `customizationRequests` (Firestore)
- **Storage**: Supabase Storage (designs bucket)

## Features

### 1. Customer Features

#### Submit Customization Request
- Select customizable product
- Upload design files (AI, PSD, PDF, PNG, JPG, SVG - up to 20MB)
- Upload preview/mockup image (up to 5MB)
- Provide detailed instructions
- Specify quantity

#### Track Requests
- View all submitted requests
- See current status
- Access statistics dashboard
- Filter by status

#### Review Designer Work
- View final design preview
- Download final design files
- Approve or request revisions
- Provide revision feedback

### 2. Designer Features

#### Claim Requests
- View all pending requests
- See customer requirements
- Download customer files
- Claim available requests

#### Work on Designs
- Access customer files and instructions
- View rejection feedback (if any)
- Upload final design file (up to 20MB)
- Upload preview image (required)
- Add notes for customer

#### Dashboard
- View active requests
- Track workload
- See completion statistics

### 3. Admin Features

- View all requests across system
- Monitor designer workload
- Access statistics and analytics
- Manage cancellations

## API Endpoints

### Main Routes

#### `GET /api/customizations`
Get customization requests with filters
- Query params: `customerId`, `designerId`, `status`, `productId`
- Returns: Array of requests

#### `POST /api/customizations`
Create new customization request
- Body: Product info, quantity, notes, optional files
- Returns: Created request

#### `GET /api/customizations/[id]`
Get single request with full details
- Returns: Request with customer, designer, and product info

#### `PATCH /api/customizations/[id]`
Update request (various actions)
- Actions: `assign`, `uploadFinal`, `approve`, `reject`, `cancel`
- Returns: Updated request

#### `DELETE /api/customizations/[id]`
Cancel request
- Returns: Cancelled request

### Specialized Routes

#### `GET /api/customizations/pending`
Get pending requests (designers only)
- Returns: Array of unclaimed requests

#### `GET /api/customizations/stats`
Get statistics
- Query params: `customerId`, `designerId`
- Returns: Statistics object

#### `POST /api/customizations/upload`
Upload files
- Form data: `file`, `type` (customer_design, designer_final, preview)
- Returns: File metadata

#### `GET /api/customizations/workload`
Get designer workload
- Query params: `designerId` (optional)
- Returns: Workload data

## File Upload System

### Supported File Types

**Design Files** (customer & designer):
- Adobe Illustrator (.ai)
- Photoshop (.psd)
- PDF (.pdf)
- PNG (.png)
- JPEG (.jpg, .jpeg)
- SVG (.svg)
- Max size: 20MB

**Preview Images**:
- Any image format
- Max size: 5MB

### Storage Structure
```
customizations/
  ├── {userId}/
  │   ├── customer_design/
  │   │   └── {timestamp}_{filename}
  │   ├── designer_final/
  │   │   └── {timestamp}_{filename}
  │   └── preview/
  │       └── {timestamp}_{filename}
```

## Notification System

### Events Emitted

1. **customization.request.created**
   - When: Customer submits new request
   - Notifies: All designers

2. **customization.designer.assigned**
   - When: Designer claims request
   - Notifies: Customer

3. **customization.design.completed**
   - When: Designer uploads final work
   - Notifies: Customer

4. **customization.design.approved**
   - When: Customer approves design
   - Notifies: Designer

5. **customization.design.rejected**
   - When: Customer requests revision
   - Notifies: Designer (with feedback)

6. **customization.request.cancelled**
   - When: Request is cancelled
   - Notifies: Designer (if assigned)

## Usage Examples

### Customer: Submit Request

```typescript
// Navigate to product page
router.push('/products/{productId}');

// Click "Customize This Product" button
// Redirects to /products/{productId}/customize

// Fill form and submit
const formData = {
  productId: 'product-123',
  productName: 'Custom T-Shirt',
  quantity: 10,
  customizationNotes: 'I want a logo on the front...',
  customerDesignFile: uploadedFile,
  customerPreviewImage: previewFile
};

await fetch('/api/customizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

### Designer: Claim Request

```typescript
// View pending requests at /dashboard/customizations
// Click "Claim Request" button

await fetch('/api/customizations/{requestId}', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'assign' })
});
```

### Designer: Upload Final Design

```typescript
// Upload files first
const finalFileData = await uploadFile(finalFile, 'designer_final');
const previewData = await uploadFile(previewFile, 'preview');

// Submit work
await fetch('/api/customizations/{requestId}', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'uploadFinal',
    designerFinalFile: finalFileData,
    designerPreviewImage: previewData,
    designerNotes: 'Design completed as requested...'
  })
});
```

### Customer: Approve Design

```typescript
await fetch('/api/customizations/{requestId}', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'approve' })
});
```

### Customer: Request Revision

```typescript
await fetch('/api/customizations/{requestId}', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'reject',
    rejectionReason: 'Please make the logo bigger and change color to blue'
  })
});
```

## Security & Authorization

### Role-Based Access

- **Customers**: Can only see/manage their own requests
- **Designers**: Can see all pending requests, their own active requests
- **Business Owners**: Same as designers
- **Admins**: Full access to all requests

### File Access

- Files stored in Supabase with proper access controls
- URLs generated with appropriate permissions
- File metadata stored in Firestore

## Integration Points

### With Product System
- Only customizable products can receive customization requests
- Product info embedded in request
- Product images used as reference

### With Order System
- Approved requests can be converted to orders
- Request ID linked to order
- Custom design files attached to order

### With User System
- Customer and designer info populated
- Role-based authorization
- Activity tracking

## Statistics & Analytics

### Customer Dashboard
- Total requests
- Pending review count
- In progress count
- Completed count

### Designer Dashboard
- Active requests
- Completed today
- Average completion time
- Total earnings (future)

### Admin Analytics
- Total system requests
- Designer workload distribution
- Average turnaround time
- Success rate

## Testing

### Manual Testing Checklist

1. **Customer Flow**
   - [ ] Submit new request
   - [ ] Upload design files
   - [ ] View request list
   - [ ] Review final design
   - [ ] Approve design
   - [ ] Request revision
   - [ ] Cancel request

2. **Designer Flow**
   - [ ] View pending requests
   - [ ] Claim request
   - [ ] Download customer files
   - [ ] Upload final design
   - [ ] View revision feedback
   - [ ] Re-submit after revision

3. **Notifications**
   - [ ] Designer notified of new request
   - [ ] Customer notified when designer assigned
   - [ ] Customer notified when design ready
   - [ ] Designer notified of approval
   - [ ] Designer notified of rejection

## Future Enhancements

1. **Payment Integration**
   - Charge for customization service
   - Designer commission system
   - Refund handling

2. **Real-time Collaboration**
   - Live chat between customer and designer
   - Real-time status updates
   - WebSocket notifications

3. **Advanced Features**
   - Template library for designers
   - AI-powered mockup generation
   - Batch customization requests
   - Recurring customizations

4. **Analytics**
   - Designer performance metrics
   - Customer satisfaction ratings
   - Popular customization types
   - Revenue analytics

5. **Quality Control**
   - Admin review before customer approval
   - Quality guidelines and checklist
   - Designer rating system
   - Customer feedback system

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size limits
   - Verify file type
   - Check Supabase bucket permissions

2. **Request Not Appearing**
   - Verify product is customizable
   - Check user authentication
   - Verify Firestore write permissions

3. **Notifications Not Sent**
   - Check event bus initialization
   - Verify event handler registration
   - Check console logs for errors

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify API responses include error details
- Contact development team for assistance

