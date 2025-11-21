import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CustomizationRepository } from '@/repositories/CustomizationRepository';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Timestamp } from 'firebase-admin/firestore';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/customizations/[id]/shop-pricing - Add shop costs (product + printing)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only business owners can add shop pricing
    if (session.user.role !== 'business_owner') {
      return NextResponse.json(
        { success: false, error: 'Only shop owners can add shop pricing' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { printingCost } = body;

    if (printingCost === undefined || printingCost < 0) {
      return NextResponse.json(
        { success: false, error: 'Printing cost is required and must be 0 or greater' },
        { status: 400 }
      );
    }

    // Get the customization request
    const customizationRepo = new CustomizationRepository();
    const request = await customizationRepo.findById(id);

    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Customization request not found' },
        { status: 404 }
      );
    }

    // Verify that this shop owner's shop was selected for this customization
    if (request.printingShopId) {
      const shop = await FirebaseAdminService.getDocument(Collections.SHOP_PROFILES, request.printingShopId);
      if (!shop || shop.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'You can only add pricing for your own shop' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'No printing shop has been selected for this customization' },
        { status: 400 }
      );
    }

    // Check if pricing agreement exists
    if (!request.pricingAgreement) {
      return NextResponse.json(
        { success: false, error: 'No pricing agreement found. Designer must set design fee first.' },
        { status: 400 }
      );
    }

    // Get product to calculate actual product cost (base price + color adjustment)
    const { ProductRepository } = await import('@/repositories/ProductRepository');
    const productRepo = new ProductRepository();
    const product = await productRepo.findById(request.productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate actual product cost: base price + color price adjustment
    const baseProductCost = product.price;
    const colorAdjustment = request.colorPriceAdjustment || 0;
    const actualProductCost = baseProductCost + colorAdjustment;

    // Use the calculated product cost (ignore the input productCost, calculate it automatically)
    const designFee = request.pricingAgreement.designFee;
    const totalCost = designFee + actualProductCost + printingCost;

    const updatedPricingAgreement = {
      ...request.pricingAgreement,
      productCost: actualProductCost, // Use calculated cost (base + color)
      printingCost,
      totalCost,
      updatedAt: Timestamp.now(),
      shopPricingAddedBy: session.user.id,
      shopPricingAddedAt: Timestamp.now()
    };

    // Update payment details if they exist
    let updatedPaymentDetails = request.paymentDetails;
    if (updatedPaymentDetails) {
      updatedPaymentDetails = {
        ...updatedPaymentDetails,
        totalAmount: totalCost,
        remainingAmount: totalCost - (updatedPaymentDetails.paidAmount || 0)
      };
    }

    // Update the customization request
    await customizationRepo.update(id, {
      pricingAgreement: updatedPricingAgreement as any,
      paymentDetails: updatedPaymentDetails as any,
      updatedAt: Timestamp.now() as any
    });

    return NextResponse.json({
      success: true,
      message: 'Shop pricing added successfully',
      data: {
        productCost: actualProductCost,
        printingCost,
        totalCost,
        basePrice: baseProductCost,
        colorAdjustment: colorAdjustment
      }
    });
  } catch (error: any) {
    console.error('Error adding shop pricing:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add shop pricing' },
      { status: 500 }
    );
  }
}

