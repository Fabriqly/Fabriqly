import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MessagingService } from '@/services/MessagingService';
import { DisputeRepository } from '@/repositories/DisputeRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { Timestamp } from 'firebase-admin/firestore';
import { Dispute, DisputeCategory } from '@/types/dispute';

const disputeRepo = new DisputeRepository();
const messagingService = new MessagingService();
const userRepo = new UserRepository();

/**
 * POST /api/admin/disputes/create-sample - Create a sample dispute for testing/admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Debug logging
    console.log('[CreateSampleDispute] Session check:', {
      userId: session.user.id,
      userRole: session.user.role,
      userName: session.user.name,
      userEmail: session.user.email
    });

    // Check if user is admin - also check database in case session is stale
    let isAdmin = session.user.role === 'admin';
    
    if (!isAdmin) {
      // Double-check in database in case session role is outdated
      try {
        const userDoc = await userRepo.findById(session.user.id);
        if (userDoc && (userDoc as any).role === 'admin') {
          console.log('[CreateSampleDispute] User is admin in database but not in session, proceeding anyway');
          isAdmin = true;
        }
      } catch (error) {
        console.error('[CreateSampleDispute] Error checking user role in database:', error);
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Forbidden - Admin access required',
          message: 'You must be an admin to create sample disputes. Your current role is: ' + session.user.role,
          debug: {
            sessionRole: session.user.role,
            userId: session.user.id
          }
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      category = 'shipping_not_received',
      stage = 'admin_review',
      status = 'open',
      orderId,
      customizationRequestId
    } = body;

    // Get or create sample users
    let customerId: string;
    let accusedPartyId: string;

    // Try to find existing customer
    const customers = await userRepo.findAll({
      filters: [{ field: 'role', operator: '==', value: 'customer' }],
      limit: 1
    });
    
    if (customers.length > 0) {
      customerId = customers[0].id;
    } else {
      // Create sample customer
      const customerData = {
        email: 'sample.customer@fabriqly.com',
        name: 'Sample Customer',
        role: 'customer',
        isActive: true,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
      };
      const customer = await userRepo.create(customerData);
      customerId = customer.id;
    }

    // Try to find existing business owner or designer
    let accusedRole = orderId ? 'business_owner' : 'designer';
    const accusedUsers = await userRepo.findAll({
      filters: [{ field: 'role', operator: '==', value: accusedRole }],
      limit: 1
    });

    if (accusedUsers.length > 0) {
      accusedPartyId = accusedUsers[0].id;
    } else {
      // Create sample accused party
      const accusedData = {
        email: `sample.${accusedRole}@fabriqly.com`,
        name: `Sample ${accusedRole === 'business_owner' ? 'Business Owner' : 'Designer'}`,
        role: accusedRole,
        isActive: true,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
      };
      const accused = await userRepo.create(accusedData);
      accusedPartyId = accused.id;
    }

    // Create dispute conversation
    const conversation = await messagingService.createDisputeConversation(
      customerId,
      accusedPartyId,
      orderId || undefined,
      customizationRequestId || undefined
    );

    // Set deadlines
    const now = Timestamp.now();
    const negotiationDeadline = new Date(now.toMillis() + (48 * 60 * 60 * 1000)); // 48 hours
    const deadline = new Date(now.toMillis() + (5 * 24 * 60 * 60 * 1000)); // 5 days

    // Create sample evidence (placeholder URLs)
    const evidenceImages = [
      {
        url: 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Evidence+Image+1',
        path: 'disputes/sample/evidence1.jpg',
        fileName: 'evidence1.jpg',
        fileSize: 150000,
        contentType: 'image/jpeg',
        uploadedAt: now as any
      },
      {
        url: 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Evidence+Image+2',
        path: 'disputes/sample/evidence2.jpg',
        fileName: 'evidence2.jpg',
        fileSize: 180000,
        contentType: 'image/jpeg',
        uploadedAt: now as any
      }
    ];

    // Create dispute record (bypassing normal validation)
    const disputeData: Omit<Dispute, 'id'> = {
      orderId: orderId || undefined,
      customizationRequestId: customizationRequestId || undefined,
      filedBy: customerId,
      accusedParty: accusedPartyId,
      stage: stage as any,
      category: category as DisputeCategory,
      description: `Sample dispute for testing admin functionality. This is a ${category} dispute filed by a customer against a ${accusedRole}. The dispute is currently in ${stage} stage and has ${status} status.`,
      evidenceImages,
      status: status as any,
      conversationId: conversation.id,
      negotiationDeadline: Timestamp.fromDate(negotiationDeadline) as any,
      deadline: Timestamp.fromDate(deadline) as any,
      createdAt: now as any,
      updatedAt: now as any,
      adminNotes: 'This is a sample dispute created for admin testing purposes.'
    };

    const dispute = await disputeRepo.create(disputeData);

    return NextResponse.json({
      success: true,
      message: 'Sample dispute created successfully',
      data: {
        disputeId: dispute.id,
        dispute,
        customerId,
        accusedPartyId,
        conversationId: conversation.id
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sample dispute:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create sample dispute' 
      },
      { status: 500 }
    );
  }
}

