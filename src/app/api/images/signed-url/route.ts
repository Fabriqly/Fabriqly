import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SupabaseStorageService } from '@/lib/supabase-storage'

// GET /api/images/signed-url - Get signed URL for private image
// Allows unauthenticated access for free designs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const path = searchParams.get('path')
    const designId = searchParams.get('designId') // Optional: legacy
    const isFreeParam = searchParams.get('isFree') === 'true'

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing bucket or path parameters' },
        { status: 400 }
      )
    }

    // Require authentication unless design is free
    if (!session && !isFreeParam) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate signed URL (1 hour expiry)
    try {
      const signedUrl = await SupabaseStorageService.getSignedUrl(bucket, path, 3600)
      return NextResponse.json({
        signedUrl,
        expiresIn: 3600
      })
    } catch (signedUrlError: any) {
      // If file not found in private bucket, try public bucket as fallback
      const isNotFound = signedUrlError.isNotFound || 
                         signedUrlError.message?.includes('not found') || 
                         signedUrlError.message?.includes('Object not found')
      
      if (isNotFound) {
        const publicBucket = bucket.endsWith('-private') 
          ? bucket.replace('-private', '') 
          : bucket
        
        if (publicBucket !== bucket) {
          try {
            console.log(`[signed-url] File not found in ${bucket}, trying public bucket ${publicBucket} for path: ${path}`)
            const publicSignedUrl = await SupabaseStorageService.getSignedUrl(publicBucket, path, 3600)
            return NextResponse.json({
              signedUrl: publicSignedUrl,
              expiresIn: 3600,
              fromPublicBucket: true
            })
          } catch (publicError: any) {
            // If public bucket also fails, return 404
            const publicIsNotFound = publicError.isNotFound || 
                                     publicError.message?.includes('not found') || 
                                     publicError.message?.includes('Object not found')
            
            if (publicIsNotFound) {
              console.log(`[signed-url] File not found in both ${bucket} and ${publicBucket}: ${path}`)
            } else {
              console.error(`[signed-url] Error accessing public bucket ${publicBucket}:`, publicError.message)
            }
            
            return NextResponse.json(
              { error: 'Image not found', details: 'File does not exist in storage' },
              { status: 404 }
            )
          }
        }
        
        // If no public bucket fallback, return 404
        console.log(`[signed-url] File not found in ${bucket}: ${path} (no public bucket fallback available)`)
        return NextResponse.json(
          { error: 'Image not found', details: 'File does not exist in storage' },
          { status: 404 }
        )
      }
      
      // For other errors, rethrow to be caught by outer catch
      throw signedUrlError
    }
  } catch (error: any) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate signed URL', details: error.message },
      { status: 500 }
    )
  }
}


