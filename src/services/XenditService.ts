import Xendit from 'xendit-node';
import { AppError } from '../errors/AppError';

// Xendit client configuration
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

// Initialize Xendit services
const { Invoice, PaymentRequest, PaymentMethod, Payout } = xenditClient;
// Payout is the service for disbursements in Xendit SDK v7.0.0
const Disbursement = Payout;

console.log('Xendit services initialized:', {
  Invoice: !!Invoice,
  PaymentRequest: !!PaymentRequest,
  PaymentMethod: !!PaymentMethod,
  Payout: !!Payout,
  Disbursement: !!Disbursement
});

export interface XenditPaymentMethod {
  type: 'card' | 'virtual_account' | 'ewallet' | 'retail_outlet' | 'qr_code';
  card?: {
    token_id: string;
    authentication_id?: string;
  };
  virtual_account?: {
    bank_code: string;
  };
  ewallet?: {
    channel_code: string;
    channel_properties?: {
      success_redirect_url?: string;
      failure_redirect_url?: string;
      cancel_redirect_url?: string;
    };
  };
  retail_outlet?: {
    retail_outlet_name: string;
  };
  qr_code?: {
    qr_code_type: string;
  };
}

export interface CreatePaymentRequestData {
  amount: number;
  currency: string;
  payment_method: XenditPaymentMethod;
  reference_id: string;
  description: string;
  customer?: {
    given_names: string;
    surname: string;
    email: string;
    mobile_number?: string;
    nationality?: string;
    date_of_birth?: string;
    addresses?: Array<{
      country: string;
      street_line1: string;
      street_line2?: string;
      city: string;
      province_state: string;
      postal_code: string;
    }>;
  };
  metadata?: Record<string, any>;
  success_redirect_url?: string;
  failure_redirect_url?: string;
  cancel_redirect_url?: string;
}

export interface CreateInvoiceData {
  external_id: string;
  amount: number;
  description: string;
  invoice_duration?: number;
  customer?: {
    given_names: string;
    surname: string;
    email: string;
    mobile_number?: string;
    addresses?: Array<{
      country: string;
      street_line1: string;
      street_line2?: string;
      city: string;
      province_state: string;
      postal_code: string;
    }>;
  };
  customer_notification_preference?: {
    invoice_created?: string[];
    invoice_reminder?: string[];
    invoice_paid?: string[];
    invoice_expired?: string[];
  };
  success_redirect_url?: string;
  failure_redirect_url?: string;
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
    url?: string;
  }>;
  fees?: Array<{
    type: string;
    value: number;
  }>;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  reference_id: string;
  payment_method: XenditPaymentMethod;
  created: string;
  updated: string;
  metadata?: Record<string, any>;
}

export interface InvoiceResult {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  merchant_profile_picture_url?: string;
  amount: number;
  currency: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  available_banks?: Array<{
    bank_code: string;
    collection_type: string;
    bank_account_number: string;
    transfer_amount: number;
    bank_branch: string;
    account_holder_name: string;
    identity_amount: number;
  }>;
  available_retail_outlets?: Array<{
    retail_outlet_name: string;
  }>;
  available_ewallets?: Array<{
    ewallet_type: string;
  }>;
  available_qr_codes?: Array<{
    qr_code_type: string;
  }>;
  available_direct_debits?: Array<{
    direct_debit_type: string;
  }>;
  available_paylaters?: Array<{
    paylater_type: string;
  }>;
  should_exclude_credit_card: boolean;
  should_send_email: boolean;
  created: string;
  updated: string;
  success_redirect_url?: string;
  failure_redirect_url?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
    url?: string;
  }>;
  fees?: Array<{
    type: string;
    value: number;
  }>;
  metadata?: Record<string, any>;
}

export interface CreateDisbursementData {
  externalId: string;
  amount: number;
  bankCode: string;
  accountHolderName: string;
  accountNumber: string;
  description: string;
  emailTo?: string[];
  emailCc?: string[];
  emailBcc?: string[];
}

