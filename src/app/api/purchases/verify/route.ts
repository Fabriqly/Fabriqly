import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PurchaseService } from '@/services/PurchaseService'
import { DesignRepository } from '@/repositories/DesignRepository'

// GET /api/purchases/verify - Verify if user has purchased a product/design
// Also checks if design is free (accessible without authentication)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const designId = searchParams.get('designId')
    const userId = session ? (session.user as any).id : null

    // Allow unauthenticated access for checking if design is free
    // (Free designs should be accessible to everyone)

    if (!productId && !designId) {
      return NextResponse.json(
        { error: 'Either productId or designId is required' },
        { status: 400 }
      )
    }

    let hasPurchased = false
    let isFree = false
    let designType: 'template' | 'custom' | 'premium' | null = null

    if (productId) {
      // Products require authentication to check purchase
      if (!userId) {
        return NextResponse.json({
          hasPurchased: false,
          isFree: false,
          designType: null,
          userId: null,
          productId,
          designId: null
        })
      }
      hasPurchased = await PurchaseService.hasPurchasedProduct(userId, productId)
      // Products don't have isFree field (they always have a price)
      isFree = false
    } else if (designId) {
      // Fetch design to check pricing and type
      try {
        const designRepository = new DesignRepository()
        const design = await designRepository.findById(designId)
        
        if (design) {
          designType = design.designType
          isFree = design.pricing?.isFree || false
          
          // Premium designs: Always watermarked (even if free) - maximum protection
          if (designType === 'premium') {
            // Premium designs always need purchase to remove watermark
            // Even if marked as free, premium designs should be watermarked
            if (userId) {
              hasPurchased = await PurchaseService.hasPurchasedDesign(userId, designId)
            }
            // If not purchased, watermark will be applied (even if free)
          } else {
            // Template/Custom designs: Follow normal rules
            // Free = no watermark, Paid = watermark if not purchased
            if (isFree) {
              // Free designs don't require purchase - treat as "purchased" for watermark purposes
              hasPurchased = true
            } else if (userId) {
              // Only check purchase if design is not free AND user is authenticated
              hasPurchased = await PurchaseService.hasPurchasedDesign(userId, designId)
            }
            // If not authenticated and not free, hasPurchased remains false
          }
        }
      } catch (error) {
        console.error('Error fetching design for free/type check:', error)
        // If we can't check, assume it's paid
        if (userId) {
          hasPurchased = await PurchaseService.hasPurchasedDesign(userId, designId)
        }
      }
    }

    return NextResponse.json({
      hasPurchased,
      isFree,
      designType,
      userId,
      productId: productId || null,
      designId: designId || null
    })
  } catch (error: any) {
    console.error('Error verifying purchase:', error)
    return NextResponse.json(
      { error: 'Failed to verify purchase', details: error.message },
      { status: 500 }
    )
  }
}


