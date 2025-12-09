# Watermark System Setup Guide

## Overview

The watermark system protects designer IP by applying watermarks server-side to images. When users download images, they receive watermarked versions. Only users who have purchased the product/design can access clean, high-quality originals.

## Architecture

- **Private Buckets**: Store original images (not publicly accessible)
- **Edge Function**: Applies watermark server-side before serving images
- **Signed URLs**: Time-limited access for purchased content
- **Purchase Verification**: Checks orders to determine if user has purchased

## Setup Steps

### 1. Create Private Buckets in Supabase

1. Go to Supabase Dashboard → Storage
2. Create two new buckets:
   - `products-private` (set to **Private**)
   - `designs-private` (set to **Private**)

3. Configure bucket policies (via SQL Editor):

```sql
-- Allow service role to read/write
-- This is handled automatically by Supabase service role

-- Deny public read access (bucket should be Private)
-- This is set when creating the bucket
```

### 2. Deploy Edge Function

1. Install Supabase CLI (if not already installed):
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy the watermark function:
```bash
supabase functions deploy watermark
```

5. Set environment variables for the function:
```bash
supabase secrets set WATERMARK_TEXT="Fabriqly"
supabase secrets set WATERMARK_OPACITY="0.4"
```

### 3. Environment Variables

Add to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Project Reference (extracted from URL)
NEXT_PUBLIC_SUPABASE_PROJECT_REF=your-project-ref
```

### 4. Migration Strategy

#### Phase 1: New Uploads Only
- New product/design images automatically upload to private buckets
- Existing images continue to work (backward compatibility)
- WatermarkedImage component checks for `storagePath` and `storageBucket`
- If present, uses watermarking; otherwise uses regular image

#### Phase 2: Gradual Migration (Optional)
- Migrate existing images to private buckets
- Update database records with `storagePath` and `storageBucket`
- All images will then use watermarking

## Usage

### In Components

Replace `<img>` tags with `<WatermarkedImage>`:

```tsx
import { WatermarkedImage } from '@/components/ui/WatermarkedImage'

<WatermarkedImage
  storagePath="products/123/image.jpg"
  storageBucket="products-private"
  productId={product.id}
  alt="Product image"
  className="..."
  fallbackSrc={product.imageUrl} // Fallback if watermarking fails
/>
```

### Purchase Verification

The component automatically:
1. Checks if user is authenticated
2. Verifies purchase via `PurchaseService`
3. Shows clean image (signed URL) if purchased
4. Shows watermarked image (Edge Function) if not purchased

### Download Endpoint

Users can download original files via:
```
GET /api/download/product/{productId}
GET /api/download/design/{designId}
```

This endpoint:
- Verifies purchase
- Generates signed URL (1 hour expiry)
- Returns download URL

## Testing

### Test Watermark Function Locally

```bash
# Start Supabase locally
supabase start

# Test the function
curl "http://localhost:54321/functions/v1/watermark?path=test/image.jpg&bucket=products-private"
```

### Test Purchase Verification

1. Create a test order with `paymentStatus: 'paid'`
2. View product as the customer
3. Verify clean image is shown
4. View as different user
5. Verify watermarked image is shown

## Troubleshooting

### Images Not Watermarking

1. Check that `storagePath` and `storageBucket` are stored in database
2. Verify Edge Function is deployed
3. Check Edge Function logs in Supabase Dashboard
4. Verify `NEXT_PUBLIC_SUPABASE_PROJECT_REF` is set correctly

### Signed URLs Not Working

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
2. Check bucket permissions
3. Verify file exists in bucket

### Purchase Verification Failing

1. Check order has `paymentStatus: 'paid'`
2. Verify order `status` is not 'cancelled'
3. Check `items` array contains the productId/designId
4. Verify cache is not stale (5 minute TTL)

## Security Considerations

- **Private Buckets**: Original images never publicly accessible
- **Signed URLs**: Time-limited (1 hour) for purchased content
- **Edge Function**: Server-side watermarking prevents client-side bypass
- **Purchase Verification**: Always verified server-side
- **Error Handling**: Fails securely (shows watermarked version)

## Performance

- **Edge Function Caching**: Consider caching watermarked images
- **Signed URL Caching**: Cache client-side (respect expiry)
- **Purchase Verification**: Cached for 5 minutes to reduce DB queries
- **Image Optimization**: Edge Function can also resize/optimize images

## Future Enhancements

1. **Better Text Rendering**: Add font file to Edge Function for proper text watermarking
2. **Logo Watermarking**: Support image-based watermarks (logo overlay)
3. **Multiple Positions**: Support different watermark positions (center, corner, etc.)
4. **Watermark Customization**: Allow shops/designers to customize watermark text
5. **Batch Processing**: Pre-generate watermarked versions for common sizes





