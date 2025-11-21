import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { xenditService } from '../../../../services/XenditService';

export async function POST(request: NextRequest) {
  try {
    console.log('Card token creation request received');
    
    // Check if Xendit keys are available
    if (!process.env.XENDIT_SECRET_KEY) {
      console.error('XENDIT_SECRET_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Xendit configuration missing' },
        { status: 500 }
      );
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('No session found, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Session found for user:', session.user?.email);

    const body = await request.json();
    const { 
      account_number, 
      expiry_month, 
      expiry_year, 
      cvn, 
      cardholder_name = 'Test User'
    } = body;

    // Validate required fields
    if (!account_number || !expiry_month || !expiry_year || !cvn) {
      return NextResponse.json(
        { error: 'All card details are required' },
        { status: 400 }
      );
    }

    // Validate card number format (basic validation)
    const cardNumberRegex = /^\d{13,19}$/;
    if (!cardNumberRegex.test(account_number.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid card number format' },
        { status: 400 }
      );
    }

    // Validate expiry month
    const month = parseInt(expiry_month);
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid expiry month' },
        { status: 400 }
      );
    }

    // Validate expiry year
    const year = parseInt(expiry_year);
    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > currentYear + 20) {
      return NextResponse.json(
        { error: 'Invalid expiry year' },
        { status: 400 }
      );
    }

    // Validate CVN
    const cvnRegex = /^\d{3,4}$/;
    if (!cvnRegex.test(cvn)) {
      return NextResponse.json(
        { error: 'Invalid CVN format' },
        { status: 400 }
      );
    }

    // Create card token
    const cardToken = await xenditService.createCardToken({
      account_number: account_number.replace(/\s/g, ''), // Remove spaces
      expiry_month: expiry_month.padStart(2, '0'), // Ensure 2 digits
      expiry_year: expiry_year.toString(),
      cvn,
      cardholder_name,
    });

    return NextResponse.json({
      success: true,
      cardToken: {
        id: cardToken.id,
        status: cardToken.status,
        authentication_id: cardToken.authentication_id,
      },
    });

  } catch (error: any) {
    console.error('Error creating card token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create card token',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
