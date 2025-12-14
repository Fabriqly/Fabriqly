import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for Supabase Edge Function watermark
 * This allows images to be loaded via <img> tags without requiring
 * authentication headers (which browsers don't send for image requests)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const bucket = searchParams.get('bucket')

    if (!path || !bucket) {
      return NextResponse.json(
        { error: 'Missing path or bucket parameters' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF

    if (!supabaseUrl || !supabaseAnonKey || !projectRef) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // Construct Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/watermark?path=${encodeURIComponent(path)}&bucket=${encodeURIComponent(bucket)}`

    // Helper function to try fallback to public bucket
    const tryPublicBucketFallback = async (): Promise<NextResponse | null> => {
      try {
        const publicBucket = bucket.endsWith('-private') 
          ? bucket.replace('-private', '') 
          : bucket
        const publicPath = path.startsWith('designs/') || path.startsWith('products/')
          ? path
          : (bucket.includes('designs') ? `designs/${path}` : `products/${path}`)
        
        // Try to construct public URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${publicBucket}/${publicPath}`
        
        console.log(`[Watermark API] Trying fallback to public bucket: ${publicUrl}`)
        
        // Try fetching from public bucket
        // Use AbortController for timeout (more compatible)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const publicResponse = await fetch(publicUrl, {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (publicResponse.ok) {
          const publicImageBuffer = await publicResponse.arrayBuffer()
          console.log(`[Watermark API] Fallback successful: Using public bucket image from ${publicBucket}/${publicPath}`)
          return new NextResponse(publicImageBuffer, {
            status: 200,
            headers: {
              'Content-Type': publicResponse.headers.get('Content-Type') || 'image/png',
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
            },
          })
        } else {
          console.warn(`[Watermark API] Public bucket fallback failed with status ${publicResponse.status}`)
        }
      } catch (fallbackError: any) {
        console.error('[Watermark API] Fallback to public bucket failed:', fallbackError.message)
      }
      return null
    }

    // Call Edge Function with authorization header
    let response: Response
    try {
      // Use AbortController for timeout (more compatible)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      console.error('[Watermark API] Failed to call Edge Function:', fetchError.message)
      // Try fallback on network errors
      const fallbackResponse = await tryPublicBucketFallback()
      if (fallbackResponse) {
        return fallbackResponse
      }
      // If fallback fails, return transparent PNG
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      return new NextResponse(transparentPng, {
        status: 500,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
        },
      })
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error(`[Watermark API] Edge Function error (${response.status}):`, errorText.substring(0, 200))
      
      // Try fallback for any error (not just 404)
      // This handles cases where Edge Function is not deployed, misconfigured, or returns 500
      const fallbackResponse = await tryPublicBucketFallback()
      if (fallbackResponse) {
        return fallbackResponse
      }
      
      // If all fallbacks fail, return a 1x1 transparent PNG so img tag doesn't show broken icon
      // The component will handle the error and use fallbackSrc
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      return new NextResponse(transparentPng, {
        status: response.status,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('[Watermark API] Error proxying watermark request:', error.message || error)
    
    // Try fallback as last resort
    try {
      const { searchParams } = new URL(request.url)
      const path = searchParams.get('path')
      const bucket = searchParams.get('bucket')
      
      if (path && bucket) {
        const publicBucket = bucket.endsWith('-private') 
          ? bucket.replace('-private', '') 
          : bucket
        const publicPath = path.startsWith('designs/') || path.startsWith('products/')
          ? path
          : (bucket.includes('designs') ? `designs/${path}` : `products/${path}`)
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${publicBucket}/${publicPath}`
          const publicResponse = await fetch(publicUrl)
          if (publicResponse.ok) {
            const publicImageBuffer = await publicResponse.arrayBuffer()
            console.log('[Watermark API] Fallback successful in catch block')
            return new NextResponse(publicImageBuffer, {
              status: 200,
              headers: {
                'Content-Type': publicResponse.headers.get('Content-Type') || 'image/png',
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
              },
            })
          }
        }
      }
    } catch (fallbackError) {
      console.error('[Watermark API] Fallback in catch block also failed:', fallbackError)
    }
    
    // Return transparent PNG as final fallback
    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    return new NextResponse(transparentPng, {
      status: 500,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    })
  }
}


