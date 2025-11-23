# Order Creation Flow - After Design Approval

## 📋 Complete Workflow After Design Approval

### **Step-by-Step Process:**

```
1. Customer approves design
   ↓
2. Status: approved
   ↓
3. Customer selects printing shop
   ↓
4. Customer creates ORDER ⭐ [NEW STEP]
   ↓
5. Business owner confirms production
   ↓
6. Production begins
   ↓
7. Production completes
   ↓
8. Customer receives product
   ↓
9. Transaction completed
```

---

## 🎯 The Order Creation Step

### **When Does It Happen?**
After:
- ✅ Design is approved by customer
- ✅ Printing shop is selected

Before:
- 🏭 Production begins

### **Why Is It Needed?**
- Creates official Order record in the system
- Links customization request to order management
- Triggers order tracking
- Enables business owner to start production
- Creates shipping/billing records

---

## 🖥️ How to Create Order (Customer View)

### **Via UI (Automatic)**

After selecting a printing shop on `/my-customizations`:

1. **Select Shop** → Shop Selection Modal
2. **Confirm Selection** 
3. **Prompted**: "Shop selected! Would you like to proceed to create the order?"
4. **Click Yes**
5. **Provide Shipping Address** (simplified for now - uses default)
6. **Order Created!** ✅

You'll see:
```
✓ Order Created: abc12345...
Waiting for production to begin
```

### **Via API (Manual Testing)**

```bash
# Create order from customization
curl -X POST http://localhost:3000/api/customizations/{REQUEST_ID}/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address1": "123 Main Street",
      "address2": "Apt 4B",
      "city": "Manila",
      "state": "Metro Manila",
      "zipCode": "1000",
      "country": "Philippines",
      "phone": "09123456789"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_abc123...",
    "message": "Order created successfully! Production can now begin."
  }
}
```

---

## 📊 Order Details Created

The order includes:

```typescript
{
  customerId: "customer123",
  businessOwnerId: "shop_owner456",
  items: [
    {
      productId: "product789",
      quantity: 1,
      price: 1800.00, // Total from pricing agreement
      customizations: {
        customizationRequestId: "request_xyz",
        designerFinalFileUrl: "https://...",
        designerName: "John Designer",
        printingShopName: "ABC Print Shop"
      }
    }
  ],
  shippingAddress: { /* customer address */ },
  status: "pending",
  paymentStatus: "paid" | "partially_paid",
  totalAmount: 1800.00
}
```

---

## 🔒 Payment Verification

Before creating the order, the system verifies payment based on type:

### **Upfront Payment**
- ✅ Must be **fully paid**
- ❌ Cannot create order if payment incomplete

### **Half Payment**
- ✅ Must be **at least 50% paid**
- ❌ Cannot create order if less than 50%

### **Milestone Payment**
- ✅ First milestone must be paid
- ❌ Cannot create order if no milestones paid

---

## 🚦 Status Flow

### **Before Order Creation:**
```
CustomizationRequest:
- status: "approved"
- printingShopId: "shop123"
- orderId: null ❌
```

### **After Order Creation:**
```
CustomizationRequest:
- status: "approved" (still approved)
- printingShopId: "shop123"
- orderId: "order_abc123" ✅

Order:
- id: "order_abc123"
- status: "pending"
- customerId: "customer123"
- businessOwnerId: "shop_owner456"
```

### **When Production Starts:**
```
CustomizationRequest:
- status: "in_production"
- orderId: "order_abc123"

Order:
- status: "processing"
```

---

## 🧪 Manual Testing Guide

### **Test Scenario: Complete Order Flow**

#### 1. **Approve Design** (as Customer)
```bash
# Assuming you already have an approved request
curl -X PATCH http://localhost:3000/api/customizations/{REQUEST_ID} \
  -d '{"action": "approve"}'
```

