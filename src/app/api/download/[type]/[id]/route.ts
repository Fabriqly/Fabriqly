import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SupabaseStorageService } from '@/lib/supabase-storage'
import { PurchaseService } from '@/services/PurchaseService'
import { FirebaseAdminService } from '@/services/firebase-admin'
import { Collections } from '@/services/firebase'

// GET /api/download/[type]/[id] - Download original file (requires purchase)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { type, id } = await params
    const userId = (session.user as any).id

    if (!['product', 'design', 'customization'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid download type. Must be product, design, or customization' },
        { status: 400 }
      )
    }

    let storagePath: string | undefined
    let storageBucket: string | undefined
    let entityId: string | undefined

    // Fetch the entity and get storage information
    if (type === 'product') {
      const product = await FirebaseAdminService.getDocument(Collections.PRODUCTS, id)
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Check if user has purchased
      const hasPurchased = await PurchaseService.hasPurchasedProduct(userId, id)
      if (!hasPurchased) {
        return NextResponse.json(
          { error: 'You must purchase this product to download the original files' },
          { status: 403 }
        )
      }

      // Get primary image or first image
      const images = await FirebaseAdminService.queryDocuments(
        Collections.PRODUCT_IMAGES,
        [{ field: 'productId', operator: '==', value: id }]
      )

      const primaryImage = images.find((img: any) => img.isPrimary) || images[0]
      if (!primaryImage) {
        return NextResponse.json(
          { error: 'No image found for this product' },
          { status: 404 }
        )
      }

      storagePath = primaryImage.storagePath
      storageBucket = primaryImage.storageBucket || 'products-private'
      entityId = id
    } else if (type === 'design') {
      const design = await FirebaseAdminService.getDocument(Collections.DESIGNS, id)
      if (!design) {
        return NextResponse.json(
          { error: 'Design not found' },
          { status: 404 }
        )
      }

      // Check if user has purchased
      const hasPurchased = await PurchaseService.hasPurchasedDesign(userId, id)
      if (!hasPurchased) {
        return NextResponse.json(
          { error: 'You must purchase this design to download the original files' },
          { status: 403 }
        )
      }

      // Get design file path - prefer storagePath/storageBucket, fallback to designFileUrl
      if ((design as any).storagePath && (design as any).storageBucket) {
        storagePath = (design as any).storagePath
        storageBucket = (design as any).storageBucket
      } else if ((design as any).designFileUrl) {
        // Extract path from URL if storagePath not available
        storagePath = extractPathFromUrl((design as any).designFileUrl) || (design as any).designFileUrl
        storageBucket = (design as any).storageBucket || 'designs-private'
      } else {
        return NextResponse.json(
          { error: 'Design file not found' },
          { status: 404 }
        )
      }
      entityId = id
    } else if (type === 'customization') {
      // Similar logic for customizations
      const customization = await FirebaseAdminService.getDocument(
        Collections.CUSTOMIZATION_REQUESTS,
        id
      )
      if (!customization) {
        return NextResponse.json(
          { error: 'Customization request not found' },
          { status: 404 }
        )
      }

      // Check ownership or purchase
      if ((customization as any).customerId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      storagePath = (customization as any).designerFinalFile
      storageBucket = 'designs-private'
      entityId = id
    }

    if (!storagePath || !storageBucket) {
      return NextResponse.json(
        { error: 'File path not found' },
        { status: 404 }
      )
    }

    // Generate signed URL (1 hour expiry)
    const signedUrl = await SupabaseStorageService.getSignedUrl(storageBucket, storagePath, 3600)

    // Log download activity (optional)
    console.log(`Download: ${type}/${id} by user ${userId}`)

    return NextResponse.json({
      downloadUrl: signedUrl,
      expiresIn: 3600,
      type,
      id: entityId
    })
  } catch (error: any) {
    console.error('Error generating download URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to extract storage path from Supabase URL
function extractPathFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url)
    // Supabase storage URLs: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?...
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^\/]+)\/(.+)/)
    if (pathMatch) {
      return pathMatch[2]
    }
  } catch (e) {
    // Invalid URL
  }
  return undefined
}








