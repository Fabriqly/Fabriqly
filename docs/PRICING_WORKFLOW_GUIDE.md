# 💰 Pricing Agreement Workflow Guide

## Overview

Before customers can proceed to create an order from an approved customization, the designer MUST set a pricing agreement. This ensures transparency and prevents order creation without agreed-upon pricing.

---

## 🔄 Complete Workflow

### **Step 1: Designer Submits Final Design**
1. Designer uploads final design file and preview
2. Status changes to `awaiting_customer_approval`
3. Customer receives notification

### **Step 2: Designer Sets Pricing** ⭐ **REQUIRED**
1. Designer opens the customization in their dashboard
2. Sees "⚠️ Pricing Required" warning
3. Clicks "Set Pricing" button
4. Fills out pricing form:
   - **Design Fee**: Fee for design work
   - **Product Cost**: Base cost of the product
   - **Printing Cost**: Cost to print/produce the item
   - **Payment Type**:
     - `Upfront`: 100% payment before production
     - `Half Payment`: 50% upfront, 50% on completion
     - `Milestone`: Custom payment schedule

### **Step 3: Customer Reviews & Approves**
1. Customer sees final design and pricing
2. Can approve or reject
3. If approved, status changes to `approved`

### **Step 4: Customer Selects Shop**
1. System filters shops by product type
2. Customer chooses printing shop
3. Shops with matching capabilities shown

### **Step 5: Customer Makes Payment**
1. Based on payment type selected
2. Initiates payment through Xendit
3. Tracks payment status

### **Step 6: Customer Creates Order**
1. After payment requirements met
2. Order is created and sent to shop
3. Production begins

---

## 🎨 Designer Interface

### **Pricing Status Display**

```
┌─────────────────────────────────────┐
│  Work on Customization Request     │
├─────────────────────────────────────┤
│  📋 Request Details                 │
│  📝 Customer Instructions           │
│                                     │
│  ⚠️ Pricing Required               │
│  You must set pricing before       │
│  customer can create an order      │
│  [Set Pricing]                     │
│                                     │
│  💬 Chat with Customer              │
│  📤 Upload Final Design             │
└─────────────────────────────────────┘
```

### **After Pricing Is Set**

```
┌─────────────────────────────────────┐
│  Work on Customization Request     │
├─────────────────────────────────────┤
│  ✅ Pricing Set                    │
│  Total: ₱2,500                     │
│  Customer can now proceed with     │
│  order                             │
└─────────────────────────────────────┘
```

---

## 📋 Pricing Agreement Form

### **Fields**

```typescript
interface PricingAgreement {
  designFee: number;      // Fee for design work
  productCost: number;    // Cost of base product
  printingCost: number;   // Cost to print/produce
  totalCost: number;      // Auto-calculated sum
  paymentType: 'upfront' | 'half_payment' | 'milestone';
  milestones?: Array<{    // For milestone payment type
    description: string;
    amount: number;
  }>;
}
```

### **Example Pricing**

#### **Simple Mug Design**
```
Design Fee:     ₱500
Product Cost:   ₱200  (mug cost)
Printing Cost:  ₱300  (printing & finishing)
─────────────────────
Total:         ₱1,000
Payment Type:   Upfront
```

#### **Complex T-Shirt Design**
```
Design Fee:     ₱1,500
Product Cost:   ₱400  (premium shirt)
Printing Cost:  ₱600  (multi-color print)
─────────────────────
Total:         ₱2,500
Payment Type:   Half Payment (₱1,250 upfront, ₱1,250 on completion)
```

#### **Milestone-Based Project**
```
Design Fee:     ₱3,000
Product Cost:   ₱1,000
Printing Cost:  ₱1,500
─────────────────────
Total:         ₱5,500
Payment Type:   Milestone

Milestones:
1. Initial Payment       ₱2,200 (40%)
2. Mid-Production        ₱1,650 (30%)
3. Final Delivery        ₱1,650 (30%)
```

---

## 🚫 Error Prevention

### **Order Creation Blocked Without Pricing**

**Error Message:**
```
"Pricing agreement is required"
Status Code: 400
```

**When This Occurs:**
- Customer tries to create order
- Pricing agreement not set by designer
- System blocks the request

**Solution:**
1. Designer must open the customization
2. Click "Set Pricing"
3. Fill out and submit pricing form
4. Customer can then proceed

---

## 🎯 API Endpoints

### **POST** `/api/customizations/[id]/pricing`

Create pricing agreement for a customization request.

#### **Request**
```json
{
  "designFee": 500,
  "productCost": 200,
  "printingCost": 300,
  "paymentType": "upfront"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "id": "customization_id",
    "pricingAgreement": {
      "designFee": 500,
      "productCost": 200,
      "printingCost": 300,
      "totalCost": 1000,
      "paymentType": "upfront",
      "agreedAt": "2025-11-05T10:00:00Z",
      "agreedByDesigner": true,
      "agreedByCustomer": false
    }
  }
}
```

#### **Authorization**
- Must be the assigned designer
- Request status must be `awaiting_customer_approval` or later

---

## 💳 Payment Flow Integration

### **Payment Types**

#### **1. Upfront (100%)**
```typescript
{
  paymentType: 'upfront',
  // Customer must pay full amount before order creation
  requiredPayment: totalCost
}
```

