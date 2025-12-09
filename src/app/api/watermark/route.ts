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

    // Call Edge Function with authorization header
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function error:', response.status, errorText)
      
      // Try fallback: attempt to get image from public bucket
      if (response.status === 404) {
        const publicBucket = bucket.endsWith('-private') 
          ? bucket.replace('-private', '') 
          : bucket
        const publicPath = path.startsWith('designs/') || path.startsWith('products/')
          ? path
          : (bucket.includes('designs') ? `designs/${path}` : `products/${path}`)
        
        try {
          // Try to construct public URL
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${publicBucket}/${publicPath}`
          
          // Try fetching from public bucket
          const publicResponse = await fetch(publicUrl)
          if (publicResponse.ok) {
            const publicImageBuffer = await publicResponse.arrayBuffer()
            console.log('Fallback: Using public bucket image')
            return new NextResponse(publicImageBuffer, {
              status: 200,
              headers: {
                'Content-Type': publicResponse.headers.get('Content-Type') || 'image/png',
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
              },
            })
          }
        } catch (fallbackError) {
          console.error('Fallback to public bucket also failed:', fallbackError)
        }
      }
      
      // If all fallbacks fail, return a 1x1 transparent PNG so img tag doesn't show broken icon
      // The component will handle the error and use fallbackSrc
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      return new NextResponse(transparentPng, {
        status: 404,
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
    console.error('Error proxying watermark request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


