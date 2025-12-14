# Customization System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMIZATION SYSTEM                         │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   CUSTOMER    │         │   DESIGNER    │         │     ADMIN     │
│   Interface   │         │   Interface   │         │   Interface   │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   React Components Layer   │
                    │  - Request Forms           │
                    │  - Request Lists           │
                    │  - Review Modals           │
                    │  - Work Modals             │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     API Routes Layer       │
                    │  /api/customizations/*     │
                    │  - CRUD operations         │
                    │  - File uploads            │
                    │  - Status management       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Service Layer            │
                    │  CustomizationService      │
                    │  - Business Logic          │
                    │  - Validation              │
                    │  - Event Emission          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Repository Layer         │
                    │  CustomizationRepository   │
                    │  - Data Access             │
                    │  - Queries                 │
                    │  - Aggregation             │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Database Layer           │
                    │  - Firestore Collection    │
                    │  - Supabase Storage        │
                    └────────────────────────────┘
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐      ┌─────────────────────┐           │
│  │  Customer Components │      │ Designer Components │           │
│  ├─────────────────────┤      ├─────────────────────┤           │
│  │ - RequestForm       │      │ - PendingRequests   │           │
│  │ - RequestList       │      │ - WorkModal         │           │
│  │ - ReviewModal       │      │ - ActiveList        │           │
│  │ - CustomizeButton   │      │ - Statistics        │           │
│  └─────────────────────┘      └─────────────────────┘           │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │             Dashboard Pages                       │           │
│  │  - /dashboard/customizations                      │           │
│  │  - /products/[id]/customize                       │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │              API Routes                           │           │
│  │  /api/customizations/                            │           │
│  │    ├── route.ts (GET, POST)                      │           │
│  │    ├── [id]/route.ts (GET, PATCH, DELETE)       │           │
│  │    ├── pending/route.ts                          │           │
│  │    ├── stats/route.ts                            │           │
│  │    ├── upload/route.ts                           │           │
│  │    └── workload/route.ts                         │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │         CustomizationService                      │           │
│  │  - createRequest()                                │           │
│  │  - assignDesigner()                               │           │
│  │  - uploadFinalDesign()                            │           │
│  │  - approveDesign()                                │           │
│  │  - rejectDesign()                                 │           │
│  │  - getStatistics()                                │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │      CustomizationRepository                      │           │
│  │  - findByCustomerId()                             │           │
│  │  - findByDesignerId()                             │           │
│  │  - findPendingRequests()                          │           │
│  │  - updateStatus()                                 │           │
│  │  - getStatistics()                                │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Request Creation Flow

```
Customer
   │
   ├──> Fill Form
   │
   ├──> Upload Files ──> Supabase Storage
   │                          │
   │                          ├──> customer_design/
   │                          └──> preview/
   │
   └──> Submit Request
            │
            ▼
      API: POST /api/customizations
            │
            ▼
      CustomizationService.createRequest()
            │
            ├──> Validate Product
            ├──> Validate User
            │
            ▼
      CustomizationRepository.create()
            │
            ▼
      Firestore: customizationRequests
            │
            ▼
      Event: customization.request.created
            │
            ▼
      Notification to Designers
```

### 2. Designer Assignment Flow

```
Designer
   │
   ├──> View Pending Requests
   │         │
   │         ▼
   │    GET /api/customizations/pending
   │         │
   │         ▼
   │    Display List
   │
   └──> Click "Claim Request"
            │
            ▼
      PATCH /api/customizations/[id]
      { action: 'assign' }
            │
            ▼
      CustomizationService.assignDesigner()
            │
            ├──> Check availability
            ├──> Update status
            ├──> Set assignedAt
            │
            ▼
      Event: customization.designer.assigned
            │
            ▼
      Notification to Customer
```

### 3. Work Submission Flow

```
Designer
   │
   ├──> Download Customer Files
   │
   ├──> Create Design
   │
   ├──> Upload Final Files ──> Supabase Storage
   │                                │
   │                                ├──> designer_final/
   │                                └──> preview/
   │
   └──> Submit Work
            │
            ▼
      POST /api/customizations/upload (2x)
            │
            ▼
      PATCH /api/customizations/[id]
      { action: 'uploadFinal', files, notes }
            │
            ▼
      CustomizationService.uploadFinalDesign()
            │
            ├──> Validate designer
            ├──> Update status
            ├──> Set completedAt
            │
            ▼
      Event: customization.design.completed
            │
            ▼
      Notification to Customer
```

### 4. Approval Flow

```
Customer
   │
   ├──> Review Design
   │       │
   │       ├──> Download files
   │       └──> View preview
   │
   └──> Decision
            │
            ├──> Approve
            │       │
            │       ▼
            │   PATCH /api/customizations/[id]
            │   { action: 'approve' }
            │       │
            │       ▼
            │   Event: customization.design.approved
            │       │
            │       └──> Create Order (future)
            │
            └──> Reject
                    │
                    ▼
                PATCH /api/customizations/[id]
                { action: 'reject', reason }
                    │
                    ▼
                Event: customization.design.rejected
                    │
                    └──> Back to Designer
```

## File Storage Architecture

```
Supabase Storage (Bucket: 'designs')
│
└── customizations/
    │
    ├── {userId_1}/
    │   ├── customer_design/
    │   │   └── {timestamp}_{original_filename}
    │   │
    │   ├── designer_final/
    │   │   └── {timestamp}_{original_filename}
    │   │
    │   └── preview/
    │       └── {timestamp}_{original_filename}
    │
    ├── {userId_2}/
    │   └── ...
    │
    └── ...

File Metadata stored in Firestore:
{
  url: string,
  path: string,
  fileName: string,
  fileSize: number,
  contentType: string,
  uploadedAt: Timestamp
}
```

## Database Schema

```
Collection: customizationRequests
Document ID: Auto-generated

Document Structure:
{
  // Identity
  id: string,
  
  // Customer Info
  customerId: string,
  customerName: string,
  customerEmail: string,
  
  // Product Info
  productId: string,
  productName: string,
  productImage?: string,
  quantity: number,
  
  // Customer Files
  customerDesignFile?: {
    url, path, fileName, fileSize, contentType, uploadedAt
  },
  customerPreviewImage?: { ... },
  
  // Designer Info
  designerId?: string,
  designerName?: string,
  
  // Designer Files
  designerFinalFile?: { ... },
  designerPreviewImage?: { ... },
  
  // Content
  customizationNotes: string,
  designerNotes?: string,
  rejectionReason?: string,
  
  // Status
  status: CustomizationStatus,
  
  // Timestamps
  requestedAt: Timestamp,
  assignedAt?: Timestamp,
  completedAt?: Timestamp,
  approvedAt?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Integration
  orderId?: string
}

Indexes:
- customerId
- designerId
- productId
- status
- requestedAt
```

## Event System

```
Event Bus Architecture:

┌─────────────────────┐
│   Service Layer     │
│  (Emit Events)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Event Bus       │
│  - Subscribe        │
│  - Emit             │
│  - Handle           │
└──────────┬──────────┘
           │
           ├──────────────────┬──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│  Notification    │  │   Analytics  │  │  Audit Log   │
│    Handler       │  │    Handler   │  │   Handler    │
└──────────────────┘  └──────────────┘  └──────────────┘

Events:
1. customization.request.created
2. customization.designer.assigned
3. customization.design.completed
4. customization.design.approved
5. customization.design.rejected
6. customization.request.cancelled
```

## State Machine

```
Request Status State Machine:

                    ┌──────────────────────────┐
                    │ pending_designer_review  │ (Initial State)
                    └────────────┬─────────────┘
                                 │
                          Designer Claims
                                 │
                                 ▼
                    ┌────────────────────┐
              ┌────▶│    in_progress     │◀────┐
              │     └────────┬───────────┘     │
              │              │                 │
              │    Designer Uploads            │
         Rejection          │             Rejection
              │              ▼                 │
              │     ┌──────────────────────────┐
              └─────│ awaiting_customer_approval│
                    └────────┬────────┬────────┘
                             │        │
                    Customer │        │ Customer
                    Approves │        │ Rejects
                             │        │
                   ┌─────────▼───┐    │
                   │   approved  │    │
                   └─────────────┘    │
                             │        │
                   Order Created      │
                             │        │
                             ▼        │
                   ┌─────────────┐    │
                   │  completed  │    │
                   └─────────────┘    │
                                      │
                             ┌────────┘
                             │
                   Customer/Admin
                    Cancels
                             │
                             ▼
                   ┌─────────────┐
                   │  cancelled  │
                   └─────────────┘

Terminal States: completed, cancelled
```

## Security Architecture

```
┌────────────────────────────────────────────┐
│         Authentication Layer                │
│  - NextAuth Session                         │
│  - JWT Tokens                               │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│         Authorization Layer                 │
│  - Role-based access                        │
│  - Resource ownership                       │
│  - Action permissions                       │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│         Validation Layer                    │
│  - Input validation                         │
│  - File type/size validation                │
│  - Business rules                           │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│         Data Access Layer                   │
│  - Firestore rules                          │
│  - Supabase RLS                             │
│  - Query filters                            │
└────────────────────────────────────────────┘

Access Control Matrix:

Action                    | Customer | Designer | Admin
─────────────────────────|──────────|──────────|──────
Create Request           |    ✓     |    ✗     |   ✓
View Own Requests        |    ✓     |    ✓     |   ✓
View All Requests        |    ✗     |    ✗     |   ✓
Claim Request            |    ✗     |    ✓     |   ✓
Upload Final Design      |    ✗     |    ✓     |   ✓
Approve/Reject Design    |    ✓     |    ✗     |   ✓
Cancel Request           |    ✓     |    ✗     |   ✓
View Pending Requests    |    ✗     |    ✓     |   ✓
View Statistics          |   Own    |   Own    |  All
```

## Performance Considerations

```
Optimization Strategies:

1. Pagination
   - List requests with limit
   - Cursor-based pagination
   - Lazy loading

2. Caching
   - Statistics caching
   - Pending requests cache
   - File URL caching

3. Indexing
   - Firestore composite indexes
   - Status + createdAt
   - CustomerId + status

4. File Upload
   - Client-side compression
   - Progressive upload
   - Chunk upload for large files

5. Real-time Updates
   - WebSocket for status changes
   - Optimistic UI updates
   - Debounced refresh
```

## Error Handling

```
Error Flow:

Component Error
      │
      ▼
Try/Catch Block
      │
      ├──> Display User-Friendly Message
      │
      ├──> Log to Console
      │
      ├──> Send to Error Service (future)
      │
      └──> Emit Error Event

API Error
      │
      ▼
ErrorHandler.handle()
      │
      ├──> Convert to AppError
      │
      ├──> Log Details
      │
      ├──> Return JSON Response
      │         │
      │         └──> { success: false, error: {...} }
      │
      └──> Set HTTP Status Code

Service Error
      │
      ▼
Throw Descriptive Error
      │
      └──> Caught by API Layer
```

## Scalability

```
Horizontal Scaling:

                    Load Balancer
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     API Server 1    API Server 2    API Server 3
          │               │               │
          └───────────────┼───────────────┘
                          │
                   ┌──────┴──────┐
                   │             │
              Firestore    Supabase Storage
              (NoSQL)      (File Storage)

Key Features:
- Stateless API servers
- Shared database
- Shared file storage
- Event-driven architecture
- Microservices-ready
```

## Monitoring & Analytics

```
Metrics to Track:

1. Request Metrics
   - Total requests created
   - Requests by status
   - Average completion time
   - Success rate

2. Designer Metrics
   - Active designers
   - Workload distribution
   - Average response time
   - Completion rate

3. Customer Metrics
   - Satisfaction rate
   - Rejection rate
   - Repeat requests
   - Average review time

4. System Metrics
   - API response times
   - File upload success rate
   - Error rates
   - Notification delivery rate
```

This architecture is designed to be:
- ✅ Scalable
- ✅ Maintainable
- ✅ Secure
- ✅ Performant
- ✅ Extensible
- ✅ Testable