export interface DisbursementResult {
  id: string;
  user_id: string;
  external_id: string;
  amount: number;
  bank_code: string;
  account_holder_name: string;
  disbursement_description: string;
  status: string;
  email_to?: string[];
  email_cc?: string[];
  email_bcc?: string[];
  created: string;
  updated: string;
}

export class XenditService {
  /**
   * Create a payment request for immediate payment processing
   */
  async createPaymentRequest(data: CreatePaymentRequestData): Promise<PaymentResult> {
    try {
      console.log('Creating payment request with data:', {
        amount: data.amount,
        currency: data.currency,
        reference_id: data.reference_id,
        description: data.description
      });

      // For now, let's skip payment requests and focus on invoices
      throw new Error('Payment requests not implemented yet. Please use invoice creation.');
    } catch (error: any) {
      console.error('Xendit payment request creation failed:', error);
      throw AppError.badRequest(
        'Payment request creation failed',
        error.message || 'Unknown error occurred'
      );
    }
  }

  /**
   * Create an invoice for payment collection
   */
  async createInvoice(data: CreateInvoiceData): Promise<InvoiceResult> {
    try {
      console.log('Creating invoice with data:', {
        external_id: data.external_id,
        amount: data.amount,
        description: data.description,
        currency: data.currency || 'PHP',
        customer_email: data.customer?.email
      });
      
      console.log('Invoice service available:', !!Invoice);
      
      // Build the invoice data
      const invoiceData: any = {
        externalId: data.external_id,
        amount: data.amount,
        description: data.description,
        currency: data.currency || 'PHP',
        successRedirectUrl: data.success_redirect_url,
        failureRedirectUrl: data.failure_redirect_url,
      };

      // Add customer if provided
      if (data.customer) {
        invoiceData.customer = {
          givenNames: data.customer.given_names || 'Customer',
          email: data.customer.email,
        };
      }

      // Add items if provided
      if (data.items && data.items.length > 0) {
        invoiceData.items = data.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category,
        }));
      }

      console.log('Sending to Xendit:', JSON.stringify(invoiceData, null, 2));
      
      const invoice = await Invoice.createInvoice({
        data: invoiceData
      });
      
      console.log('Invoice created successfully:', invoice.id);

      return {
        id: invoice.id || '',
        external_id: invoice.externalId || '',
        user_id: invoice.userId || '',
        status: invoice.status || '',
        merchant_name: invoice.merchantName || '',
        merchant_profile_picture_url: invoice.merchantProfilePictureUrl || '',
        amount: invoice.amount || 0,
        currency: invoice.currency || 'PHP',
        description: invoice.description || '',
        invoice_url: invoice.invoiceUrl || '',
        expiry_date: invoice.expiryDate?.toISOString() || '',
        available_banks: [],
        available_retail_outlets: [],
        available_ewallets: [],
        available_qr_codes: [],
        available_direct_debits: [],
        available_paylaters: [],
        should_exclude_credit_card: false,
        should_send_email: false,
        created: invoice.created?.toISOString() || '',
        updated: invoice.updated?.toISOString() || '',
        success_redirect_url: invoice.successRedirectUrl || '',
        failure_redirect_url: invoice.failureRedirectUrl || '',
        items: [],
        fees: [],
        metadata: {},
      };
    } catch (error: any) {
      console.error('Xendit invoice creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      throw AppError.badRequest(
        'Invoice creation failed',
        error.message || 'Unknown error occurred'
      );
    }
  }

  /**
   * Get payment request details
   */
  async getPaymentRequest(paymentRequestId: string): Promise<PaymentResult> {
    try {
      // Simplified for now
      throw new Error('Payment request retrieval not implemented yet');
    } catch (error: any) {
      console.error('Xendit payment request retrieval failed:', error);
      throw AppError.badRequest(
        'Payment request retrieval failed',
        error.message || 'Unknown error occurred'
      );
    }
  }

  /**
   * Get invoice details
   */
  async getInvoice(invoiceId: string): Promise<InvoiceResult> {
    try {
      // Simplified for now
      throw new Error('Invoice retrieval not implemented yet');
    } catch (error: any) {
      console.error('Xendit invoice retrieval failed:', error);
      throw AppError.badRequest(
        'Invoice retrieval failed',
        error.message || 'Unknown error occurred'
      );
    }
  }

  /**
   * Create a payment method for card
   */
  async createCardToken(cardData: {
    account_number: string;
    expiry_month: string;
    expiry_year: string;
    cvn: string;
    cardholder_name?: string;
  }): Promise<{ id: string; status: string; authentication_id?: string }> {
    try {
      console.log('Creating payment method with card data:', {
        account_number: cardData.account_number.substring(0, 4) + '****',
        expiry_month: cardData.expiry_month,
        expiry_year: cardData.expiry_year,
        cvn: '***'
      });
      
      console.log('Xendit secret key available:', !!process.env.XENDIT_SECRET_KEY);
      
      // Use the correct Xendit SDK method
      const paymentMethod = await PaymentMethod.createPaymentMethod({
        data: {
          type: 'CARD',
          reusability: 'ONE_TIME_USE',
          card: {
            currency: 'IDR',
            cardInformation: {
              cardNumber: cardData.account_number,
              expiryMonth: cardData.expiry_month,
              expiryYear: cardData.expiry_year,
              cvv: cardData.cvn,
              cardholderName: cardData.cardholder_name || 'Test User',
            }
          }
        }
      });

      console.log('Payment method created successfully:', paymentMethod.id);
      
      return {
        id: paymentMethod.id,
        status: paymentMethod.status || 'ACTIVE',
        authentication_id: paymentMethod.id, // Use payment method ID as auth ID
      };
    } catch (error: any) {
      console.error('Xendit payment method creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      throw AppError.badRequest(
        'Card token creation failed',
        error.message || 'Unknown error occurred'
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // For Xendit Invoice webhooks, the x-callback-token header contains
      // the webhook verification token directly (not an HMAC signature)
      const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
      
      if (!expectedToken) {
        console.error('XENDIT_WEBHOOK_TOKEN not configured');
        return false;
      }
      
      // Direct token comparison
      return signature === expectedToken;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): Array<{
    type: string;
    name: string;
    description: string;
    supported_currencies: string[];
  }> {
    return [
      {
        type: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay with Visa, Mastercard, or other major cards',
        supported_currencies: ['IDR', 'USD', 'SGD', 'MYR', 'THB', 'PHP'],
      },
      {
        type: 'virtual_account',
        name: 'Virtual Account',
        description: 'Pay via bank transfer using virtual account',
        supported_currencies: ['IDR'],
      },
      {
        type: 'ewallet',
        name: 'E-Wallet',
        description: 'Pay using digital wallets like PayMaya or GCash',
        supported_currencies: ['IDR', 'PHP'],
      },
      {
        type: 'retail_outlet',
        name: 'Retail Outlet',
        description: 'Pay at convenience stores like Alfamart, Indomaret',
        supported_currencies: ['IDR'],
      },
      {
        type: 'qr_code',
        name: 'QR Code',
        description: 'Pay by scanning QR code',
        supported_currencies: ['IDR'],
      },
    ];
  }

  /**
   * Create a disbursement (payout) to designer or shop owner
   */
  async createDisbursement(data: CreateDisbursementData): Promise<DisbursementResult> {
    try {
      console.log('Creating disbursement with data:', {
        external_id: data.externalId,
        amount: data.amount,
        bank_code: data.bankCode,
        account_holder_name: data.accountHolderName
      });

      // Check if Payout service is available (Payout = Disbursement in Xendit SDK v7.0.0)
      if (!Payout) {
        console.error('Payout service not found. Available xenditClient properties:', Object.keys(xenditClient));
        throw AppError.badRequest(
          'Payout service is not available in the Xendit SDK. Please check your xendit-node package version (current: 7.0.0).'
        );
      }

      // Use Payout service similar to Invoice service
      // In Xendit SDK v7.0.0, Payout is used like: Payout.createPayout({ data: {...} })
      console.log('Payout service available, creating payout...');

      // Follow the exact same pattern as Invoice.createInvoice
      // Xendit requires idempotencyKey to prevent duplicate payouts
      const idempotencyKey = data.externalId || `payout-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Build payout data following Invoice pattern (camelCase for SDK)
      const payoutData: any = {
        externalId: data.externalId,
        amount: data.amount,
        bankCode: data.bankCode,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        description: data.description,
      };

      // Add optional email fields if provided
      if (data.emailTo && data.emailTo.length > 0) {
        payoutData.emailTo = data.emailTo;
      }
      if (data.emailCc && data.emailCc.length > 0) {
        payoutData.emailCc = data.emailCc;
      }
      if (data.emailBcc && data.emailBcc.length > 0) {
        payoutData.emailBcc = data.emailBcc;
      }

      console.log('Creating payout with:', {
        idempotencyKey,
        payoutDataKeys: Object.keys(payoutData)
      });

      // Follow Invoice pattern exactly: Service.createMethod({ data: {...} })
      // For Payout, idempotencyKey might be passed as a second parameter or in options
      // Try the same structure as Invoice first
      const disbursement = await (Payout as any).createPayout({
        idempotencyKey: idempotencyKey,
        data: payoutData
      });

      console.log('Disbursement created successfully:', disbursement.id);

      return {
        id: disbursement.id || '',
        user_id: disbursement.userId || '',
        external_id: disbursement.externalId || '',
        amount: disbursement.amount || 0,
        bank_code: disbursement.bankCode || '',
        account_holder_name: disbursement.accountHolderName || '',
        disbursement_description: disbursement.description || '',
        status: disbursement.status || '',
        email_to: disbursement.emailTo,
        email_cc: disbursement.emailCc,
        email_bcc: disbursement.emailBcc,
        created: disbursement.created?.toISOString() || '',
        updated: disbursement.updated?.toISOString() || '',
      };
    } catch (error: any) {
      console.error('Xendit disbursement creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      throw AppError.badRequest(
        'Disbursement creation failed',
        error.message || 'Unknown error occurred'
      );
    }
  }

  /**
   * Get disbursement details by ID
   */
  async getDisbursement(disbursementId: string): Promise<DisbursementResult> {
    try {
      // Check if Payout service is available
      if (!Payout) {
        throw AppError.badRequest('Payout service is not available in the Xendit SDK.');
      }

      console.log('Getting payout:', disbursementId);

      // Use standard Xendit SDK pattern (same as Invoice.getInvoiceById)
      const disbursement = await (Payout as any).getPayoutById({
        id: disbursementId
      });

      return {
        id: disbursement.id || '',
        user_id: disbursement.userId || '',
        external_id: disbursement.externalId || '',
        amount: disbursement.amount || 0,
        bank_code: disbursement.bankCode || '',
        account_holder_name: disbursement.accountHolderName || '',
        disbursement_description: disbursement.description || '',
        status: disbursement.status || '',
        email_to: disbursement.emailTo,
        email_cc: disbursement.emailCc,
        email_bcc: disbursement.emailBcc,
        created: disbursement.created?.toISOString() || '',
        updated: disbursement.updated?.toISOString() || '',
      };
    } catch (error: any) {
      console.error('Xendit disbursement retrieval failed:', error);
      throw AppError.badRequest(
        'Disbursement retrieval failed',
        error.message || 'Unknown error occurred'
      );
    }
  }
}

// Export singleton instance
export const xenditService = new XenditService();
