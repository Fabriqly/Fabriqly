# Customization System - 403 Forbidden Fix

## Issue
**Error**: `GET /api/customizations/[id] 403 (Forbidden)`

Designers were unable to view pending customization requests before claiming them, resulting in a 403 Forbidden error.

## Root Cause

The authorization logic was too restrictive. It only allowed access if the user was:
1. The request owner (customer)
2. The assigned designer
3. An admin

**Problem**: Designers need to view pending request details BEFORE claiming them, but they weren't the assigned designer yet (because `designerId` is `null` for pending requests).

## Solution

Updated the authorization logic to allow designers to view pending requests.

### File: `src/app/api/customizations/[id]/route.ts`

#### GET Handler - View Request Details

**Before:**
```typescript
// Authorization check
const isOwner = requestData.customerId === session.user.id;
const isAssignedDesigner = requestData.designerId === session.user.id;
const isAdmin = session.user.role === 'admin';

if (!isOwner && !isAssignedDesigner && !isAdmin) {
  return 403; // ❌ Blocks designers from viewing pending requests
}
```

**After:**
```typescript
// Authorization check
const isOwner = requestData.customerId === session.user.id;
const isAssignedDesigner = requestData.designerId === session.user.id;
const isAdmin = session.user.role === 'admin';
const isDesignerViewingPending = 
  (session.user.role === 'designer' || session.user.role === 'business_owner') && 
  requestData.status === 'pending_designer_review';

if (!isOwner && !isAssignedDesigner && !isAdmin && !isDesignerViewingPending) {
  return 403; // ✅ Now allows designers to view pending requests
}
```

#### PATCH Handler - Assign/Update Request

**Before:**
```typescript
// Authorization check
const isOwner = existingRequest.customerId === session.user.id;
const isAssignedDesigner = existingRequest.designerId === session.user.id;
const isAdmin = session.user.role === 'admin';

if (!isOwner && !isAssignedDesigner && !isAdmin) {
  return 403; // ❌ Blocks designers from assigning themselves
}
```

**After:**
```typescript
// Authorization check
const isOwner = existingRequest.customerId === session.user.id;
const isAssignedDesigner = existingRequest.designerId === session.user.id;
const isAdmin = session.user.role === 'admin';
const isDesignerAssigning = 
  (session.user.role === 'designer' || session.user.role === 'business_owner') && 
  body.action === 'assign' &&
  existingRequest.status === 'pending_designer_review';

if (!isOwner && !isAssignedDesigner && !isAdmin && !isDesignerAssigning) {
  return 403; // ✅ Now allows designers to assign themselves to pending requests
}
```

## Authorization Matrix (Updated)

| Action | Customer | Designer (Pending) | Designer (Assigned) | Admin |
|--------|----------|--------------------|---------------------|-------|
| View Pending Request | ❌ | ✅ **NEW** | N/A | ✅ |
| View Own Request | ✅ | N/A | N/A | ✅ |
| View Assigned Request | ❌ | N/A | ✅ | ✅ |
| Claim Pending Request | ❌ | ✅ **NEW** | N/A | ✅ |
| Upload Final Design | ❌ | ❌ | ✅ | ✅ |
| Approve/Reject | ✅ Own | ❌ | ❌ | ✅ |
| Cancel Request | ✅ Own | ❌ | ❌ | ✅ |

## Workflow Impact

### Before Fix ❌
```
Designer clicks "View Details" on pending request
    ↓
GET /api/customizations/[id]
    ↓
Authorization check fails (not assigned yet)
    ↓
403 Forbidden Error
    ↓
Designer can't see request details
    ↓
Can't make informed decision to claim
```

### After Fix ✅
```
Designer clicks "View Details" on pending request
    ↓
GET /api/customizations/[id]
    ↓
Authorization check passes (pending + designer role)
    ↓
200 Success - Full details returned
    ↓
Designer reviews requirements
    ↓
Designer clicks "Claim Request"
    ↓
PATCH /api/customizations/[id] { action: 'assign' }
    ↓
Authorization check passes (pending + assigning)
    ↓
Request assigned successfully
```

## Security Considerations

### What's Protected
✅ Customers can only see their own requests  
✅ Designers can only see:
  - Pending requests (any designer can view to decide if they want to claim)
  - Requests assigned to them
✅ Designers cannot see other designers' active requests  
✅ Designers cannot modify requests they're not assigned to  
✅ Only assigned designers can upload final work  
✅ Only customers can approve/reject their requests  

### What Changed
- Designers can now view ANY pending request (status = 'pending_designer_review')
- This is intentional and necessary for the claiming workflow
- Once claimed, only the assigned designer can view/modify it

## Testing

After this fix:
- ✅ Designers can view pending request details
- ✅ Designers can claim requests
- ✅ Customers still can't see other customers' requests
- ✅ Designers can't see each other's active work
- ✅ All other authorization rules remain intact

## Related Files
- `src/app/api/customizations/[id]/route.ts` - Main authorization logic
- `src/components/customization/DesignerPendingRequests.tsx` - Uses the view details functionality
- `src/app/dashboard/customizations/page.tsx` - Calls the API

## Status
✅ **Fixed** - Designers can now view and claim pending requests without 403 errors

