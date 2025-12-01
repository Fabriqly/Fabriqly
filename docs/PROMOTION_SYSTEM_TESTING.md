# Promotion System Testing Guide

This guide covers how to test the Promotion System including discounts and coupon codes.

## Prerequisites

1. Ensure the application is running
2. Have at least one admin or shop owner account
3. Have at least one customer account
4. Have products in the system for testing

## Test Scenarios

### 1. Create a Discount (Admin/Shop Owner)

**Steps:**
1. Log in as an admin or shop owner
2. Navigate to `/dashboard/promotions`
3. Click "Create Discount"
4. Fill in the form:
   - Name: "Summer Sale 2024"
   - Description: "20% off all orders"
   - Type: Percentage
   - Value: 20
   - Scope: Order Level
   - Start Date: Today
   - End Date: 30 days from today
   - Minimum Order Amount: 50 (optional)
   - Usage Limit: 100 (optional)
5. Click "Create"

**Expected Result:**
- Discount appears in the discounts list
- Status shows as "active"
- Can be edited or deleted

### 2. Create a Fixed Amount Discount

**Steps:**
1. Follow steps 1-3 from above
2. Fill in the form:
   - Name: "$10 Off Orders"
   - Type: Fixed Amount
   - Value: 10
   - Scope: Order Level
   - Minimum Order Amount: 50
3. Click "Create"

**Expected Result:**
- Discount created successfully
- Shows "$10 OFF" in the list

### 3. Create Product-Level Discount

**Steps:**
1. Create a discount with:
   - Scope: Product Level
   - Target IDs: [product-id-1, product-id-2] (comma-separated)
2. Save the discount

**Expected Result:**
- Discount only applies to specified products

### 4. Generate Coupon Code

**Steps:**
1. Go to `/dashboard/promotions`
2. Find a discount in the list
3. Click "Coupons" button
4. In the coupon generator:
   - Check "Auto-generate" or manually enter a code
   - Set optional fields (name, description, usage limits)
   - Click "Create Coupon"

**Expected Result:**
- Coupon code is created
- Code is linked to the discount
- Can be used at checkout

### 5. Test Coupon Validation (API)

**Using cURL or Postman:**

```bash
POST http://localhost:3000/api/coupons/validate
Content-Type: application/json
Authorization: Bearer <session-token>

{
  "code": "PROMO-ABC12345",
  "userId": "user-id",
  "orderAmount": 100,
  "productIds": ["product-id-1"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "discount": { ... },
    "coupon": { ... },
    "discountAmount": 20
  }
}
```

### 6. Test Coupon Application at Checkout

**Steps:**
1. Log in as a customer
2. Add items to cart
3. Go to checkout page
4. In the "Have a coupon code?" section:
   - Enter a valid coupon code
   - Click "Apply"
5. Verify:
   - Coupon is applied
   - Discount amount is shown
   - Order total is reduced
   - Tax is calculated on discounted amount

**Expected Result:**
- Coupon code is validated
- Discount is applied to order
- Total reflects the discount
- Success message shows savings amount

### 7. Test Invalid Coupon Codes

**Test Cases:**

a) **Expired Coupon:**
- Create a coupon with end date in the past
- Try to apply it
- Should show "Coupon code has expired"

b) **Invalid Code:**
- Enter a non-existent code
- Should show "Coupon code not found"

c) **Usage Limit Reached:**
- Create a coupon with usage limit of 1
- Apply it once
- Try to apply again
- Should show "Coupon code has reached its usage limit"

d) **Minimum Order Amount:**
- Create a discount with minimum order of $100
- Try to apply coupon with $50 cart
- Should show "Minimum order amount of 100 required"

### 8. Test Discount Calculation

**Test Scenarios:**

a) **Percentage Discount:**
- Cart total: $100
- Discount: 20%
- Expected discount: $20
- Final total: $80 + tax + shipping

b) **Fixed Amount Discount:**
- Cart total: $100
- Discount: $10
- Expected discount: $10
- Final total: $90 + tax + shipping

c) **Maximum Discount Cap:**
- Cart total: $1000
- Discount: 20% with max cap of $50
- Expected discount: $50 (not $200)
- Final total: $950 + tax + shipping

### 9. Test Order Creation with Coupon

**Steps:**
1. Apply a coupon at checkout
2. Complete the order
3. Check the order details:
   - `appliedCouponCode` should be set
   - `discountAmount` should be calculated
   - `appliedDiscounts` array should contain discount info
   - `totalAmount` should reflect the discount

**Expected Result:**
- Order is created with discount information
- Order total is correct
- Discount is stored in order document

### 10. Test Multiple Discount Scopes

