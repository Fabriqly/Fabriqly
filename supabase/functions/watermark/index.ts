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

    // If download failed, try public bucket as fallback
    if (downloadError || !fileData) {
      console.log(`Download failed from ${bucket}, trying public bucket fallback...`)
      
      // Try public bucket if we were using private bucket
      const publicBucket = bucket.endsWith('-private') 
        ? bucket.replace('-private', '') 
        : null
      
      if (publicBucket && publicBucket !== bucket) {
        // Try downloading from public bucket with same path
        console.log(`Attempting download from public bucket: ${publicBucket}, path: ${normalizedPath}`)
        const { data: publicFileData, error: publicError } = await supabase
          .storage
          .from(publicBucket)
          .download(normalizedPath)
        
        if (!publicError && publicFileData) {
          console.log(`Successfully downloaded from public bucket: ${publicBucket}`)
          fileData = publicFileData
          downloadError = null
        } else {
          // Try original path in public bucket
          if (normalizedPath !== originalPath) {
            console.log(`Trying original path in public bucket: ${originalPath}`)
            const { data: publicFileData2, error: publicError2 } = await supabase
              .storage
              .from(publicBucket)
              .download(originalPath)
            
            if (!publicError2 && publicFileData2) {
              console.log(`Successfully downloaded from public bucket with original path`)
              fileData = publicFileData2
              downloadError = null
              normalizedPath = originalPath
            }
          }
        }
      }
      
      // If still failed after trying public bucket, return error
      if (downloadError || !fileData) {
        console.error('Error downloading image from both buckets:', {
          error: downloadError,
          bucket,
          path: imagePath,
          normalizedPath,
          errorMessage: downloadError?.message,
          errorStatus: downloadError?.statusCode,
          errorCode: downloadError?.error,
          fullError: JSON.stringify(downloadError)
        })
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to download image', 
            details: downloadError?.message || downloadError?.error || 'Unknown error',
            bucket,
            path: imagePath,
            normalizedPath,
            triedPublicBucket: !!publicBucket
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Convert blob to array buffer
    console.log('Download successful! File size:', fileData.size, 'bytes')
    const imageBuffer = await fileData.arrayBuffer()
    const imageBytes = new Uint8Array(imageBuffer)
    console.log('Image buffer created, size:', imageBytes.length, 'bytes')

    // Get watermark text from environment or use default
    const watermarkText = Deno.env.get('WATERMARK_TEXT') || 'Fabriqly'
    const watermarkOpacity = parseFloat(Deno.env.get('WATERMARK_OPACITY') || '0.4')

    // For now, we'll use a simple approach with Canvas API
    // Note: Deno doesn't have native Canvas support, so we'll use a library
    // Using a simpler approach: return the image with a note that watermarking
    // should be done client-side or via a proper image processing service
    
    // Use ImageScript for watermarking
    // Note: For production, consider using a more robust image processing library
    // or a service like Cloudinary/ImageKit that has built-in watermarking
    try {
      const { Image } = await import('https://deno.land/x/imagescript@1.2.15/mod.ts')
      
      // Decode the image
      const image = await Image.decode(imageBytes)
      
      // Tiled watermark pattern for better IP protection
      // Instead of single overlay, tile watermark across entire image
      // Use lower opacity (10-15%) as per best practices for digital art protection
      const tileOpacity = 0x1A / 255.0 // ~10% opacity (0x1A = 26/255 ≈ 10%)
      
      // Tile dimensions - create repeating pattern
      const tileWidth = Math.max(200, Math.floor(image.width / 4))
      const tileHeight = Math.max(100, Math.floor(image.height / 6))
      
      // Text size for each tile
      const textSize = Math.max(24, Math.min(tileWidth, tileHeight) / 6)
      
      // Helper function to set a pixel with alpha blending
      const setPixelWithBlend = (px: number, py: number, overlayR: number, overlayG: number, overlayB: number, alpha: number) => {
        if (px < 0 || px >= image.width || py < 0 || py >= image.height) return
        
        // Get current pixel color
        let currentR: number, currentG: number, currentB: number
        try {
          const currentColor = image.getPixelAt(px + 1, py + 1) // 1-based
          currentR = currentColor & 0xFF
          currentG = (currentColor >> 8) & 0xFF
          currentB = (currentColor >> 16) & 0xFF
        } catch {
          // Fallback to bitmap access
          const pixelIndex = (py * image.width + px) * 4
          if (pixelIndex + 3 >= image.bitmap.length) return
          currentR = image.bitmap[pixelIndex]
          currentG = image.bitmap[pixelIndex + 1]
          currentB = image.bitmap[pixelIndex + 2]
        }
        
        // Alpha blend: newColor = overlayColor * alpha + currentColor * (1 - alpha)
        const newR = Math.floor(overlayR * alpha + currentR * (1 - alpha))
        const newG = Math.floor(overlayG * alpha + currentG * (1 - alpha))
        const newB = Math.floor(overlayB * alpha + currentB * (1 - alpha))
        
        // Set pixel
        const newColor = (0xFF << 24) | (newB << 16) | (newG << 8) | newR
        try {
          image.setPixelAt(px + 1, py + 1, newColor)
        } catch {
          const pixelIndex = (py * image.width + px) * 4
          if (pixelIndex + 3 < image.bitmap.length) {
            image.bitmap[pixelIndex] = newR
            image.bitmap[pixelIndex + 1] = newG
            image.bitmap[pixelIndex + 2] = newB
            image.bitmap[pixelIndex + 3] = 0xFF
          }
        }
      }
      
      // Helper function to draw text "FABRIQLY" in a tile
      const drawTextInTile = (startX: number, startY: number, tileW: number, tileH: number, textSize: number) => {
        const textColor = { r: 255, g: 255, b: 255 } // White
        const strokeWidth = Math.max(2, Math.floor(textSize / 8))
        const charWidth = Math.floor(textSize * 0.5)
        const charHeight = textSize
        const spacing = Math.floor(textSize * 0.15)
        const textX = startX + Math.floor(tileW / 2) - Math.floor((charWidth + spacing) * 4)
        const textY = startY + Math.floor(tileH / 2) - Math.floor(charHeight / 2)
        
        let currentX = textX
        
        // Draw "FABRIQLY" using simple rectangles
        const drawCharRect = (rx: number, ry: number, rw: number, rh: number) => {
          for (let ry2 = ry; ry2 < ry + rh && ry2 < startY + tileH; ry2++) {
            for (let rx2 = rx; rx2 < rx + rw && rx2 < startX + tileW; rx2++) {
              setPixelWithBlend(rx2, ry2, textColor.r, textColor.g, textColor.b, tileOpacity)
            }
          }
        }
        
        // F
        drawCharRect(currentX, textY, strokeWidth, charHeight)
        drawCharRect(currentX, textY, Math.floor(charWidth * 0.7), strokeWidth)
        drawCharRect(currentX, textY + Math.floor(charHeight * 0.45), Math.floor(charWidth * 0.5), strokeWidth)
        currentX += charWidth + spacing
        
        // A
        drawCharRect(currentX + Math.floor(charWidth * 0.2), textY, strokeWidth, charHeight)
        drawCharRect(currentX + Math.floor(charWidth * 0.6), textY, strokeWidth, charHeight)
        drawCharRect(currentX, textY + Math.floor(charHeight * 0.7), charWidth, strokeWidth)
        currentX += charWidth + spacing
        
        // B
        drawCharRect(currentX, textY, strokeWidth, charHeight)
        drawCharRect(currentX, textY, Math.floor(charWidth * 0.7), strokeWidth)
        drawCharRect(currentX, textY + Math.floor(charHeight * 0.65), Math.floor(charWidth * 0.7), strokeWidth)
        currentX += charWidth + spacing
        
        // R
        drawCharRect(currentX, textY, strokeWidth, charHeight)
        drawCharRect(currentX, textY, Math.floor(charWidth * 0.7), strokeWidth)
        drawCharRect(currentX + Math.floor(charWidth * 0.5), textY + Math.floor(charHeight * 0.5), strokeWidth, Math.floor(charHeight * 0.5))
        currentX += charWidth + spacing
        
        // I
        drawCharRect(currentX + Math.floor(charWidth * 0.3), textY, strokeWidth, charHeight)
        currentX += charWidth + spacing
        
        // Q
        drawCharRect(currentX + Math.floor(charWidth * 0.1), textY, Math.floor(charWidth * 0.8), strokeWidth)
        drawCharRect(currentX + Math.floor(charWidth * 0.1), textY + Math.floor(charHeight * 0.85), Math.floor(charWidth * 0.8), strokeWidth)
        drawCharRect(currentX, textY + Math.floor(charHeight * 0.1), strokeWidth, Math.floor(charHeight * 0.8))
        drawCharRect(currentX + Math.floor(charWidth * 0.8), textY + Math.floor(charHeight * 0.1), strokeWidth, Math.floor(charHeight * 0.8))
        drawCharRect(currentX + Math.floor(charWidth * 0.7), textY + Math.floor(charHeight * 0.7), Math.floor(charWidth * 0.3), strokeWidth)
        currentX += charWidth + spacing
        
        // L
        drawCharRect(currentX, textY, strokeWidth, charHeight)
        drawCharRect(currentX, textY + Math.floor(charHeight * 0.85), charWidth, strokeWidth)
        currentX += charWidth + spacing
        
        // Y
        drawCharRect(currentX + Math.floor(charWidth * 0.3), textY, strokeWidth, Math.floor(charHeight * 0.6))
        drawCharRect(currentX, textY + Math.floor(charHeight * 0.5), Math.floor(charWidth * 0.7), strokeWidth)
        drawCharRect(currentX + Math.floor(charWidth * 0.5), textY + Math.floor(charHeight * 0.6), strokeWidth, Math.floor(charHeight * 0.4))
      }
      
      // Tile the watermark across the entire image
      // Create repeating pattern that covers the whole image
      for (let tileY = 0; tileY < image.height; tileY += tileHeight) {
        for (let tileX = 0; tileX < image.width; tileX += tileWidth) {
          // Draw "FABRIQLY" text in each tile
          drawTextInTile(tileX, tileY, tileWidth, tileHeight, textSize)
        }
      }
      
      console.log(`Tiled watermark applied across entire image: ${Math.ceil(image.width / tileWidth)}x${Math.ceil(image.height / tileHeight)} tiles, opacity: 10%`)
      
      // Text watermark is now integrated into the tiled pattern above
      // No separate text watermark needed - it's part of each tile
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

