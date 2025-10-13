import Xendit from 'xendit-node';
import { AppError } from '../errors/AppError';

// Xendit client configuration
const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

// Initialize Xendit services
const { Invoice, PaymentRequest, PaymentMethod } = xenditClient;

console.log('Xendit services initialized:', {
  Invoice: !!Invoice,
  PaymentRequest: !!PaymentRequest,
  PaymentMethod: !!PaymentMethod
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
        currency: data.currency || 'IDR'
      });
      
      console.log('Invoice service available:', !!Invoice);
      
      const invoice = await Invoice.createInvoice({
        data: {
          externalId: data.external_id,
          amount: data.amount,
          description: data.description,
          currency: data.currency || 'PHP', // Default to PHP - enable IDR in Xendit dashboard if needed
          successRedirectUrl: data.success_redirect_url,
          failureRedirectUrl: data.failure_redirect_url,
        }
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
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.XENDIT_WEBHOOK_TOKEN!)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
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
        description: 'Pay using digital wallets like OVO, DANA, GoPay',
        supported_currencies: ['IDR'],
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
}

// Export singleton instance
export const xenditService = new XenditService();
