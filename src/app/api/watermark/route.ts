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

    // Log what we have (without exposing secrets)
    console.log('[Watermark API] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasProjectRef: !!projectRef,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing'
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Watermark API] Missing required Supabase config:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      })
      return NextResponse.json(
        { error: 'Missing Supabase configuration', details: 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required' },
        { status: 500 }
      )
    }

    // Project ref is optional - we can extract it from the URL if needed
    // But for now, we'll use the URL directly which should work
    if (!projectRef) {
      console.warn('[Watermark API] NEXT_PUBLIC_SUPABASE_PROJECT_REF not set, but continuing (will extract from URL if needed)')
    }

    // Construct Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/watermark?path=${encodeURIComponent(path)}&bucket=${encodeURIComponent(bucket)}`

    // Helper function to try fallback to public bucket
    const tryPublicBucketFallback = async (): Promise<NextResponse | null> => {
      try {
        const publicBucket = bucket.endsWith('-private') 
          ? bucket.replace('-private', '') 
          : bucket
        
        // Normalize path - remove duplicate bucket prefix if present
        let publicPath = path
        if (publicPath.startsWith(`${publicBucket}/`)) {
          publicPath = publicPath.substring(publicBucket.length + 1)
        }
        
        // Only add prefix if it doesn't already exist
        if (!publicPath.startsWith('designs/') && !publicPath.startsWith('products/')) {
          if (bucket.includes('designs')) {
            publicPath = `designs/${publicPath}`
          } else if (bucket.includes('products')) {
            publicPath = `products/${publicPath}`
          }
        }
        
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
    console.log(`[Watermark API] Calling Edge Function: ${functionUrl}`)
    console.log(`[Watermark API] Parameters: path=${path}, bucket=${bucket}`)
    
    let response: Response
    try {
      // Use AbortController for timeout (increased to 30 seconds for image processing)
      // Image processing can take time, especially for large images with watermarking
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // Increased from 10s to 30s
      
      response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      console.log(`[Watermark API] Edge Function response status: ${response.status}`)
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
      console.error(`[Watermark API] Edge Function error (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
        functionUrl: functionUrl.substring(0, 100) + '...'
      })
      
      // If Edge Function returns 404 or 500, it might not be deployed or misconfigured
      if (response.status === 404) {
        console.warn('[Watermark API] Edge Function not found (404) - function may not be deployed')
      } else if (response.status === 500) {
        console.error('[Watermark API] Edge Function returned 500 - check function logs in Supabase Dashboard')
      }
      
      // Try fallback for any error (not just 404)
      // This handles cases where Edge Function is not deployed, misconfigured, or returns 500
      const fallbackResponse = await tryPublicBucketFallback()
      if (fallbackResponse) {
        console.log('[Watermark API] Using public bucket fallback after Edge Function error')
        return fallbackResponse
      }
      
      // If all fallbacks fail, return a 1x1 transparent PNG so img tag doesn't show broken icon
      // The component will handle the error and use fallbackSrc
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      // Return 200 with transparent PNG instead of error status to prevent browser error
      return new NextResponse(transparentPng, {
        status: 200, // Changed from response.status to 200 to prevent browser error
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
          'X-Watermark-Error': `Edge Function returned ${response.status}`,
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
    console.error('[Watermark API] Error proxying watermark request:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      fullError: error
    })
    
    // Try fallback as last resort
    try {
      const { searchParams } = new URL(request.url)
      const path = searchParams.get('path')
      const bucket = searchParams.get('bucket')
      
      if (path && bucket) {
        const publicBucket = bucket.endsWith('-private') 
          ? bucket.replace('-private', '') 
          : bucket
        
        // Normalize path - remove duplicate bucket prefix if present
        let publicPath = path
        if (publicPath.startsWith(`${publicBucket}/`)) {
          publicPath = publicPath.substring(publicBucket.length + 1)
        }
        
        // Only add prefix if it doesn't already exist
        if (!publicPath.startsWith('designs/') && !publicPath.startsWith('products/')) {
          if (bucket.includes('designs')) {
            publicPath = `designs/${publicPath}`
          } else if (bucket.includes('products')) {
            publicPath = `products/${publicPath}`
          }
        }
        
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


