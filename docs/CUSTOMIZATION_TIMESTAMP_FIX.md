# Timestamp Formatting Fix

## Issue
**Error**: "Invalid time value" when displaying dates in customization components

## Cause
Firestore Timestamps lose their `.toDate()` method when serialized to JSON during API responses. The timestamp comes back as:
```javascript
{ seconds: 1234567890, nanoseconds: 123456789 }
```

Instead of a proper Firestore Timestamp object with methods.

## Solution

### 1. Fixed All Component formatDate Functions
Updated the `formatDate` function in all customization components to handle multiple timestamp formats:

**Files Fixed**:
- ✅ `src/components/customization/CustomizationRequestList.tsx`
- ✅ `src/components/customization/CustomizationReviewModal.tsx`
- ✅ `src/components/customization/DesignerPendingRequests.tsx`
- ✅ `src/components/customization/DesignerWorkModal.tsx`

**New Logic**:
```typescript
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  
  let date: Date;
  
  // Handle Firestore Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle Firestore Timestamp serialized as object with seconds
  else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // Handle ISO string or timestamp number
  else {
    date = new Date(timestamp);
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};
```

### 2. Created Reusable Utility Functions
**File**: `src/utils/formatTimestamp.ts`

Three utility functions to prevent this issue in the future:

#### `formatTimestamp(timestamp, options?)`
Formats any timestamp type with custom options:
```typescript
import { formatTimestamp } from '@/utils';

// Basic usage
formatTimestamp(request.createdAt);
// Output: "Jan 5, 2024, 10:30 AM"

// Custom format
formatTimestamp(request.createdAt, {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});
// Output: "January 5, 2024"
```

#### `formatRelativeTime(timestamp)`
Shows relative time (e.g., "5 minutes ago"):
```typescript
import { formatRelativeTime } from '@/utils';

formatRelativeTime(request.createdAt);
// Output: "2 hours ago"
```

#### `toDate(timestamp)`
Converts any timestamp to a Date object:
```typescript
import { toDate } from '@/utils';

const date = toDate(request.createdAt);
// Output: Date object or null
```

## Usage in Future Components

### Option 1: Use Utility Functions (Recommended)
```typescript
import { formatTimestamp, formatRelativeTime } from '@/utils';

export function MyComponent({ request }) {
  return (
    <div>
      <p>Created: {formatTimestamp(request.createdAt)}</p>
      <p>Updated: {formatRelativeTime(request.updatedAt)}</p>
    </div>
  );
}
```

### Option 2: Copy the Fixed formatDate Function
If you need a custom format, copy the fixed `formatDate` function from any of the updated components.

## Why This Happened

1. **Backend**: Firestore stores dates as Timestamp objects
2. **API**: NextJS serializes responses to JSON
3. **JSON**: Can't store JavaScript methods
4. **Frontend**: Receives `{ seconds, nanoseconds }` instead of Timestamp object

## Prevention

✅ **Always use the utility functions** from `src/utils/formatTimestamp.ts`  
✅ **Handle multiple timestamp formats** when formatting dates  
✅ **Validate dates** before formatting to prevent errors  

## Testing

After this fix, all date displays should work correctly:
- ✅ Request list dates
- ✅ Modal timestamps
- ✅ Relative times ("X hours ago")
- ✅ Full date formats

## Related Files

- `src/utils/formatTimestamp.ts` - Utility functions
- `src/utils/index.ts` - Exports
- All customization components - Fixed implementations