#### 2. **Select Shop** (as Customer)
```bash
curl -X POST http://localhost:3000/api/customizations/{REQUEST_ID}/shop \
  -H "Content-Type: application/json" \
  -d '{"shopId": "SHOP_ID"}'
```

#### 3. **Create Order** (as Customer) ⭐
```bash
curl -X POST http://localhost:3000/api/customizations/{REQUEST_ID}/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "firstName": "Test",
      "lastName": "Customer",
      "address1": "123 Test St",
      "city": "Manila",
      "state": "Metro Manila",
      "zipCode": "1000",
      "country": "Philippines",
      "phone": "09123456789"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "xyz123",
    "message": "Order created successfully! Production can now begin."
  }
}
```

#### 4. **Verify Order Created**
```bash
# Check customization request now has orderId
curl http://localhost:3000/api/customizations/{REQUEST_ID}

# Get the actual order
curl http://localhost:3000/api/orders/{ORDER_ID}
```

#### 5. **Business Owner Confirms Production**
```bash
# Now business owner can start production
curl -X POST http://localhost:3000/api/production/{REQUEST_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "estimatedCompletionDate": "2025-12-15",
    "materials": "Premium vinyl"
  }'
```

---

## 🎨 Customer UI Flow

### **On `/my-customizations` page:**

**Stage 1: After Approval**
```
Status: Approved ✓
[Select Printing Shop] button
```

**Stage 2: Shop Selected**
```
Status: Approved ✓
Shop: ABC Print Shop
[Create Order & Proceed to Production] button
```

**Stage 3: Order Created**
```
Status: Approved ✓
Shop: ABC Print Shop
✓ Order Created: abc12345...
   Waiting for production to begin
```

**Stage 4: Production Started**
```
Status: In Production 🔨
Shop: ABC Print Shop
Order: abc12345...
[Production Tracker Component]
```

---

## ⚠️ Error Handling

### **Cannot Create Order If:**

1. **Design not approved**
   - Error: "Design must be approved before creating order"

2. **No shop selected**
   - Error: "Printing shop must be selected before creating order"

3. **No pricing agreement**
   - Error: "Pricing agreement is required"

4. **Payment incomplete**
   - Upfront: "Full payment required"
   - Half: "At least 50% payment required"
   - Milestone: "First milestone payment required"

5. **Order already exists**
   - Order won't be duplicated (system checks `orderId` field)

---

## 🔗 Related Endpoints

### **Order Management:**
- `POST /api/customizations/{id}/create-order` - Create order
- `GET /api/customizations/{id}/create-order` - Get existing order
- `GET /api/orders/{orderId}` - Get order details
- `PATCH /api/orders/{orderId}/status` - Update order status

### **View Orders:**
- `GET /api/orders?customerId={id}` - Customer's orders
- `GET /api/orders?businessOwnerId={id}` - Shop owner's orders

---

## 📝 Key Points

✅ **Order creation is REQUIRED** before production can begin
✅ **Happens AFTER** shop selection
✅ **Happens BEFORE** production confirmation
✅ **Creates official order record** in system
✅ **Links customization to order management**
✅ **Verifies payment requirements**
✅ **Provides order tracking**

---

## 💡 Tips

### **For Customers:**
- Order is created automatically after selecting shop (with prompt)
- You can also manually trigger it via the button
- Shipping address required (will be improved with address form)

### **For Developers:**
- Order creation is a separate step from production
- Always verify payment before allowing order creation
- Order ID is stored in `customizationRequest.orderId`
- Order contains reference to customization in items

---

## 🚀 Complete Flow Summary

```
1. Design approved ✓
2. Shop selected ✓
3. ORDER CREATED ✓ ← [YOU ARE HERE]
4. Business owner reviews order
5. Production confirmed
6. Production starts
7. Quality check
8. Ready for pickup
9. Customer confirms receipt
10. Transaction complete
11. Reviews submitted
```

**The order creation step ensures everything is ready for production!** 📦✨



