**Test Product-Level Discount:**
1. Create discount for specific product IDs
2. Add those products to cart
3. Apply coupon
4. Verify discount only applies to matching products

**Test Category-Level Discount:**
1. Create discount for specific category IDs
2. Add products from that category
3. Apply coupon
4. Verify discount applies

**Test Order-Level Discount:**
1. Create order-level discount
2. Add any products to cart
3. Apply coupon
4. Verify discount applies to entire order

### 11. Test Edge Cases

a) **Remove Coupon:**
- Apply a coupon
- Click remove (X button)
- Verify discount is removed
- Verify totals recalculate

b) **Empty Cart:**
- Try to apply coupon with empty cart
- Should show "Cart is empty" error

c) **Discount Exceeds Order Amount:**
- Create $100 fixed discount
- Apply to $50 order
- Should only discount $50 (not negative)

d) **Tax Calculation:**
- Apply discount
- Verify tax is calculated on discounted amount
- Not on original subtotal

### 12. Test Dashboard Features

**Discount Management:**
- Edit existing discount
- Delete discount
- View discount details
- Check usage statistics

**Coupon Management:**
- View coupons for a discount
- Generate multiple coupons for same discount
- Check coupon usage counts

## API Testing Examples

### Create Discount

```bash
POST /api/discounts
Content-Type: application/json

{
  "name": "Test Discount",
  "type": "percentage",
  "value": 15,
  "scope": "order",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "minOrderAmount": 50
}
```

### Create Coupon

```bash
POST /api/coupons
Content-Type: application/json

{
  "code": "TEST2024",
  "discountId": "discount-id",
  "usageLimit": 50,
  "perUserLimit": 1
}
```

### Validate Coupon

```bash
POST /api/coupons/validate
Content-Type: application/json

{
  "code": "TEST2024",
  "userId": "user-id",
  "orderAmount": 100
}
```

## Browser Console Testing

Open browser console and test:

```javascript
// Test coupon validation
fetch('/api/coupons/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'YOUR_COUPON_CODE',
    userId: 'YOUR_USER_ID',
    orderAmount: 100
  })
})
.then(r => r.json())
.then(console.log);
```

## Database Verification

Check Firestore collections:

1. **discounts collection:**
   - Verify discount documents are created
   - Check dates, values, and status fields

2. **coupons collection:**
   - Verify coupon documents
   - Check `discountId` linkage
   - Verify `usedCount` increments

3. **orders collection:**
   - Check `appliedCouponCode` field
   - Verify `discountAmount` is set
   - Check `appliedDiscounts` array

4. **carts collection:**
   - Verify `appliedCouponCode` is stored
   - Check `discountAmount` calculation

## Common Issues and Solutions

### Issue: Coupon not applying
- **Check:** Coupon is active and not expired
- **Check:** User meets minimum order amount
- **Check:** Usage limits not exceeded
- **Check:** Discount scope matches cart items

### Issue: Discount amount incorrect
- **Check:** Tax calculation is on discounted amount
- **Check:** Maximum discount cap is applied
- **Check:** Fixed amount doesn't exceed order total

### Issue: Coupon validation fails
- **Check:** Code is uppercase
- **Check:** Discount is active
- **Check:** Dates are valid
- **Check:** User permissions

## Performance Testing

1. **Load Test:**
   - Create 100+ discounts
   - Test discount lookup performance
   - Verify query optimization

2. **Concurrent Usage:**
   - Multiple users applying same coupon
   - Verify usage limit tracking
   - Check for race conditions

## Security Testing

1. **Authorization:**
   - Try to create discount as customer (should fail)
   - Try to access admin endpoints (should fail)
   - Verify shop owners can only see their discounts

2. **Input Validation:**
   - Test with invalid discount values
   - Test with negative amounts
   - Test with very large numbers
   - Test SQL injection attempts (if applicable)

## Checklist

- [ ] Create percentage discount
- [ ] Create fixed amount discount
- [ ] Create product-level discount
- [ ] Create category-level discount
- [ ] Create order-level discount
- [ ] Generate coupon code
- [ ] Apply valid coupon at checkout
- [ ] Remove coupon from checkout
- [ ] Test expired coupon rejection
- [ ] Test usage limit enforcement
- [ ] Test minimum order amount
- [ ] Test maximum discount cap
- [ ] Verify order creation with discount
- [ ] Verify tax calculation on discounted amount
- [ ] Test discount editing
- [ ] Test discount deletion
- [ ] Verify dashboard permissions
- [ ] Test edge cases (empty cart, negative amounts, etc.)

## Next Steps

After testing:
1. Document any bugs found
2. Verify all calculations are correct
3. Test with real payment flow
4. Monitor usage in production
5. Set up analytics for discount performance



