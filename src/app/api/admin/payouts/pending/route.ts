import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

const customizationRepo = new CustomizationRepository();

/**
 * GET /api/admin/payouts/pending
 * Get all customization requests with pending designer payouts
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Unauthorized', statusCode: 401 }),
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        ResponseBuilder.error({ message: 'Forbidden - Admin access required', statusCode: 403 }),
        { status: 403 }
      );
    }

    // Get all customization requests with status 'ready_for_production'
    // and escrowStatus 'held' (meaning designer hasn't been paid yet)
    const requests = await customizationRepo.search({
      status: 'ready_for_production'
    });

    // Filter requests that have pending designer payouts
    const pendingPayouts = requests.filter(request => {
      return (
        request.paymentDetails &&
        request.paymentDetails.escrowStatus === 'held' &&
        request.paymentDetails.designerPayoutAmount &&
        request.paymentDetails.designerPayoutAmount > 0
      );
    });

    // Enrich with designer and customer information
    const enrichedPayouts = await Promise.all(
      pendingPayouts.map(async (request) => {
        let designerInfo = null;
        let customerInfo = null;

        // Get designer profile
        if (request.designerId) {
          try {
            // First try to find by profile ID
            let designerProfile = await FirebaseAdminService.getDocument(
              Collections.DESIGNER_PROFILES,
              request.designerId
            );

            // If not found, try finding by userId
            if (!designerProfile) {
              const profiles = await FirebaseAdminService.queryDocuments(
                Collections.DESIGNER_PROFILES,
                [{ field: 'userId', operator: '==', value: request.designerId }],
                undefined,
                1
              );
              designerProfile = profiles.length > 0 ? profiles[0] : null;
            }

            if (designerProfile) {
              designerInfo = {
                id: designerProfile.id,
                businessName: designerProfile.businessName,
                userId: designerProfile.userId
              };
            }
          } catch (error) {
            console.error('Error fetching designer profile:', error);
          }
        }

        // Get customer info
        if (request.customerId) {
          try {
            const customer = await FirebaseAdminService.getDocument(
              Collections.USERS,
              request.customerId
            );
            if (customer) {
              customerInfo = {
                id: customer.id,
                name: customer.displayName || customer.email,
                email: customer.email
              };
            }
          } catch (error) {
            console.error('Error fetching customer info:', error);
          }
        }

        return {
          requestId: request.id,
          customer: customerInfo,
          designer: designerInfo,
          amount: request.paymentDetails?.designerPayoutAmount || 0,
          approvedAt: request.approvedAt,
          createdAt: request.createdAt,
          status: request.status,
          escrowStatus: request.paymentDetails?.escrowStatus || 'held'
        };
      })
    );

    return NextResponse.json(
      ResponseBuilder.success(enrichedPayouts),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

