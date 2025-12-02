# Dispute System Testing Guide

This guide will help you test the dispute filing and resolution system end-to-end.

## Prerequisites

Before testing, ensure you have:

1. **Test Users:**
   - A customer account
   - A designer account
   - A shop/business owner account
   - An admin account

2. **Test Data:**
   - At least one order with status `shipped` or `delivered` (for shipping disputes)
   - At least one customization request with status `in_progress` or `awaiting_customer_approval` (for design disputes)

## Testing Scenarios

### Scenario 1: File a Dispute for an Order (Shipping Phase)

**Steps:**

1. **Create a Test Order:**
   - As a customer, place an order
   - As a shop owner, mark the order as `shipped` or `delivered`
   - Wait a moment for the status to update

2. **File the Dispute:**
   - Log in as the customer
   - Navigate to `/orders/[orderId]` (the order detail page)
   - Click the "File Dispute" button (should appear for shipped/delivered orders)
   - OR navigate to `/disputes` and click "File New Dispute"
   - Select the order from the list
   - Choose a shipping category (e.g., "Item Not Received", "Item Damaged")
   - Fill in the description
   - Upload evidence images (optional, max 5 images)
   - Submit the dispute

3. **Verify:**
   - Dispute appears in `/disputes` page
   - Dispute status is `open` and stage is `negotiation`
   - Escrow is frozen (if payment was made)
   - Shop owner receives notification

4. **Test Negotiation:**
   - Log in as the shop owner
   - Navigate to `/disputes`
   - View the dispute
   - Try to accept, offer partial refund, or let it escalate

### Scenario 2: File a Dispute for a Customization Request (Design Phase)

**Steps:**

1. **Create a Test Customization Request:**
   - As a customer, create a customization request
   - As a designer, accept and set status to `in_progress` or `awaiting_customer_approval`

2. **File the Dispute:**
   - Log in as the customer
   - Navigate to `/customizations/[requestId]`
   - Click the "File Dispute" button (should appear next to status badge)
   - OR navigate to `/disputes` and click "File New Dispute"
   - Select the customization request
   - Choose a design category (e.g., "Designer Not Responding", "Poor Design Quality")
   - Fill in the description
   - Upload evidence (optional)
   - Submit the dispute

3. **Verify:**
   - Dispute appears in customer's disputes list
   - Dispute status is `open` and stage is `negotiation`
   - Designer receives notification
   - Escrow is frozen (if payment was made)

### Scenario 3: Test Eligibility Validation

**Test Cases:**

1. **Within Filing Window (Should Allow):**
   - Order shipped/delivered within last 5 days
   - Customization request assigned within last 5 days
   - No existing active dispute

2. **Outside Filing Window (Should Reject):**
   - Order shipped/delivered more than 5 days ago
   - Customization request assigned more than 5 days ago
   - Should show error: "Dispute filing deadline has passed"

3. **Wrong Status (Should Reject):**
   - Order status is `pending` or `processing` (should only allow `shipped` or `delivered`)
   - Customization status is `completed` or `cancelled` (should only allow `in_progress` or `awaiting_customer_approval`)
   - Should show error: "Disputes can only be filed for..."

4. **Already Has Dispute (Should Reject):**
   - Try to file a second dispute for the same order/customization
   - Should show error: "An active dispute already exists"

### Scenario 4: Test Negotiation Phase

**Steps:**

1. **File a Dispute** (as customer)

2. **As Accused Party (Designer/Shop):**
   - Log in as the accused party
   - Navigate to `/disputes/[disputeId]`
   - View dispute details
   - Options available:
     - **Accept Dispute:** Agrees to full refund
     - **Offer Partial Refund:** Propose a partial refund amount
     - **Do Nothing:** Let it auto-escalate after 48 hours

3. **Test Partial Refund:**
   - Click "Offer Partial Refund"
   - Enter amount (e.g., 50% of total)
   - Submit offer
   - Customer should see the offer
   - Customer can accept or reject

4. **Test Auto-Escalation:**
   - Wait 48 hours (or manually adjust the deadline in database)
   - Dispute should automatically move to `admin_review` stage
   - Both parties should receive notification

### Scenario 5: Test Admin Resolution

**Steps:**

1. **File a Dispute and Let it Escalate:**
   - File a dispute as customer
   - Wait for negotiation deadline or manually escalate

2. **As Admin:**
   - Log in as admin
   - Navigate to `/dashboard/admin/disputes`
   - View disputes pending admin review
   - Click on a dispute to view details

3. **Resolve the Dispute:**
   - Review evidence and conversation history
   - Choose resolution outcome:
     - **Refunded:** Full refund to customer
     - **Released:** Release funds to designer/shop
     - **Partial Refund:** Partial refund amount
     - **Dismissed:** No action, unfreeze escrow
   - Add resolution notes
   - Optionally issue a strike
   - Submit resolution

