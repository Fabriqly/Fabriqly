# Xendit Payment Integration Guide

## Overview

This document provides a comprehensive guide for the Xendit payment integration in the Fabriqly application. Xendit is a leading payment gateway in Southeast Asia that supports multiple payment methods including credit cards, virtual accounts, e-wallets, and more.

## Features

- **Multiple Payment Methods**: Credit cards, virtual accounts, e-wallets, retail outlets, and QR codes
- **Invoice Generation**: Create payment invoices for flexible payment options
- **Webhook Support**: Real-time payment status updates
- **Secure Tokenization**: Card tokenization for secure payment processing
- **Multi-currency Support**: Support for IDR, USD, SGD, MYR, THB, PHP

## Architecture

### Components

1. **XenditService** (`src/services/XenditService.ts`)
   - Main service class for Xendit API interactions
   - Handles payment requests, invoices, and webhooks
   - Provides payment method management

2. **XenditPaymentForm** (`src/components/payments/XenditPaymentForm.tsx`)
   - React component for payment form UI
   - Supports all Xendit payment methods
   - Handles payment processing flow

3. **API Endpoints** (`src/app/api/payments/`)
   - `/create-invoice` - Create payment invoices
   - `/create-payment-request` - Process immediate payments
   - `/create-card-token` - Tokenize card information
   - `/webhook` - Handle Xendit webhooks
   - `/methods` - Get available payment methods

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env.local` file:

```env
# Xendit Configuration
XENDIT_SECRET_KEY=xnd_development_your_secret_key_here
XENDIT_PUBLIC_KEY=xnd_public_development_your_public_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_token_here
```

### 2. Xendit Account Setup

1. **Create Xendit Account**
   - Visit [Xendit Dashboard](https://dashboard.xendit.co/)
   - Sign up for a developer account
   - Complete business verification (for production)

2. **Get API Keys**
   - Navigate to Settings > API Keys
   - Copy your Secret Key and Public Key
   - Add them to your environment variables

3. **Configure Webhooks**
   - Go to Settings > Webhooks
   - Add webhook URL: `https://yourdomain.com/api/payments/webhook`
   - Set webhook token and add to environment variables

### 3. Payment Methods Configuration

#### Supported Payment Methods

| Method | Type | Description | Currencies |
|--------|------|-------------|------------|
| Credit Card | `card` | Visa, Mastercard, JCB, Amex | IDR, USD, SGD, MYR, THB, PHP |
| Virtual Account | `virtual_account` | Bank transfer via virtual account | IDR |
| E-Wallet | `ewallet` | OVO, DANA, LinkAja, ShopeePay, GoPay | IDR |
| Retail Outlet | `retail_outlet` | Alfamart, Indomaret, 7-Eleven | IDR |
| QR Code | `qr_code` | QRIS payments | IDR |

#### Bank Codes for Virtual Accounts

- `BCA` - Bank Central Asia
- `BNI` - Bank Negara Indonesia
- `BRI` - Bank Rakyat Indonesia
- `MANDIRI` - Bank Mandiri
- `PERMATA` - Bank Permata
- `CIMB` - CIMB Niaga
- `DANAMON` - Bank Danamon

#### E-Wallet Channel Codes

- `OVO` - OVO
- `DANA` - DANA
- `LINKAJA` - LinkAja
- `SHOPEEPAY` - ShopeePay
- `GOPAY` - GoPay

## Usage Examples

### 1. Creating a Payment Invoice

```typescript
import { xenditService } from '@/services/XenditService';

const invoiceData = {
  external_id: `order_${orderId}_${Date.now()}`,
  amount: 100000, // IDR
  description: 'Payment for Order #123',
  customer: {
    given_names: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    mobile_number: '+6281234567890',
  },
  success_redirect_url: 'https://yourdomain.com/success',
  failure_redirect_url: 'https://yourdomain.com/failed',
};

const invoice = await xenditService.createInvoice(invoiceData);
```

### 2. Processing Card Payment

```typescript
// First, create a card token
const cardToken = await xenditService.createCardToken({
  account_number: '4111111111111111',
  expiry_month: '12',
  expiry_year: '2025',
  cvn: '123',
});

// Then create payment request
const paymentData = {
  amount: 100000,
  currency: 'IDR',
  payment_method: {
    type: 'card',
    card: {
      token_id: cardToken.id,
    },
  },
  reference_id: `order_${orderId}`,
  description: 'Payment for Order #123',
};

const payment = await xenditService.createPaymentRequest(paymentData);
```