#### **2. Half Payment (50/50)**
```typescript
{
  paymentType: 'half_payment',
  // Customer pays 50% upfront, 50% on completion
  initialPayment: totalCost * 0.5,
  remainingPayment: totalCost * 0.5
}
```

#### **3. Milestone-Based**
```typescript
{
  paymentType: 'milestone',
  milestones: [
    { description: 'Initial Payment', amount: 2200 },
    { description: 'Mid-Production', amount: 1650 },
    { description: 'Final Delivery', amount: 1650 }
  ]
}
```

---

## 📊 Validation Rules

### **Pricing Agreement**
- ✅ All amounts must be positive numbers
- ✅ Total cost auto-calculated
- ✅ Payment type required
- ✅ For milestone type: at least 1 milestone required
- ✅ Milestone amounts should sum to total cost

### **Order Creation**
- ✅ Pricing agreement must exist
- ✅ Design must be approved
- ✅ Shop must be selected
- ✅ Payment requirements must be met based on payment type

---

## 🧪 Testing

### **Test Scenario 1: Designer Sets Pricing**

1. Login as designer
2. Navigate to `/dashboard/customizations`
3. Open a request in `awaiting_customer_approval` status
4. See "⚠️ Pricing Required" warning
5. Click "Set Pricing" button
6. Fill out form:
   - Design Fee: 500
   - Product Cost: 200
   - Printing Cost: 300
   - Payment Type: Upfront
7. Submit form
8. See "✅ Pricing Set" confirmation

### **Test Scenario 2: Order Creation Without Pricing**

1. Login as customer
2. Navigate to `/my-customizations`
3. Approve a design (without pricing set)
4. Select a shop
5. Try to create order
6. **Expected**: Error "Pricing agreement is required"

### **Test Scenario 3: Order Creation With Pricing**

1. Designer sets pricing (see Scenario 1)
2. Login as customer
3. Navigate to `/my-customizations`
4. See pricing details displayed
5. Select shop
6. Make payment (if required)
7. Create order
8. **Expected**: Order created successfully

---

## 🎓 Customer View

### **With Pricing Set**

```
┌─────────────────────────────────────┐
│  Custom Mug Design                  │
│  Status: Approved ✓                 │
├─────────────────────────────────────┤
│  💰 Pricing Agreement               │
│  Design Fee:      ₱500              │
│  Product Cost:    ₱200              │
│  Printing Cost:   ₱300              │
│  ─────────────────────              │
│  Total:          ₱1,000             │
│  Payment Type:    Upfront           │
│                                     │
│  [Select Printing Shop]             │
└─────────────────────────────────────┘
```

### **Without Pricing (Waiting State)**

```
┌─────────────────────────────────────┐
│  Custom Mug Design                  │
│  Status: Approved ✓                 │
├─────────────────────────────────────┤
│  ⏳ Waiting for designer to set    │
│     pricing details                 │
│                                     │
│  You'll be notified when pricing    │
│  is available                       │
└─────────────────────────────────────┘
```

---

## 🔔 Notifications

### **Events That Trigger Notifications**

1. **Pricing Set by Designer**
   - Notify customer
   - "Pricing has been set for your customization"

2. **Order Creation Attempted Without Pricing**
   - Notify designer (if not set)
   - "Customer is waiting for pricing agreement"

3. **Payment Completed**
   - Notify shop owner
   - "Payment received, ready for production"

---

## 📝 Best Practices

### **For Designers**

✅ **Set pricing immediately after uploading final design**
- Don't make customers wait
- Be transparent about costs

✅ **Break down costs clearly**
- Separate design, product, and printing costs
- Helps customers understand value

✅ **Choose appropriate payment type**
- Upfront for small projects
- Half-payment for medium projects
- Milestones for large/complex projects

✅ **Communicate in chat**
- Explain pricing if needed
- Be open to negotiation within reason

### **For Shop Owners**

✅ **Review pricing agreements**
- Ensure printing cost covers your expenses
- Account for materials and labor

✅ **Confirm production feasibility**
- Check if you can meet the pricing
- Communicate any issues early

---

## 🐛 Troubleshooting

### **Problem: "Pricing agreement is required" error**

**Cause:** Designer hasn't set pricing yet

**Solution:**
1. Designer logs in
2. Opens the customization
3. Clicks "Set Pricing"
4. Fills out and submits form

### **Problem: Can't find "Set Pricing" button**

**Possible Causes:**
1. Not logged in as designer
2. Not the assigned designer
3. Status is not `awaiting_customer_approval`

**Solution:**
- Verify you're the assigned designer
- Check request status
- Submit final design first if not yet submitted

### **Problem: Pricing form validation errors**

**Common Issues:**
- Negative numbers
- Missing required fields
- Milestones don't add up to total

**Solution:**
- Use positive numbers only
- Fill all required fields
- For milestones, ensure amounts sum to total cost

---

## 📚 Related Documentation

- [Design Collaboration Workflow](./DESIGN_COLLABORATION_WORKFLOW.md)
- [Shop Filtering Guide](./SHOP_FILTERING_GUIDE.md)
- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Integration Complete](./INTEGRATION_COMPLETE.md)

---

**Last Updated:** November 5, 2025  
**Version:** 1.0.0