4. **Verify:**
   - Dispute status changes to `closed`
   - Dispute stage changes to `resolved`
   - Escrow is unfrozen (if applicable)
   - Funds are processed according to resolution
   - Both parties receive notification
   - Strike is issued (if selected)

### Scenario 6: Test Escrow Freeze

**Steps:**

1. **Create Order/Customization with Payment:**
   - Ensure payment has been made
   - Payment details should exist with `escrowStatus: 'held'`

2. **File Dispute:**
   - File a dispute for the order/customization

3. **Verify Escrow Freeze:**
   - Check payment details in database
   - `escrowStatus` should be `'disputed'`
   - `disputeId` should be set
   - Automatic payouts should be blocked

4. **Test Payout Block:**
   - Try to manually trigger a payout (should fail if escrow is disputed)
   - Verify error message

5. **Test Escrow Unfreeze:**
   - Resolve or cancel the dispute
   - Escrow status should revert to previous state
   - Payouts should be allowed again

### Scenario 7: Test Strike System

**Steps:**

1. **File and Resolve Dispute:**
   - File a dispute
   - Admin resolves it with "Issue Strike" checked

2. **Verify Strike:**
   - Check designer/shop profile
   - `strikes` count should increment
   - Strike should appear in `strikeHistory`
   - Profile should show strike count

3. **Test Suspension:**
   - File 3 disputes and have admin issue strikes for all
   - After 3rd strike, account should be suspended
   - `isSuspended` should be `true`
   - `suspensionReason` should be set
   - User should receive suspension notification

### Scenario 8: Test Dispute Cancellation

**Steps:**

1. **File a Dispute** (as customer)

2. **Cancel the Dispute:**
   - Navigate to dispute detail page
   - Click "Cancel Dispute"
   - Confirm cancellation

3. **Verify:**
   - Dispute status changes to `closed`
   - Escrow is unfrozen
   - Funds are released normally
   - Both parties receive notification

## API Testing

You can also test the API endpoints directly:

### 1. Check Eligibility
```bash
POST /api/disputes/check-eligibility
Body: {
  "orderId": "ORDER_ID" // or "customizationRequestId": "REQUEST_ID"
}
```

### 2. File Dispute
```bash
POST /api/disputes
Body: {
  "orderId": "ORDER_ID", // or "customizationRequestId": "REQUEST_ID"
  "category": "shipping_not_received",
  "description": "Item was not delivered",
  "evidenceImages": ["url1", "url2"]
}
```

### 3. Get Disputes
```bash
GET /api/disputes?filedBy=USER_ID
GET /api/disputes?stage=admin_review&status=open
```

### 4. Accept Dispute
```bash
POST /api/disputes/[id]/accept
Body: {
  "action": "accept" // or "offer_partial"
}
```

### 5. Admin Resolution
```bash
POST /api/disputes/[id]/resolve
Body: {
  "outcome": "refunded",
  "reason": "Customer is correct",
  "issueStrike": true
}
```

## Common Issues to Check

1. **404 Errors:**
   - Verify all routes exist
   - Check file paths are correct
   - Restart dev server if needed

2. **500 Errors:**
   - Check Collections.DISPUTES is defined
   - Verify Firestore indexes are created
   - Check API route handlers

3. **Eligibility Issues:**
   - Verify order/customization status
   - Check filing deadline (5 days)
   - Ensure no existing active dispute

4. **Escrow Issues:**
   - Verify payment details exist
   - Check escrow status updates
   - Verify payout blocking works

## Quick Test Checklist

- [ ] Can file dispute for shipped order
- [ ] Can file dispute for in_progress customization
- [ ] Eligibility check works (rejects invalid cases)
- [ ] Dispute appears in disputes list
- [ ] Accused party can see dispute
- [ ] Negotiation phase works (accept/partial offer)
- [ ] Auto-escalation works after 48 hours
- [ ] Admin can view pending disputes
- [ ] Admin can resolve disputes
- [ ] Escrow freezes when dispute filed
- [ ] Escrow unfreezes when dispute resolved
- [ ] Strikes are issued correctly
- [ ] Account suspension works at 3 strikes
- [ ] Notifications are sent
- [ ] Dispute can be cancelled

## Database Verification

Check Firestore collections:

1. **disputes** collection:
   - Verify dispute documents are created
   - Check all required fields are present
   - Verify timestamps and deadlines

2. **customizationRequests** collection:
   - Check `paymentDetails.escrowStatus` is `'disputed'`
   - Verify `paymentDetails.disputeId` is set

3. **designerProfiles** / **shopProfiles**:
   - Check `strikes` count
   - Verify `strikeHistory` entries
   - Check `isSuspended` flag

## Tips

1. **Use Browser DevTools:**
   - Check Network tab for API calls
   - Check Console for errors
   - Verify request/response payloads

2. **Use Firestore Console:**
   - Monitor documents in real-time
   - Verify field updates
   - Check timestamps

3. **Test Edge Cases:**
   - Multiple disputes for same user
   - Disputes at deadline boundaries
   - Disputes with no payment details
   - Concurrent dispute operations






