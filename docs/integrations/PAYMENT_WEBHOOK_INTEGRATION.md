# Xendit Payment Webhook Integration - Complete

## Overview

Xendit payment webhooks are now fully integrated and working. Design fee payments automatically update the paid amount in real-time when customers complete payments.

---

## How It Works

### 1. Payment Flow

```
Customer → Makes Payment → Xendit Processes → Webhook Sent → Database Updated → UI Refreshed
```

1. Customer clicks "Make Payment"
2. Creates Xendit invoice with `external_id: "customization-{requestId}-{timestamp}"`
3. Customer completes payment on Xendit checkout page
4. Xendit sends webhook to `/api/payments/webhook`
5. Webhook handler updates `paidAmount` and `remainingAmount` in Firestore
6. Payment status changes to `partially_paid` or `fully_paid`

### 2. Webhook Endpoint

```
POST /api/payments/webhook
```

**Authentication**: Verified via `x-callback-token` header matching `XENDIT_WEBHOOK_TOKEN`

**Handles**:
- Invoice payments (design fees, customizations)
- Order payments (regular products)
- Multiple payment statuses (PAID, EXPIRED, FAILED)

---

## Configuration

### Environment Variables Required

```env
XENDIT_SECRET_KEY=xnd_development_...
XENDIT_PUBLIC_KEY=xnd_public_development_...
XENDIT_WEBHOOK_TOKEN=your_webhook_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Xendit Dashboard Setup

1. **Go to**: https://dashboard.xendit.co/ → Settings → Webhooks
2. **Set Invoice Paid URL**: `https://your-domain.com/api/payments/webhook`
3. **Set Verification Token**: Must match `XENDIT_WEBHOOK_TOKEN` in `.env.local`
4. **Enable Notifications**:
   - ✅ Notify when invoice has expired
   - ✅ Notify when payment received after expiry

### Local Development (ngrok)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Copy ngrok URL and configure in Xendit:
https://your-ngrok-url.ngrok-free.app/api/payments/webhook
```

**Note**: ngrok free tier changes URL on restart. Update Xendit webhook URL each time.

---

## Implementation Details

### Files Modified

1. **`src/middleware.ts`**
   - Added webhook routes to authentication bypass
   - Allows external webhook calls without login

2. **`src/services/XenditService.ts`**
   - Fixed signature verification (direct token comparison, not HMAC)
   - Proper verification for Xendit Invoice webhooks

3. **`src/app/api/payments/webhook/route.ts`**
   - Handles both invoice and payment request webhooks
   - Routes customization payments to `CustomizationPaymentService`
   - Routes order payments to `OrderRepository`

4. **`src/services/CustomizationPaymentService.ts`**
   - `handlePaymentWebhook()` method processes payment updates
   - Updates `paidAmount`, `remainingAmount`, `paymentStatus`
   - Emits events for other system components

### Webhook Data Flow

```javascript
// 1. Webhook received
POST /api/payments/webhook
Headers: { "x-callback-token": "..." }
Body: { "id": "...", "status": "PAID", "amount": 500, ... }

// 2. Signature verified
xenditService.verifyWebhookSignature(body, token)

// 3. Payment type detected
if (external_id.startsWith('customization-')) {
  // Route to CustomizationPaymentService
}

// 4. Database updated
paymentDetails.paidAmount += 500
paymentDetails.remainingAmount -= 500
paymentDetails.paymentStatus = "fully_paid"

// 5. Event emitted
eventBus.emit('customization.payment.updated', ...)
```

---

## Testing

### Test a Payment

1. Make a customization request
2. Designer sets pricing
3. Customer agrees to pricing
4. Customer clicks "Make Payment"
5. Complete payment with test card:
   - Card: `4000000000000002`
   - CVV: `123`
   - Expiry: Any future date

### Verify Success

**Check server logs:**
```
[Xendit Webhook] Received
[Xendit Webhook] Verified - { id: '...', amount: 500, status: 'PAID' }
[Invoice Paid] Processing customization payment
[CustomizationPayment] Updated successfully
```

**Check ngrok inspector** (http://127.0.0.1:4040):
```
POST /api/payments/webhook    200 OK
```

**Check UI:**
- Paid Amount: ₱500.00 ✅
- Remaining: ₱0.00 ✅
- Payment Status: Fully Paid ✅

---

## Troubleshooting

### Webhook Not Received

**Symptoms**: Payment completes but amount stays at ₱0.00

**Solutions**:
1. Check ngrok is running (`ngrok http 3000`)
2. Verify webhook URL in Xendit Dashboard is correct
3. Check server logs for incoming webhook
4. Check ngrok web interface (http://127.0.0.1:4040)

### Invalid Signature Error

**Symptoms**: Logs show "Invalid signature"

**Solutions**:
1. Verify `XENDIT_WEBHOOK_TOKEN` in `.env.local` matches Xendit Dashboard
2. Restart dev server after changing `.env.local`
3. No quotes or spaces around token value

### 401 Unauthorized

**Symptoms**: Webhook returns 401 in ngrok inspector

**Solutions**:
1. Check middleware allows `/api/payments/webhook`
2. Verify webhook token is correct

### Request Not Found

**Symptoms**: Logs show "Request not found for invoice"

**Solutions**:
1. Check payment was created before webhook arrived
2. Verify invoice ID matches payment record
3. Check Firestore for payment in `payments` array

---

## Logging

Logs use a **moderate verbosity** approach:

**What's Logged**:
- ✅ Webhook received with key details
- ✅ Signature verification results
- ✅ Payment type detection
- ✅ Success/failure outcomes
- ✅ Important IDs and amounts

**What's Not Logged**:
- ❌ Step-by-step progress indicators
- ❌ Excessive emoji decorations
- ❌ Redundant information
- ❌ Full request/response bodies (except on errors)

**Example Log Output**:
```
[Xendit Webhook] Received
[Xendit Webhook] Verified - { id: '691dc...', external_id: 'customization-...', status: 'PAID', amount: 500 }
[Invoice Paid] Processing customization payment
[CustomizationPayment] Processing webhook { invoice_id: '691dc...', status: 'PAID', amount: 500 }
[CustomizationPayment] Found request: CMsrK621jWbUiT71t9J2
[CustomizationPayment] Updated successfully { request_id: 'CMsr...', paid_amount: 500, remaining: 0, status: 'fully_paid' }
```

---

## Production Deployment

### Before Going Live

1. **Update environment variables**:
   ```env
   XENDIT_SECRET_KEY=xnd_production_...
   XENDIT_PUBLIC_KEY=xnd_public_production_...
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Update Xendit webhook URL**:
   ```
   https://yourdomain.com/api/payments/webhook
   ```

3. **Switch to Live Mode** in Xendit Dashboard

4. **Test with real payment** in production

### Security Checklist

- ✅ Webhook token is strong and secret
- ✅ Signature verification is enabled
- ✅ HTTPS is used for webhook URL
- ✅ Environment variables are not committed to git
- ✅ Middleware properly protects routes
- ✅ Logging doesn't expose sensitive data

---

## Related Documentation

- [Xendit Payment Integration Guide](./docs/XENDIT_PAYMENT_INTEGRATION.md)
- [Escrow System Implementation](./docs/ESCROW_SYSTEM_IMPLEMENTATION.md)
- [Design Collaboration Workflow](./docs/DESIGN_COLLABORATION_WORKFLOW.md)

---

**Status**: ✅ **Working**  
**Last Updated**: November 19, 2025  
**Version**: 1.0

