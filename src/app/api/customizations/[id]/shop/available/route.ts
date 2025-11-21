import { NextRequest, NextResponse } from 'next/server';
import { CustomizationService } from '@/services/CustomizationService';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { Collections } from '@/services/firebase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const customizationService = new CustomizationService();

/**
 * GET /api/customizations/[id]/shop/available - Get available shops filtered by product category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Get customization request
    const customizationRequest = await customizationService.getRequestById(id);
    
    if (!customizationRequest) {
      return NextResponse.json(
        { error: 'Customization request not found' },
        { status: 404 }
      );
    }

    // Verify user is the customer or designer
    if (
      customizationRequest.customerId !== session.user.id &&
      customizationRequest.designerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to view available shops' },
        { status: 403 }
      );
    }

    // Get product details to find category and owner shop
    const product = await FirebaseAdminService.getDocument(
      Collections.PRODUCTS,
      customizationRequest.productId
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Extract product category/name for matching
    const productCategory = product.categoryId || product.category;
    const productName = product.name || product.productName || '';
    const productTags = product.tags || [];
    const productShopId = product.shopId;
    
    // Get all active, approved shop profiles
    const shopsSnapshot = await adminDb
      .collection(Collections.SHOP_PROFILES)
      .where('isActive', '==', true)
      .where('approvalStatus', '==', 'approved')
      .get();

    const allShops = shopsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter shops that can handle this product type
    const matchingShops = allShops.filter(shop => {
      // Check if shop supports the product category
      if (productCategory && shop.supportedProductCategories?.includes(productCategory)) {
        return true;
      }

      // Check if shop specialties match product name or tags
      if (shop.specialties && shop.specialties.length > 0) {
        const specialtiesLower = shop.specialties.map((s: string) => s.toLowerCase());
        const productNameLower = productName.toLowerCase();
        const productTagsLower = productTags.map((t: string) => t.toLowerCase());

        // Check if product name contains any specialty
        const nameMatches = specialtiesLower.some((specialty: string) => 
          productNameLower.includes(specialty) || specialty.includes(productNameLower)
        );

        // Check if any product tag matches specialty
        const tagMatches = productTagsLower.some((tag: string) =>
          specialtiesLower.some((specialty: string) => 
            tag.includes(specialty) || specialty.includes(tag)
          )
        );

        if (nameMatches || tagMatches) {
          return true;
        }
      }

      return false;
    });

    // Separate product owner's shop, designer's shop, and other shops
    let productOwnerShop = null;
    let designerShop = null;
    const otherShops: any[] = [];

    const formatShop = (shop: any) => ({
            id: shop.id,
            businessName: shop.shopName || shop.businessName,
            description: shop.description,
            location: shop.location?.city && shop.location?.province
              ? `${shop.location.city}, ${shop.location.province}`
              : shop.location?.city || shop.location?.province || '',
            averageRating: shop.ratings?.averageRating || 0,
            totalReviews: shop.ratings?.totalReviews || 0,
            specialties: shop.specialties || []
          });

    // First, get product owner's shop (should ALWAYS be shown if exists)
    if (productShopId) {
      const productShop = allShops.find(shop => shop.id === productShopId);
      if (productShop) {
        productOwnerShop = formatShop(productShop);
      }
    }

    // Then, get designer's shop (should ALWAYS be shown if exists)
    if (customizationRequest.designerId) {
      const designerOwnedShop = allShops.find(shop => shop.userId === customizationRequest.designerId);
      if (designerOwnedShop) {
        designerShop = formatShop(designerOwnedShop);
      }
    }

    // Finally, add other matching shops (excluding product owner and designer shops)
    for (const shop of matchingShops) {
      const isProductOwnerShop = productShopId && shop.id === productShopId;
      const isDesignerShop = customizationRequest.designerId && shop.userId === customizationRequest.designerId;
      
      if (!isProductOwnerShop && !isDesignerShop) {
        otherShops.push(formatShop(shop));
      }
    }

    // Sort other shops by rating
    otherShops.sort((a, b) => b.averageRating - a.averageRating);

    return NextResponse.json({
      success: true,
      data: {
        productOwnerShop,
        designerShop,
        otherShops,
        productInfo: {
          name: productName,
          category: productCategory,
          tags: productTags
        },
        matchedShopsCount: matchingShops.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching available shops:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch available shops' 
      },
      { status: 500 }
    );
  }
}

