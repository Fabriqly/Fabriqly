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
  // Optimization props - pass these to skip API calls
  isFree?: boolean // If design is free (skips purchase verification)
  designType?: 'template' | 'custom' | 'premium' // Design type (helps determine if watermark needed)
}

export function WatermarkedImage({
  storagePath,
  storageBucket,
  productId,
  designId,
  userId,
  fallbackSrc,
  isFree: isFreeProp,
  designType: designTypeProp,
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

        // Check if this is a product (products should NEVER be watermarked)
        const isProduct = productId !== undefined || 
                         storageBucket === 'products' || 
                         storageBucket === 'products-private' ||
                         storagePath.startsWith('products/')

        // If it's a product, optimize by checking bucket type first
        if (isProduct) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          if (supabaseUrl) {
            const isPublicBucket = !storageBucket.endsWith('-private')
            
            // OPTIMIZATION: If public bucket, use direct public URL (no API call needed)
            if (isPublicBucket) {
              let finalPath = storagePath
              
              // Remove duplicate bucket prefix if present
              const bucketName = storageBucket.replace('-private', '')
              if (finalPath.startsWith(`${bucketName}/`)) {
                finalPath = finalPath.substring(bucketName.length + 1)
              }
              
              // Add prefix only if missing
              if (!finalPath.startsWith('products/') && (storageBucket === 'products' || storageBucket === 'products-private')) {
                if (/^\d+\//.test(finalPath) || /^[a-zA-Z0-9]+\//.test(finalPath)) {
                  finalPath = `products/${finalPath}`
                }
              }
              
              // Remove bucket prefix again for URL construction to avoid duplicate
              let urlPath = finalPath
              if (urlPath.startsWith(`${bucketName}/`)) {
                urlPath = urlPath.substring(bucketName.length + 1)
              }
              
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${urlPath}`
              setDisplayUrl(publicUrl)
              setLoading(false)
              return
            }
            
            // For private buckets, get signed URL (requires API call)
            try {
              const signedUrlParams = new URLSearchParams({
                bucket: storageBucket,
                path: storagePath
              })
              if (productId) {
                signedUrlParams.append('productId', productId)
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
              console.error('Error getting signed URL for product:', err)
              // Fall through to public URL attempt
            }
          }
        }

        // OPTIMIZATION: Check if design is in public bucket first (fastest path)
        const isPublicBucket = !storageBucket.endsWith('-private')
        
        // For designs only: Determine if user has purchased OR if design is free
        // Also check design type (Premium designs always watermarked unless purchased)
        let hasPurchased = false
        let isFree = isFreeProp ?? false // Use prop if provided, otherwise fetch
        let designType: 'template' | 'custom' | 'premium' | null = designTypeProp ?? null
        
        // OPTIMIZATION: If we have free status and design type from props, and it's a public bucket,
        // we can skip the API call entirely for free Template/Custom designs
        if (isPublicBucket && isFree && designType && designType !== 'premium') {
          // Free Template/Custom design in public bucket - use direct public URL (no API calls)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          if (supabaseUrl) {
            let finalPath = storagePath
            const bucketName = storageBucket.replace('-private', '')
            
            // Normalize path
            if (finalPath.startsWith(`${bucketName}/`)) {
              finalPath = finalPath.substring(bucketName.length + 1)
            }
            if (!finalPath.startsWith('designs/') && (storageBucket === 'designs' || storageBucket === 'designs-private')) {
              if (/^\d+\//.test(finalPath) || /^[a-zA-Z0-9]+\//.test(finalPath)) {
                finalPath = `designs/${finalPath}`
              }
            }
            
            let urlPath = finalPath
            if (urlPath.startsWith(`${bucketName}/`)) {
              urlPath = urlPath.substring(bucketName.length + 1)
            }
            
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${urlPath}`
            setDisplayUrl(publicUrl)
            setLoading(false)
            return
          }
        }
        
        // Only fetch purchase/design info if we don't have it from props
        if (designId && (isFreeProp === undefined || designTypeProp === undefined)) {
          if (currentUserId && designId) {
            try {
              const params = new URLSearchParams()
              params.append('designId', designId)
              
              const response = await fetch(`/api/purchases/verify?${params.toString()}`)
              if (response.ok) {
                const data = await response.json()
                hasPurchased = data.hasPurchased || false
                if (isFreeProp === undefined) isFree = data.isFree || false
                if (designTypeProp === undefined) designType = data.designType || null
              }
            } catch (err) {
              console.error('Error verifying purchase:', err)
              // Fail securely - assume not purchased and not free
              hasPurchased = false
              if (isFreeProp === undefined) isFree = false
              if (designTypeProp === undefined) designType = null
            }
          }
          
          // For non-authenticated users, we still need to check if design is free and type
          if (!currentUserId && designId) {
            try {
              const response = await fetch(`/api/purchases/verify?designId=${designId}`)
              if (response.ok) {
                const data = await response.json()
                if (isFreeProp === undefined) isFree = data.isFree || false
                if (designTypeProp === undefined) designType = data.designType || null
                
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
              if (isFreeProp === undefined) isFree = false
              if (designTypeProp === undefined) designType = null
            }
          }
        } else if (designId && isFree && designType && designType !== 'premium') {
          // We have props indicating it's free Template/Custom - no need to check purchase
          hasPurchased = true
        }

        // Determine if we should serve clean image (no watermark) - DESIGNS ONLY:
        // 1. Premium designs: Only if purchased (even if free, premium needs purchase)
        // 2. Template/Custom designs: If free OR purchased
        const shouldServeClean = designType === 'premium' 
          ? (hasPurchased && currentUserId) // Premium: only if purchased
          : (isFree || (hasPurchased && currentUserId)) // Template/Custom: free or purchased
        
        if (shouldServeClean) {
          // Free design or purchased - optimize by checking bucket type first
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          
          // OPTIMIZATION: If public bucket and free Template/Custom, use direct public URL (no API call)
          if (isPublicBucket && isFree && designType && designType !== 'premium') {
            if (supabaseUrl) {
              let finalPath = storagePath
              const bucketName = storageBucket.replace('-private', '')
              
              // Normalize path
              if (finalPath.startsWith(`${bucketName}/`)) {
                finalPath = finalPath.substring(bucketName.length + 1)
              }
              if (!finalPath.startsWith('designs/') && (storageBucket === 'designs' || storageBucket === 'designs-private')) {
                if (/^\d+\//.test(finalPath) || /^[a-zA-Z0-9]+\//.test(finalPath)) {
                  finalPath = `designs/${finalPath}`
                }
              }
              
              let urlPath = finalPath
              if (urlPath.startsWith(`${bucketName}/`)) {
                urlPath = urlPath.substring(bucketName.length + 1)
              }
              
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${urlPath}`
              setDisplayUrl(publicUrl)
              setLoading(false)
              return
            }
          }
          
          // For private buckets or purchased designs, get signed URL (requires API call)
          try {
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

        // Not free AND not purchased - use watermarked version via Edge Function (DESIGNS ONLY)
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

        // Normalize path - remove duplicate bucket prefix if present
        let finalPath = storagePath;
        
        // Remove duplicate bucket prefix if path already starts with bucket name
        // e.g., if bucket is "designs" and path is "designs/123/image.jpg", remove the duplicate
        const bucketName = storageBucket.replace('-private', '');
        if (finalPath.startsWith(`${bucketName}/`)) {
          finalPath = finalPath.substring(bucketName.length + 1);
          console.log(`[WatermarkedImage] Removed duplicate bucket prefix: ${storagePath} -> ${finalPath}`);
        }
        
        // Handle designs bucket - add prefix only if missing
        if ((storageBucket === 'designs-private' || storageBucket === 'designs') && !finalPath.startsWith('designs/')) {
          // If path doesn't start with "designs/" and looks like a timestamp path, add it
          if (/^\d+\//.test(finalPath) || /^[a-zA-Z0-9]+\//.test(finalPath)) {
            finalPath = `designs/${finalPath}`;
            console.log(`[WatermarkedImage] Added designs/ prefix: ${storagePath} -> ${finalPath}`);
          }
        }
        
        // Handle products bucket - add prefix only if missing
        if ((storageBucket === 'products-private' || storageBucket === 'products') && !finalPath.startsWith('products/')) {
          // If path doesn't start with "products/" and looks like a product path, add it
          if (/^\d+\//.test(finalPath) || /^[a-zA-Z0-9]+\//.test(finalPath)) {
            finalPath = `products/${finalPath}`;
            console.log(`[WatermarkedImage] Added products/ prefix: ${storagePath} -> ${finalPath}`);
          }
        }
        
        // Double-check: Products should NEVER reach this point (they should have returned earlier)
        // This is a safety check to ensure products never use watermark API
        const isProductCheck = productId !== undefined || 
                               storageBucket === 'products' || 
                               storageBucket === 'products-private' ||
                               finalPath.startsWith('products/')
        
        if (isProductCheck) {
          // Products should never be watermarked - use public URL or signed URL
          const publicBucket = storageBucket.endsWith('-private') ? storageBucket.replace('-private', '') : storageBucket
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${publicBucket}/${finalPath}`
          console.log(`[WatermarkedImage] Product detected - using public URL (no watermark): ${publicUrl}`)
          setDisplayUrl(publicUrl)
          setLoading(false)
          return
        }
        
        // From here on, only DESIGNS are handled
        // isPublicBucket is already declared above (line 114)
        
        // Get the actual bucket name (without -private suffix) for URL construction
        const actualBucket = storageBucket.replace('-private', '')
        
        // Remove bucket prefix from path if it exists (to avoid duplicate in URL)
        // e.g., if bucket is "designs" and path is "designs/123/image.jpg", use just "123/image.jpg"
        let urlPath = finalPath
        if (urlPath.startsWith(`${actualBucket}/`)) {
          urlPath = urlPath.substring(actualBucket.length + 1)
        }
        
        if (isPublicBucket) {
          // For public design buckets, we should still watermark them
          // Use watermark API even for public buckets to ensure all designs are protected
          console.log(`[WatermarkedImage] Public bucket detected, but using watermark API for design protection: bucket=${storageBucket}, path=${finalPath}`)
          
          // Use our Next.js API route as proxy (handles auth automatically)
          const functionUrl = `/api/watermark?path=${encodeURIComponent(finalPath)}&bucket=${encodeURIComponent(storageBucket)}`
          
          // Set the URL - if it fails to load, the img onError will handle fallback
          setDisplayUrl(functionUrl)
          
          // Store fallback info for error handling (fallback to public URL if watermark API fails)
          ;(window as any).__watermarkFallback = {
            path: storagePath,
            bucket: storageBucket,
            projectRef,
            isPublic: true,
            normalizedPath: urlPath
          }
          return
          
          // OLD CODE (commented out - was bypassing watermark for public buckets):
          // const publicUrl = `${supabaseUrl}/storage/v1/object/public/${actualBucket}/${urlPath}`
          // console.log(`[WatermarkedImage] Using public URL for public design bucket: ${publicUrl}`)
          // setDisplayUrl(publicUrl)
          
          // Store fallback info in case public URL fails
          ;(window as any).__watermarkFallback = {
            path: storagePath,
            bucket: storageBucket,
            projectRef,
            isPublic: true,
            normalizedPath: urlPath // Store normalized path without duplicate bucket prefix
          }
        } else {
          // For private design buckets, use watermark API (DESIGNS ONLY)
          // Use finalPath (which may include designs/ prefix) for watermark API
          console.log(`[WatermarkedImage] Calling watermark API for private design bucket: bucket=${storageBucket}, path=${finalPath}`);
          
          // Use our Next.js API route as proxy (handles auth automatically)
          // This allows <img> tags to work without requiring auth headers
          const functionUrl = `/api/watermark?path=${encodeURIComponent(finalPath)}&bucket=${encodeURIComponent(storageBucket)}`
          
          // Prepare fallback URL for public bucket (if private bucket fails)
          const fallbackBucket = storageBucket.replace('-private', '')
          
          // Set the URL - if it fails to load, the img onError will handle fallback
          setDisplayUrl(functionUrl)
          
          // Store fallback info for error handling
          ;(window as any).__watermarkFallback = {
            path: storagePath,
            bucket: fallbackBucket,
            projectRef,
            isPublic: false,
            normalizedPath: urlPath // Store normalized path without duplicate bucket prefix for public URL fallback
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
    // Log as warning for first retry (expected fallback), error for final failure
    if (currentRetry === 0) {
      console.warn('[WatermarkedImage] Image load error, attempting fallback:', displayUrl)
    } else {
      console.error('[WatermarkedImage] Image load error after retries:', displayUrl, 'retry:', currentRetry)
    }
    
    // Prevent infinite retry loops
    if (currentRetry >= maxRetries) {
      console.error('All retry attempts failed')
      setError(true)
      return
    }
    
    // Handle fallback based on what failed
    const fallback = (window as any).__watermarkFallback
    if (fallback && currentRetry === 0) {
      // Ensure fallback path has bucket prefix if needed
      let fallbackPath = fallback.path
      
      // Handle designs bucket
      if ((fallback.bucket === 'designs' || fallback.bucket === 'designs-private') && !fallbackPath.startsWith('designs/')) {
        if (/^\d+\//.test(fallbackPath) || /^[a-zA-Z0-9]+\//.test(fallbackPath)) {
          fallbackPath = `designs/${fallbackPath}`
        }
      }
      
      // Handle products bucket
      if ((fallback.bucket === 'products' || fallback.bucket === 'products-private') && !fallbackPath.startsWith('products/')) {
        if (/^\d+\//.test(fallbackPath) || /^[a-zA-Z0-9]+\//.test(fallbackPath)) {
          fallbackPath = `products/${fallbackPath}`
        }
      }
      
      // If public URL failed, try watermark API as fallback
      if (fallback.isPublic && displayUrl?.includes('/storage/v1/object/public/')) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          const watermarkUrl = `/api/watermark?path=${encodeURIComponent(fallbackPath)}&bucket=${encodeURIComponent(fallback.bucket)}`
          console.log('[WatermarkedImage] Public URL failed, trying watermark API:', watermarkUrl)
          setDisplayUrl(watermarkUrl)
          setRetryCount(prev => prev + 1)
          setError(false)
          return
        }
      }
      
      // If watermark API failed, try public bucket URL as fallback
      if (!fallback.isPublic && displayUrl?.includes('/api/watermark')) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          // Use normalized path if available, otherwise use fallbackPath
          let normalizedPath = fallback.normalizedPath || fallbackPath
          
          // Remove duplicate bucket prefix if present
          const bucketName = fallback.bucket.replace('-private', '')
          if (normalizedPath.startsWith(`${bucketName}/`)) {
            normalizedPath = normalizedPath.substring(bucketName.length + 1)
          }
          
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${fallback.bucket}/${normalizedPath}`
          console.log('[WatermarkedImage] Watermark API failed, trying public URL:', publicUrl)
          setDisplayUrl(publicUrl)
          setRetryCount(prev => prev + 1)
          setError(false)
          return
        }
      }
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

