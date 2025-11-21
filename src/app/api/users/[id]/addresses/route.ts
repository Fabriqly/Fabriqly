import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/users/[id]/addresses - Get all addresses for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only view their own addresses
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get user document
    const user = await FirebaseAdminService.getDocument(Collections.USERS, id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const addresses = user.shippingAddresses || [];

    return NextResponse.json({
      success: true,
      data: addresses
    });
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch addresses' 
      },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/addresses - Add new address
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only add to their own addresses
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { address, setAsDefault } = body;

    // Validate address
    const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'zipCode', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !address[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user document
    const user = await FirebaseAdminService.getDocument(Collections.USERS, id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const existingAddresses = user.shippingAddresses || [];

    // Generate ID for new address
    const newAddress = {
      id: `addr_${Date.now()}`,
      ...address,
      isDefault: setAsDefault || existingAddresses.length === 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // If this is set as default, unmark other defaults
    let updatedAddresses = existingAddresses;
    if (newAddress.isDefault) {
      updatedAddresses = existingAddresses.map((addr: any) => ({
        ...addr,
        isDefault: false
      }));
    }

    updatedAddresses.push(newAddress);

    // Update user document
    await FirebaseAdminService.updateDocument(Collections.USERS, id, {
      shippingAddresses: updatedAddresses,
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({
      success: true,
      data: newAddress,
      message: 'Address added successfully'
    });
  } catch (error: any) {
    console.error('Error adding address:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to add address' 
      },
      { status: 500 }
    );
  }
}



