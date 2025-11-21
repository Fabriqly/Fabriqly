import { NextRequest, NextResponse } from 'next/server';
import { xenditService } from '../../../../services/XenditService';

export async function GET(request: NextRequest) {
  try {
    // Get available payment methods from Xendit service
    const paymentMethods = xenditService.getAvailablePaymentMethods();

    // Add additional configuration for each payment method
    const enhancedPaymentMethods = paymentMethods.map(method => {
      switch (method.type) {
        case 'card':
          return {
            ...method,
            configuration: {
              supported_cards: ['visa', 'mastercard', 'jcb', 'amex'],
              requires_authentication: true,
              supports_3ds: true,
            },
          };
        
        case 'virtual_account':
          return {
            ...method,
            configuration: {
              supported_banks: [
                { code: 'BCA', name: 'Bank Central Asia' },
                { code: 'BNI', name: 'Bank Negara Indonesia' },
                { code: 'BRI', name: 'Bank Rakyat Indonesia' },
                { code: 'MANDIRI', name: 'Bank Mandiri' },
                { code: 'PERMATA', name: 'Bank Permata' },
                { code: 'CIMB', name: 'CIMB Niaga' },
                { code: 'DANAMON', name: 'Bank Danamon' },
              ],
              expiry_hours: 24,
            },
          };
        
        case 'ewallet':
          return {
            ...method,
            configuration: {
              supported_channels: [
                { code: 'OVO', name: 'OVO' },
                { code: 'DANA', name: 'DANA' },
                { code: 'LINKAJA', name: 'LinkAja' },
                { code: 'SHOPEEPAY', name: 'ShopeePay' },
                { code: 'GOPAY', name: 'GoPay' },
              ],
              supports_redirect: true,
            },
          };
        
        case 'retail_outlet':
          return {
            ...method,
            configuration: {
              supported_outlets: [
                { code: 'ALFAMART', name: 'Alfamart' },
                { code: 'INDOMARET', name: 'Indomaret' },
                { code: '7ELEVEN', name: '7-Eleven' },
              ],
              expiry_hours: 24,
            },
          };
        
        case 'qr_code':
          return {
            ...method,
            configuration: {
              supported_types: ['QRIS'],
              expiry_minutes: 30,
            },
          };
        
        default:
          return method;
      }
    });

    return NextResponse.json({
      success: true,
      paymentMethods: enhancedPaymentMethods,
    });

  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment methods',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
