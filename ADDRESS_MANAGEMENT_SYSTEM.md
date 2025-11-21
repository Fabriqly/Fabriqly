# Address Management System

## Overview
Implemented a complete address management system for customers to save and select shipping addresses when creating orders from customization requests.

## Features

### 1. Address List Modal
**Component:** `src/components/customization/AddressListModal.tsx`

Features:
- ✅ Display all saved addresses
- ✅ Visual selection with checkboxes
- ✅ Default address indicator (green badge)
- ✅ "Add New Address" button
- ✅ Empty state for first-time users
- ✅ Loads addresses from user profile

### 2. Shipping Address Form Modal
**Component:** `src/components/customization/ShippingAddressModal.tsx`

Features:
- ✅ Complete address form with validation
- ✅ Required fields: First Name, Last Name, Address 1, City, State, ZIP, Country, Phone
- ✅ Optional: Address Line 2
- ✅ Philippine phone number validation
- ✅ "Save to profile" checkbox
- ✅ Pre-fills user's name from session
- ✅ Beautiful, responsive UI

### 3. API Endpoints
**File:** `src/app/api/users/[userId]/addresses/route.ts`

#### GET /api/users/[userId]/addresses
- Retrieves all saved addresses for a user
- Returns array of addresses with IDs
- Protected: Users can only view their own addresses

#### POST /api/users/[userId]/addresses
- Adds a new address to user profile
- Validates required fields
- Supports setting as default address
- Auto-sets as default if it's the first address
- Protected: Users can only add to their own profile

### 4. Type Definitions
**File:** `src/types/firebase.ts`

```typescript
export interface User extends BaseDocument {
  // ... other fields
  shippingAddresses?: SavedAddress[];
}

export interface SavedAddress extends Address {
  id: string;
  isDefault?: boolean;
  createdAt?: any;
  updatedAt?: any;
}
```

## User Flow

### Creating an Order (New Flow)

1. **Customer clicks "Create Order & Proceed to Production"**

2. **Address List Modal appears**
   - If user has saved addresses → Shows list
   - If no saved addresses → Shows "Add New Address" CTA

3. **Two options:**
   
   **Option A: Select Existing Address**
   - Click on an address card to select it
   - Click "Deliver to This Address"
   - Order is created immediately ✅

   **Option B: Add New Address**
   - Click "+ Add New Address"
   - Fill out address form
   - Check "Save to profile" (enabled by default)
   - Click "Proceed with Order"
   - Address is saved to profile (if checked)
   - Order is created ✅

4. **Order Created Successfully!**
   - Returns to customizations page
   - Order status updated
   - Production can begin

## Benefits

✅ **Better UX**
- No more typing address every time
- Quick reordering with saved addresses
- Professional e-commerce experience

✅ **Address Management**
- Save multiple addresses (home, work, etc.)
- Set default address
- Addresses persist across orders

✅ **Flexibility**
- Can use existing address
- Can add new address on-the-fly
- Optional saving (for one-time addresses)

✅ **Validation**
- All addresses validated before saving
- Required fields enforced
- Phone number format validation

## Integration with Escrow System

The address management works seamlessly with the escrow system:

1. Customer pays design fee
2. Design approved → Designer paid
3. **Customer selects/adds shipping address** ← NEW STEP
4. Order created
5. Production begins
6. Order shipped → Shop paid

## Future Enhancements

Possible improvements:
- [ ] Edit existing addresses
- [ ] Delete addresses
- [ ] Address validation API (verify real addresses)
- [ ] Multiple default addresses per country
- [ ] Address autocomplete
- [ ] Delivery time estimates per address
- [ ] Map integration for address selection

## Testing

To test the system:

1. **Test with no saved addresses:**
   - Create order
   - Should show empty state
   - Click "Add New Address"
   - Fill form and save
   - Order should be created

2. **Test with existing addresses:**
   - Create another order
   - Should show saved addresses
   - Select one
   - Order should be created immediately

3. **Test adding new address:**
   - From address list modal
   - Click "+ Add New Address"
   - Fill form
   - Check/uncheck "Save to profile"
   - Order should be created

## Database Structure

User document in Firestore:

```json
{
  "id": "user123",
  "email": "customer@example.com",
  "displayName": "John Doe",
  "role": "customer",
  "shippingAddresses": [
    {
      "id": "addr_1234567890",
      "firstName": "John",
      "lastName": "Doe",
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "Manila",
      "state": "Metro Manila",
      "zipCode": "1000",
      "country": "Philippines",
      "phone": "09123456789",
      "isDefault": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

**Status:** ✅ Complete and Ready for Testing
**Date:** November 20, 2025


