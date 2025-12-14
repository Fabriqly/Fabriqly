import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const imagePath = url.searchParams.get('path')
    const bucket = url.searchParams.get('bucket') || 'designs-private'

    if (!imagePath) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase Admin Client
    // In Edge Functions, these are automatically available as environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    console.log('Supabase config check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlPrefix: supabaseUrl.substring(0, 20) + '...' // Log partial URL for debugging
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Normalize the path - ensure it has the correct folder structure
    // Files should be in format: designs/{timestamp}/{filename}
    // But some older files might be: {timestamp}/{filename}
    let normalizedPath = imagePath;
    const originalPath = imagePath;
    
    // If path doesn't start with 'designs/' or 'products/', try to add it
    // But only if the bucket is designs-private or products-private
    if ((bucket === 'designs-private' || bucket === 'designs') && !normalizedPath.startsWith('designs/')) {
      // Check if it's a timestamp-based path (e.g., "1764081524342/1764081524342.jpg")
      // If so, add the "designs/" prefix
      if (/^\d+\//.test(normalizedPath)) {
        normalizedPath = `designs/${normalizedPath}`;
        console.log(`Path normalization: ${originalPath} -> ${normalizedPath}`);
      }
    } else if ((bucket === 'products-private' || bucket === 'products') && !normalizedPath.startsWith('products/')) {
      // Similar for products
      if (/^\d+\//.test(normalizedPath)) {
        normalizedPath = `products/${normalizedPath}`;
        console.log(`Path normalization: ${originalPath} -> ${normalizedPath}`);
      }
    }
    
    // Download the original image from private bucket
    // Try normalized path first, then original path if it fails
    console.log(`Attempting to download: bucket=${bucket}, path=${normalizedPath}`)
    
    let { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(normalizedPath)
    
    // If download fails with normalized path, try the original path
    if (downloadError && normalizedPath !== originalPath) {
      console.log(`Download with normalized path failed, trying original path: ${originalPath}`);
      const retryResult = await supabase
        .storage
        .from(bucket)
        .download(originalPath);
      
      if (!retryResult.error && retryResult.data) {
        console.log(`Download successful with original path`);
        fileData = retryResult.data;
        downloadError = null;
        normalizedPath = originalPath; // Use original path for rest of processing
      } else {
        // Both paths failed, let's try to list the bucket to see what's actually there
        console.log(`Both paths failed. Listing bucket contents to debug...`);
        const folderName = originalPath.split('/')[0]; // Get first folder (timestamp)
        const { data: listData, error: listError } = await supabase
          .storage
          .from(bucket)
          .list(folderName, {
            limit: 10,
            offset: 0
          });
        
        if (listData && listData.length > 0) {
          console.log(`Found files in folder "${folderName}":`, listData.map(f => f.name));
        } else {
          // Try listing with "designs/" prefix
          const designsFolderName = `designs/${folderName}`;
          const { data: designsListData, error: designsListError } = await supabase
            .storage
            .from(bucket)
            .list(designsFolderName, {
              limit: 10,
              offset: 0
            });
          
          if (designsListData && designsListData.length > 0) {
            console.log(`Found files in folder "${designsFolderName}":`, designsListData.map(f => f.name));
            // Try downloading with the designs/ prefix
            const correctedPath = `designs/${originalPath}`;
            console.log(`Trying corrected path: ${correctedPath}`);
            const correctedResult = await supabase
              .storage
              .from(bucket)
              .download(correctedPath);
            
            if (!correctedResult.error && correctedResult.data) {
              console.log(`Download successful with corrected path!`);
              fileData = correctedResult.data;
              downloadError = null;
              normalizedPath = correctedPath;
            }
          }
        }
      }
    }

    if (downloadError) {
      console.error('Download error details:', {
        message: downloadError.message,
        statusCode: downloadError.statusCode,
        error: downloadError.error,
        fullError: JSON.stringify(downloadError)
      })
    }

    if (!fileData) {
      console.error('No file data returned (fileData is null/undefined)')
    }

    // If download failed, try multiple fallback strategies
    if (downloadError || !fileData) {
      console.log(`Download failed from ${bucket}, trying fallback strategies...`)
      
      // Strategy 1: Try public bucket if we were using private bucket
      const publicBucket = bucket.endsWith('-private') 
        ? bucket.replace('-private', '') 
        : null
      
      const pathsToTry = [
        normalizedPath,
        originalPath,
        // Try without designs/ prefix (for older files)
        normalizedPath.startsWith('designs/') ? normalizedPath.substring(7) : null,
        originalPath.startsWith('designs/') ? originalPath.substring(7) : null,
        // Try with just timestamp/filename if path has designs/ prefix
        normalizedPath.includes('/') ? normalizedPath.split('/').slice(-2).join('/') : null,
      ].filter(p => p !== null && p !== normalizedPath && p !== originalPath) as string[]
      
      // Try public bucket with all path variations
      if (publicBucket && publicBucket !== bucket) {
        for (const tryPath of [normalizedPath, originalPath, ...pathsToTry]) {
          console.log(`Attempting download from public bucket: ${publicBucket}, path: ${tryPath}`)
          const { data: publicFileData, error: publicError } = await supabase
            .storage
            .from(publicBucket)
            .download(tryPath)
          
          if (!publicError && publicFileData) {
            console.log(`Successfully downloaded from public bucket: ${publicBucket} with path: ${tryPath}`)
            fileData = publicFileData
            downloadError = null
            normalizedPath = tryPath
            break
          }
        }
      }
      
      // Strategy 2: Try private bucket with path variations (if not already tried)
      if ((downloadError || !fileData) && bucket.endsWith('-private')) {
        for (const tryPath of pathsToTry) {
          console.log(`Attempting download from private bucket with alternative path: ${tryPath}`)
          const { data: altFileData, error: altError } = await supabase
            .storage
            .from(bucket)
            .download(tryPath)
          
          if (!altError && altFileData) {
            console.log(`Successfully downloaded from private bucket with alternative path: ${tryPath}`)
            fileData = altFileData
            downloadError = null
            normalizedPath = tryPath
            break
          }
        }
      }
      
      // Strategy 3: Try to find the file by listing the bucket
      if (downloadError || !fileData) {
        console.log(`All path variations failed. Attempting to locate file by listing bucket...`)
        const timestampMatch = imagePath.match(/(\d+)/)
        if (timestampMatch) {
          const timestamp = timestampMatch[1]
          // Try listing with different prefixes
          const listPaths = [
            timestamp,
            `designs/${timestamp}`,
            imagePath.split('/').slice(0, -1).join('/'), // Directory from original path
          ]
          
          for (const listPath of listPaths) {
            try {
              const { data: listData, error: listError } = await supabase
                .storage
                .from(bucket)
                .list(listPath, { limit: 20, offset: 0 })
              
              if (listData && listData.length > 0) {
                console.log(`Found ${listData.length} files in "${listPath}":`, listData.map(f => f.name))
                // Try to find a file matching our filename
                const fileName = imagePath.split('/').pop() || imagePath
                const matchingFile = listData.find(f => f.name === fileName || f.name.includes(fileName.split('.')[0]))
                if (matchingFile) {
                  const foundPath = listPath === timestamp ? `${listPath}/${matchingFile.name}` : `${listPath}/${matchingFile.name}`
                  console.log(`Trying to download found file: ${foundPath}`)
                  const { data: foundFileData, error: foundError } = await supabase
                    .storage
                    .from(bucket)
                    .download(foundPath)
                  
                  if (!foundError && foundFileData) {
                    console.log(`Successfully downloaded found file: ${foundPath}`)
                    fileData = foundFileData
                    downloadError = null
                    normalizedPath = foundPath
                    break
                  }
                }
              }
            } catch (listErr) {
              // Continue to next list path
            }
          }
        }
      }
      
      // If still failed after all strategies, return error
      if (downloadError || !fileData) {
        console.error('Error downloading image from both buckets after all fallback strategies:', {
          error: downloadError,
          bucket,
          path: imagePath,
          normalizedPath,
          originalPath,
          errorMessage: downloadError?.message,
          errorStatus: downloadError?.statusCode,
          errorCode: downloadError?.error,
          fullError: JSON.stringify(downloadError)
        })
        
        // Return a 1x1 transparent PNG instead of JSON error so the image tag doesn't break
        // The frontend will handle this gracefully
        const transparentPng = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        )
        return new Response(transparentPng, {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache',
            'X-Image-Error': 'File not found in storage',
          },
        })
      }
    }

    // Convert blob to array buffer
    console.log('Download successful! File size:', fileData.size, 'bytes')
    const imageBuffer = await fileData.arrayBuffer()
    const imageBytes = new Uint8Array(imageBuffer)
    console.log('Image buffer created, size:', imageBytes.length, 'bytes')

    // Get watermark configuration from environment
    // WATERMARK_IMAGE_PATH: Path to watermark image in Supabase storage (e.g., "watermarks/logo.png")
    // WATERMARK_IMAGE_BUCKET: Bucket containing watermark image (default: "watermarks" or "public")
    // WATERMARK_OPACITY: Opacity of watermark overlay (0.0-1.0, default: 0.15 for ~15%)
    const watermarkImagePath = Deno.env.get('WATERMARK_IMAGE_PATH') || 'watermarks/watermark.png'
    const watermarkImageBucket = Deno.env.get('WATERMARK_IMAGE_BUCKET') || 'watermarks'
    const watermarkOpacity = parseFloat(Deno.env.get('WATERMARK_OPACITY') || '0.15')
    
    // Use ImageScript for watermarking
    try {
      const { Image } = await import('https://deno.land/x/imagescript@1.2.15/mod.ts')
      
      // Decode the main image
      const image = await Image.decode(imageBytes)
      
      // Load watermark image from Supabase storage
      let watermarkImage: Image | null = null
      try {
        console.log(`Loading watermark image from bucket: ${watermarkImageBucket}, path: ${watermarkImagePath}`)
        const { data: watermarkData, error: watermarkError } = await supabase
          .storage
          .from(watermarkImageBucket)
          .download(watermarkImagePath)
        
        if (watermarkError || !watermarkData) {
          console.warn(`Failed to load watermark image: ${watermarkError?.message || 'No data'}`)
          console.warn('Falling back to text watermark or returning original image')
          // Fallback: return original image if watermark can't be loaded
          // You could also fall back to text watermark here if desired
          return new Response(imageBytes, {
            headers: {
              ...corsHeaders,
              'Content-Type': fileData.type || 'image/png',
              'Cache-Control': 'public, max-age=3600',
            },
          })
        }
        
        const watermarkBuffer = await watermarkData.arrayBuffer()
        const watermarkBytes = new Uint8Array(watermarkBuffer)
        watermarkImage = await Image.decode(watermarkBytes)
        console.log(`Watermark image loaded: ${watermarkImage.width}x${watermarkImage.height}px`)
      } catch (watermarkLoadError) {
        console.error('Error loading watermark image:', watermarkLoadError)
        // Fallback: return original image
        return new Response(imageBytes, {
          headers: {
            ...corsHeaders,
            'Content-Type': fileData.type || 'image/png',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
      
      if (!watermarkImage) {
        console.error('Watermark image is null')
        return new Response(imageBytes, {
          headers: {
            ...corsHeaders,
            'Content-Type': fileData.type || 'image/png',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
      
      // Scale watermark to cover entire image (object-fit: cover style)
      // Calculate scale to cover the entire image while maintaining aspect ratio
      const scaleX = image.width / watermarkImage.width
      const scaleY = image.height / watermarkImage.height
      // Use the larger scale to ensure the watermark covers the entire image
      const coverScale = Math.max(scaleX, scaleY)
      
      const scaledWatermarkWidth = Math.floor(watermarkImage.width * coverScale)
      const scaledWatermarkHeight = Math.floor(watermarkImage.height * coverScale)
      
      // Resize watermark image to cover size
      const scaledWatermark = watermarkImage.clone()
      scaledWatermark.resize(scaledWatermarkWidth, scaledWatermarkHeight)
      
      // Calculate center position (for centering the watermark)
      const offsetX = Math.floor((scaledWatermarkWidth - image.width) / 2)
      const offsetY = Math.floor((scaledWatermarkHeight - image.height) / 2)
      
      // Composite watermark over the entire image
      for (let imgY = 0; imgY < image.height; imgY++) {
        for (let imgX = 0; imgX < image.width; imgX++) {
          // Calculate corresponding position in scaled watermark
          const watermarkX = imgX + offsetX
          const watermarkY = imgY + offsetY
          
          // Skip if outside watermark bounds
          if (watermarkX < 0 || watermarkX >= scaledWatermarkWidth || 
              watermarkY < 0 || watermarkY >= scaledWatermarkHeight) {
            continue
          }
          
          // Get watermark pixel
          let watermarkR: number, watermarkG: number, watermarkB: number, watermarkA: number
          try {
            const watermarkColor = scaledWatermark.getPixelAt(watermarkX + 1, watermarkY + 1)
            watermarkR = watermarkColor & 0xFF
            watermarkG = (watermarkColor >> 8) & 0xFF
            watermarkB = (watermarkColor >> 16) & 0xFF
            watermarkA = ((watermarkColor >> 24) & 0xFF) / 255.0
          } catch {
            const pixelIndex = (watermarkY * scaledWatermarkWidth + watermarkX) * 4
            if (pixelIndex + 3 >= scaledWatermark.bitmap.length) continue
            watermarkR = scaledWatermark.bitmap[pixelIndex]
            watermarkG = scaledWatermark.bitmap[pixelIndex + 1]
            watermarkB = scaledWatermark.bitmap[pixelIndex + 2]
            watermarkA = scaledWatermark.bitmap[pixelIndex + 3] / 255.0
          }
          
          // Skip transparent pixels
          if (watermarkA < 0.01) continue
          
          // Get current image pixel
          let currentR: number, currentG: number, currentB: number
          try {
            const currentColor = image.getPixelAt(imgX + 1, imgY + 1)
            currentR = currentColor & 0xFF
            currentG = (currentColor >> 8) & 0xFF
            currentB = (currentColor >> 16) & 0xFF
          } catch {
            const pixelIndex = (imgY * image.width + imgX) * 4
            if (pixelIndex + 3 >= image.bitmap.length) continue
            currentR = image.bitmap[pixelIndex]
            currentG = image.bitmap[pixelIndex + 1]
            currentB = image.bitmap[pixelIndex + 2]
          }
          
          // Alpha blend with watermark opacity
          // Final alpha = watermarkAlpha * watermarkOpacity
          const finalAlpha = watermarkA * watermarkOpacity
          const newR = Math.floor(watermarkR * finalAlpha + currentR * (1 - finalAlpha))
          const newG = Math.floor(watermarkG * finalAlpha + currentG * (1 - finalAlpha))
          const newB = Math.floor(watermarkB * finalAlpha + currentB * (1 - finalAlpha))
          
          // Set pixel
          const newColor = (0xFF << 24) | (newB << 16) | (newG << 8) | newR
          try {
            image.setPixelAt(imgX + 1, imgY + 1, newColor)
          } catch {
            const pixelIndex = (imgY * image.width + imgX) * 4
            if (pixelIndex + 3 < image.bitmap.length) {
              image.bitmap[pixelIndex] = newR
              image.bitmap[pixelIndex + 1] = newG
              image.bitmap[pixelIndex + 2] = newB
              image.bitmap[pixelIndex + 3] = 0xFF
            }
          }
        }
      }
      
      console.log(`Cover-style watermark applied: ${scaledWatermarkWidth}x${scaledWatermarkHeight}px watermark over ${image.width}x${image.height}px image, opacity: ${(watermarkOpacity * 100).toFixed(1)}%`)
      
      const encoded = await image.encode()
      console.log('Watermark applied successfully! Encoded image size:', encoded.length, 'bytes')
      
      return new Response(encoded, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } catch (imageError) {
      console.error('Image processing error:', imageError)
      // Fallback: return original image if processing fails
      // In production, log this error and consider using a fallback service
      return new Response(imageBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': fileData.type || 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
  } catch (error) {
    console.error('Watermark function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

