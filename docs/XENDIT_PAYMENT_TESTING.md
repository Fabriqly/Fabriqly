# 🧪 Xendit Payment Testing Guide

This guide shows you how to test Xendit payments and see transactions reflected in your dashboard.

## 📋 Prerequisites

- ✅ Xendit account created
- ✅ API keys configured in `.env.local`
- ✅ Invoice creation working (you've already done this!)

## 🎯 Complete Test Flow

### Step 1: Create an Invoice

1. Go to your checkout page: `http://localhost:3001/checkout`
2. Add items to cart
3. Fill in shipping/billing address
4. Click "Continue to Payment"
5. Click "Create Invoice" button
6. **Copy the invoice URL or ID** from the terminal logs

### Step 2: Simulate a Test Payment

#### **Option A: Using the Invoice URL (EASIEST)** ⭐

1. **Open the invoice URL** that appears after clicking "Create Invoice"
2. You'll see the Xendit payment page with multiple payment options
3. **Select any payment method** (e.g., Virtual Account, E-Wallet)
4. **In TEST MODE**, Xendit will show a **"Pay Now"** or **"Simulate Payment"** button
5. **Click it** - the payment will be instantly marked as successful!
6. You'll be redirected to your success page

#### **Option B: Using Xendit Dashboard**

1. Go to: https://dashboard.xendit.co/
2. Login with your Xendit account
3. Navigate to **Payments** → **Invoices**
4. Find your invoice (search by External ID: `order_xxx_timestamp`)
5. Click on the invoice
6. Look for **"Simulate Payment"** button in test mode
7. Click it to mark the payment as successful

#### **Option C: Using the Test Script**

1. After creating an invoice, check your terminal for the invoice ID
2. Run the test script:
   ```bash
   node scripts/test-xendit-payment.js <invoice_id_or_external_id>
   ```
3. The script will show you:
   - Invoice details
   - Available payment methods
   - Instructions on how to simulate payment

### Step 3: Verify Payment in Dashboard

After simulating the payment:

1. **Go to Xendit Dashboard**: https://dashboard.xendit.co/
2. **Check Transactions**:
   - Navigate to **Payments** → **Invoices**
   - Your invoice should show status: **PAID** ✅
3. **Check Balance**:
   - Navigate to **Balance**
   - You should see the test payment amount
   - In TEST mode, this is virtual money (not real)

### Step 4: Verify in Your Application

1. **Check your terminal logs** - you should see webhook notifications
2. **Check your database** - order status should be updated to "paid"
3. **Go to Orders page** - order should show as paid

## 💰 Understanding Test vs Live Mode

### Test Mode (Current)
- Uses test API keys (starts with `xnd_test_...`)
- All payments are simulated
- No real money is transferred
- Perfect for development and testing
- Transactions appear in dashboard but marked as "TEST"

### Live Mode (Production)
- Uses live API keys (starts with `xnd_live_...`)
- Real payments from real customers
- Real money is transferred
- Requires business verification
- Transactions are real

## 🧪 Test Payment Methods

In **TEST MODE**, you can test all payment methods:

### 1. Virtual Account (Bank Transfer)
- Select a bank (BPI, BDO, UnionBank, etc.)
- Xendit generates a virtual account number
- Click "Simulate Payment" to mark as paid
- **Real mode**: Customer transfers to this account number

### 2. E-Wallets
- GCash, PayMaya, GrabPay
- Click to authorize payment
- In test mode, payment is instant
- **Real mode**: Customer authorizes via their app

### 3. Over-the-Counter
- 7-Eleven, Cebuana, M Lhuillier
- Xendit generates a payment code
- Click "Simulate Payment"
- **Real mode**: Customer pays at the store

### 4. Direct Debit
- Connect bank account
- Authorize payment
- Test mode simulates instant success

### 5. Cards (Currently Blocked)
- Your account has card payments blocked
- Enable in Settings → Payment Methods
- Test with Xendit test cards:
  - **Success**: 4000000000000002
  - **Failure**: 4000000000000010

## 📊 Tracking Payments

### In Xendit Dashboard

1. **Invoices Tab**:
   - See all created invoices
   - Status: PENDING, PAID, EXPIRED
   - Filter by date, status, amount

2. **Transactions Tab**:
   - All completed payments
   - Transaction details
   - Customer information

3. **Balance Tab**:
   - Current balance
   - Withdrawal options (live mode only)
   - Transaction history

### In Your Application

Check these endpoints in your app:
- `/orders` - See all orders with payment status
- `/api/payments/webhook` - Receives Xendit notifications

## 🔔 Setting Up Webhooks (Important!)

Webhooks notify your app when payments succeed/fail:

1. **Go to Xendit Dashboard** → **Settings** → **Webhooks**
2. **Add webhook URL**:
   ```
   https://yourdomain.com/api/payments/webhook
   ```
3. **For local testing**, use ngrok:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose your local server
   ngrok http 3001
   
   # Use the ngrok URL in Xendit webhook settings
   https://abc123.ngrok.io/api/payments/webhook
   ```

4. **Webhook Events to Enable**:
   - `invoice.paid` - Invoice paid successfully
   - `invoice.expired` - Invoice expired
   - `invoice.failed` - Payment failed

## 🧪 Quick Testing Checklist

- [ ] Create invoice via checkout
- [ ] Invoice appears in Xendit dashboard
- [ ] Open invoice URL
- [ ] Select payment method
- [ ] Simulate payment (test mode)
- [ ] Verify payment status in dashboard
- [ ] Check order status in your app
- [ ] Verify webhook received (check terminal logs)
- [ ] Confirm balance updated in dashboard

## 🚀 Going Live

When ready for production:

1. **Complete Xendit Business Verification**
2. **Enable IDR currency** in settings
3. **Switch to Live API Keys** in `.env.local`
4. **Update webhook URLs** to production domain
5. **Enable desired payment methods**
6. **Test with small real transaction**
7. **Monitor first few transactions carefully**

## 📝 Common Test Scenarios

### Scenario 1: Successful Payment
```
1. Create invoice → Status: PENDING
2. Customer pays → Status: PAID
3. Webhook received → Order updated
4. Customer redirected to success page
```

### Scenario 2: Expired Invoice
```
1. Create invoice → Status: PENDING
2. Wait 24 hours (or set shorter duration)
3. Invoice expires → Status: EXPIRED
4. Customer cannot pay anymore
```

### Scenario 3: Failed Payment
```
1. Create invoice → Status: PENDING
2. Payment fails (insufficient funds, etc.)
3. Webhook received → Order stays pending
4. Customer can retry payment
```

## 🔍 Debugging Payment Issues

### Invoice Not Created
- Check terminal logs for errors
- Verify API keys in `.env.local`
- Check currency is supported (PHP for now)
- Ensure order exists in database

### Payment Not Reflecting
- Check Xendit dashboard for invoice status
- Verify webhook URL is accessible
- Check terminal logs for webhook notifications
- Ensure webhook secret is correct

### Wrong Amount
- Check order total calculation
- Verify currency conversion if applicable
- Check for tax and shipping inclusion

## 🆘 Support Resources

- **Xendit Documentation**: https://docs.xendit.co/
- **API Reference**: https://developers.xendit.co/api-reference/
- **Dashboard**: https://dashboard.xendit.co/
- **Support**: support@xendit.co
- **Test Cards**: https://docs.xendit.co/credit-cards-overview/sample-cards

## 💡 Tips

1. **Always test in TEST mode first** before going live
2. **Use descriptive external IDs** for easy tracking
3. **Set up webhooks** to automate order updates
4. **Monitor dashboard regularly** during testing
5. **Keep test and live API keys separate**
6. **Document your test results**
7. **Test all payment methods** you plan to offer

---

**Next Steps**: Try creating an invoice and simulating a payment using Option A above! 🚀