### 3. Virtual Account Payment

```typescript
const paymentData = {
  amount: 100000,
  currency: 'IDR',
  payment_method: {
    type: 'virtual_account',
    virtual_account: {
      bank_code: 'BCA',
    },
  },
  reference_id: `order_${orderId}`,
  description: 'Payment for Order #123',
};

const payment = await xenditService.createPaymentRequest(paymentData);
```

## Webhook Handling

### Webhook Events

The system handles the following Xendit webhook events:

- `invoice.paid` - Invoice payment completed
- `invoice.expired` - Invoice payment expired
- `payment_request.succeeded` - Payment request successful
- `payment_request.failed` - Payment request failed

### Webhook Processing

```typescript
// Webhook handler automatically:
// 1. Verifies webhook signature
// 2. Updates order payment status
// 3. Logs payment activities
// 4. Sends notifications (if configured)
```

## Testing

### 1. Run Integration Test

```bash
node scripts/test-xendit-integration.js
```

### 2. Test Payment Methods

#### Credit Card Testing
- Use test card: `4111111111111111`
- Expiry: Any future date
- CVN: Any 3-digit number

#### Virtual Account Testing
- Use any supported bank code
- Payment will be simulated in sandbox

### 3. Webhook Testing

Use Xendit's webhook testing tools or ngrok for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use ngrok URL for webhook configuration
```

## Security Considerations

### 1. Environment Variables
- Never commit API keys to version control
- Use different keys for development and production
- Rotate keys regularly

### 2. Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Implement rate limiting

### 3. Card Data
- Never store card details directly
- Use Xendit's tokenization service
- Implement PCI DSS compliance

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `INVALID_API_KEY` | Invalid API key | Check environment variables |
| `INSUFFICIENT_BALANCE` | Insufficient account balance | Add funds to Xendit account |
| `INVALID_PAYMENT_METHOD` | Unsupported payment method | Check payment method configuration |
| `WEBHOOK_VERIFICATION_FAILED` | Invalid webhook signature | Verify webhook token |

### Error Handling Best Practices

```typescript
try {
  const payment = await xenditService.createPaymentRequest(data);
} catch (error) {
  if (error.code === 'INVALID_API_KEY') {
    // Handle API key error
  } else if (error.code === 'INSUFFICIENT_BALANCE') {
    // Handle balance error
  } else {
    // Handle generic error
  }
}
```

## Monitoring and Logging

### 1. Payment Logs
- All payment attempts are logged
- Failed payments are tracked with error details
- Success payments update order status

### 2. Webhook Logs
- Webhook events are logged for debugging
- Failed webhook processing is tracked
- Payment status updates are monitored

### 3. Performance Monitoring
- Payment processing times are tracked
- API response times are monitored
- Error rates are measured

## Production Deployment

### 1. Pre-deployment Checklist
- [ ] Switch to production API keys
- [ ] Configure production webhook URL
- [ ] Test all payment methods
- [ ] Verify webhook handling
- [ ] Set up monitoring

### 2. Production Configuration
- Use production Xendit account
- Enable webhook signature verification
- Configure proper error handling
- Set up payment monitoring

### 3. Go-live Steps
1. Update environment variables
2. Deploy application
3. Test payment flow
4. Monitor webhook events
5. Verify order status updates

## Support and Troubleshooting

### 1. Xendit Support
- Documentation: [Xendit Docs](https://developers.xendit.co/)
- Support: support@xendit.co
- Status Page: [Xendit Status](https://status.xendit.co/)

### 2. Common Issues
- **Webhook not receiving**: Check URL and token configuration
- **Payment failing**: Verify API keys and account balance
- **Card tokenization failing**: Check card details format

### 3. Debugging
- Enable debug logging in development
- Check Xendit dashboard for transaction details
- Monitor application logs for errors

## Changelog

### Version 1.0.0
- Initial Xendit integration
- Support for all major payment methods
- Webhook handling implementation
- Comprehensive error handling
- Security best practices implementation
