'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface WatermarkedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath: string // Path in Supabase Storage (e.g., "designs/123/image.jpg")
  storageBucket: string // Bucket name (e.g., "designs-private")
  productId?: string // For purchase verification
  designId?: string // For purchase verification (alternative to productId)
  userId?: string // Current user ID (optional, will be fetched if not provided)
  fallbackSrc?: string // Fallback image URL if watermarking fails
}

export function WatermarkedImage({
  storagePath,
  storageBucket,
  productId,
  designId,
  userId,
  fallbackSrc,
  alt,
  className,
  ...props
}: WatermarkedImageProps) {
  const { data: session } = useSession()
  const [displayUrl, setDisplayUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    async function resolveUrl() {
      try {
        setLoading(true)
        setError(false)

        // Get current user if not provided
        let currentUserId = userId || (session?.user as any)?.id

        // Determine if user has purchased OR if design is free (via API route for server-side verification)
        // Also check design type (Premium designs always watermarked unless purchased)
        let hasPurchased = false
        let isFree = false
        let designType: 'template' | 'custom' | 'premium' | null = null
        
        if (currentUserId && (productId || designId)) {
          try {
            const params = new URLSearchParams()
            if (productId) params.append('productId', productId)
            if (designId) params.append('designId', designId)
            
            const response = await fetch(`/api/purchases/verify?${params.toString()}`)
            if (response.ok) {
              const data = await response.json()
              hasPurchased = data.hasPurchased || false
              isFree = data.isFree || false
              designType = data.designType || null
            }
          } catch (err) {
            console.error('Error verifying purchase:', err)
            // Fail securely - assume not purchased and not free
            hasPurchased = false
            isFree = false
            designType = null
          }
        }
        
        // For non-authenticated users, we still need to check if design is free and type
        // (Free designs should be accessible without login, but Premium always watermarked)
        if (!currentUserId && designId) {
          try {
            const response = await fetch(`/api/purchases/verify?designId=${designId}`)
            if (response.ok) {
              const data = await response.json()
              isFree = data.isFree || false
              designType = data.designType || null
              
              // Premium designs: Always watermarked (even if free) - don't treat as purchased
              if (designType === 'premium') {
                hasPurchased = false // Premium always needs purchase
              } else if (isFree) {
                // Template/Custom free designs: no watermark
                hasPurchased = true
              }
            }
          } catch (err) {
            // If check fails, assume not free and not premium
            isFree = false
            designType = null
          }
        }

        // Determine if we should serve clean image (no watermark):
        // 1. Premium designs: Only if purchased (even if free, premium needs purchase)
        // 2. Template/Custom designs: If free OR purchased
        const shouldServeClean = designType === 'premium' 
          ? (hasPurchased && currentUserId) // Premium: only if purchased
          : (isFree || (hasPurchased && currentUserId)) // Template/Custom: free or purchased
        
        if (shouldServeClean) {
          // Free design or purchased - get signed URL for clean image
          try {
            // Call API to get signed URL (server-side only for security)
            // Include designId for free design check if available
            const signedUrlParams = new URLSearchParams({
              bucket: storageBucket,
              path: storagePath
            })
            if (designId) {
              signedUrlParams.append('designId', designId)
            }
            const response = await fetch(`/api/images/signed-url?${signedUrlParams.toString()}`)
            
            if (response.ok) {
              const data = await response.json()
              if (data.signedUrl) {
                setDisplayUrl(data.signedUrl)
                setLoading(false)
                return
              }
            }
          } catch (err) {
            console.error('Error getting signed URL:', err)
            // Fall through to watermarked version (shouldn't happen for free designs)
          }
        }

        // Not free AND not purchased - use watermarked version via Edge Function
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl) {
          throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
        }

        // Extract project ref from Supabase URL
        // URL format: https://[project-ref].supabase.co
        const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
        const projectRef = urlMatch ? urlMatch[1] : null

        if (!projectRef) {
          throw new Error('Could not extract project ref from Supabase URL')
        }

        // Ensure path includes "designs/" prefix if needed
        let finalPath = storagePath;
        if ((storageBucket === 'designs-private' || storageBucket === 'designs') && !finalPath.startsWith('designs/')) {
          // If path doesn't start with "designs/" and looks like a timestamp path, add it
          if (/^\d+\//.test(finalPath)) {
            finalPath = `designs/${finalPath}`;
            console.log(`[WatermarkedImage] Added designs/ prefix: ${storagePath} -> ${finalPath}`);
          }
        }
        
        console.log(`[WatermarkedImage] Calling watermark API: bucket=${storageBucket}, path=${finalPath}`);
        
        // Try private bucket first, but if it fails, we'll fallback to public bucket
        // Use our Next.js API route as proxy (handles auth automatically)
        // This allows <img> tags to work without requiring auth headers
        const functionUrl = `/api/watermark?path=${encodeURIComponent(finalPath)}&bucket=${encodeURIComponent(storageBucket)}`
        
        // If bucket ends with '-private', also prepare a fallback URL for public bucket
        const fallbackBucket = storageBucket.endsWith('-private') 
          ? storageBucket.replace('-private', '') 
          : null
        
        // Set the URL - if it fails to load, the img onError will handle fallback
        setDisplayUrl(functionUrl)
        
        // Store fallback info for error handling
        if (fallbackBucket) {
          // We'll handle fallback in onError of the img tag
          ;(window as any).__watermarkFallback = {
            path: storagePath,
            bucket: fallbackBucket,
            projectRef
          }
        }
      } catch (err) {
        console.error('Error resolving image URL:', err)
        setError(true)
        if (fallbackSrc) {
          setDisplayUrl(fallbackSrc)
        }
      } finally {
        setLoading(false)
      }
    }

    resolveUrl()
    // Reset retry count when dependencies change
    setRetryCount(0)
  }, [storagePath, storageBucket, productId, designId, userId, fallbackSrc, session])

  // Prevent drag/drop to make it harder to save images
  const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    e.preventDefault()
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
    // Optionally disable right-click (can be annoying for users)
    // Uncomment if you want to disable:
    // e.preventDefault()
  }

  const maxRetries = 2

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const currentRetry = retryCount
    console.error('Image load error:', displayUrl, 'retry:', currentRetry)
    
    // Prevent infinite retry loops
    if (currentRetry >= maxRetries) {
      console.error('All retry attempts failed')
      setError(true)
      return
    }
    
    // If watermark function failed (404), try fallback to public bucket
    const fallback = (window as any).__watermarkFallback
    if (fallback && displayUrl?.includes('/api/watermark') && currentRetry === 0) {
      // Ensure fallback path has designs/ prefix if needed
      let fallbackPath = fallback.path
      if ((fallback.bucket === 'designs' || fallback.bucket === 'designs-private') && !fallbackPath.startsWith('designs/')) {
        if (/^\d+\//.test(fallbackPath)) {
          fallbackPath = `designs/${fallbackPath}`
        }
      }
      
      const fallbackUrl = `/api/watermark?path=${encodeURIComponent(fallbackPath)}&bucket=${encodeURIComponent(fallback.bucket)}`
      console.log('Watermark failed, trying fallback bucket:', fallbackUrl)
      setDisplayUrl(fallbackUrl)
      setRetryCount(prev => prev + 1)
      setError(false) // Reset error to try again
      return
    }
    
    // If watermark API failed and we have fallbackSrc, use it as final fallback
    // This will show the original image URL directly (may work if it's a public URL)
    if (fallbackSrc && displayUrl !== fallbackSrc) {
      if (currentRetry >= 1 || displayUrl?.includes('/api/watermark')) {
        console.log('Watermark API failed, using original URL as fallback:', fallbackSrc)
        setDisplayUrl(fallbackSrc)
        setRetryCount(prev => prev + 1)
        setError(false) // Reset error to try again
        return
      }
    }
    
    // Increment retry count if we haven't handled it yet
    if (currentRetry < maxRetries) {
      setRetryCount(prev => prev + 1)
    } else {
      // All retries exhausted - show error state or use fallbackSrc if available
      if (fallbackSrc && displayUrl !== fallbackSrc) {
        console.log('All retries failed, using fallbackSrc as last resort')
        setDisplayUrl(fallbackSrc)
        setError(false)
      } else {
        setError(true)
      }
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 ${className || ''}`} {...props}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  // If we have a URL to display (even if it's fallback), show the image
  // Only show error state if we truly have no URL at all
  const imageUrl = displayUrl || fallbackSrc
  
  if (error && !imageUrl) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className || ''}`} {...props}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onDragStart={handleDragStart}
      onContextMenu={handleContextMenu}
      onError={handleImageError}
      {...props}
    />
  )
}

