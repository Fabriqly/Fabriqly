# Shop Profile Image Upload - Setup Guide

## Overview

Shop profiles now support direct image uploads for logos, banners, and thumbnails. Images are stored in Supabase Storage and automatically made publicly accessible.

## Features

✅ Direct file upload (no URL needed)
✅ Real-time image preview
✅ Automatic upload to Supabase
✅ File validation (type & size)
✅ Progress indicators
✅ Image management

## Setup Instructions

### 1. Create Supabase Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard
   - Go to **Storage** section

2. **Create New Bucket**
   - Click **"New bucket"**
   - Bucket name: `shop-profiles`
   - Set as **Public bucket** ✅ (important!)
   - Click **"Create bucket"**

3. **Configure Bucket Policies**
   - Click on the `shop-profiles` bucket
   - Go to **"Policies"** tab
   - Add the following policies:

#### Policy 1: Public Read Access
```sql
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-profiles');
```

#### Policy 2: Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-profiles');
```

#### Policy 3: Owner Can Update
```sql
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Policy 4: Owner Can Delete
```sql
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 2. Verify Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Test the Setup

1. **Create a test shop profile**
   - Go to `/shops/create`
   - Upload a logo image
   - Check if preview appears
   - Submit the form

2. **Verify in Supabase**
   - Go to Storage > shop-profiles
   - Check if image was uploaded
   - Verify folder structure: `shop-images/{userId}/{filename}`

3. **Check public access**
   - Copy the image URL from Firestore
   - Open in incognito/private browser
   - Image should load without authentication

## File Structure in Supabase

```
shop-profiles/
└── shop-images/
    └── {userId}/
        ├── {userId}_logo_{timestamp}.jpg
        ├── {userId}_banner_{timestamp}.png
        └── {userId}_thumbnail_{timestamp}.webp
```

## Usage

### For Shop Owners

1. **Upload Logo**
   - Click "Choose File" under "Shop Logo"
   - Select image (PNG, JPG, WebP, GIF)
   - Max size: 5MB
   - Preview appears immediately
   - Image auto-uploads

2. **Upload Banner**
   - Recommended size: 1200x400px
   - Same process as logo
   - Preview shows full width

3. **Upload Thumbnail (Optional)**
   - Square image recommended
   - Used in shop cards/listings

### File Requirements

| Image Type | Max Size | Recommended Size | Format |
|------------|----------|------------------|--------|
| Logo | 5MB | 200x200px | PNG (transparent) |
| Banner | 5MB | 1200x400px | JPG/PNG |
| Thumbnail | 5MB | 300x300px | JPG/PNG |

## API Endpoint

### POST /api/upload/shop-images

Upload a shop image to Supabase.

**Request:**
```typescript
// FormData
{
  file: File,
  type: 'logo' | 'banner' | 'thumbnail'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://your-project.supabase.co/storage/v1/object/public/shop-profiles/shop-images/user123/user123_logo_1234567890.jpg",
    "path": "shop-images/user123/user123_logo_1234567890.jpg",
    "fileName": "user123_logo_1234567890.jpg",
    "type": "logo"
  },
  "message": "Image uploaded successfully"
}
```

**Errors:**
- 400: Invalid file type, file too large, or missing file
- 401: Not authenticated
- 500: Upload failed

### DELETE /api/upload/shop-images

Delete a shop image from Supabase.

**Request:**
```json
{
  "filePath": "shop-images/user123/user123_logo_1234567890.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Troubleshooting

### Issue: Upload fails with "Upload failed: new row violates row-level security policy"

**Solution:**
- Check bucket policies are correctly set
- Ensure bucket is set as Public
- Verify user is authenticated

### Issue: Image uploads but doesn't display

**Solution:**
- Check if bucket is public
- Verify URL is correct
- Check browser console for CORS errors

### Issue: "File too large" error

**Solution:**
- Check file size (must be < 5MB)
- Compress image before upload
- Use image optimization tools

### Issue: Wrong file type error

**Solution:**
- Ensure file is an image (JPG, PNG, WebP, GIF)
- Check file extension matches content type

## Best Practices

### For Developers

1. **Always validate files** before upload
2. **Use unique filenames** to avoid conflicts
3. **Implement cleanup** for old/unused images
4. **Monitor storage usage** in Supabase dashboard
5. **Set up backup policies** for important images

### For Shop Owners

1. **Use high-quality images** (but compressed)
2. **Logo should be transparent PNG** for best results
3. **Banner should be landscape** orientation
4. **Test images in different devices** before finalizing
5. **Keep originals** in case you need to re-upload

## Storage Optimization

### Automatic Image Optimization (Optional Enhancement)

Consider adding image optimization before upload:

```typescript
// Example using browser's Canvas API
const optimizeImage = async (file: File): Promise<Blob> => {
  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Resize if needed
  const maxWidth = 1200;
  const scale = Math.min(1, maxWidth / img.width);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
  });
};
```

## Security Notes

1. **File Validation**
   - ✅ File type checked on server
   - ✅ File size limited to 5MB
   - ✅ User authentication required

2. **Storage Security**
   - ✅ Files organized by user ID
   - ✅ Public read access only
   - ✅ Write/delete restricted to owners

3. **Malware Protection**
   - Consider adding virus scanning
   - Validate image headers
   - Use Content-Type validation

## Cost Considerations

### Supabase Storage Pricing

- **Free Tier**: 1GB storage
- **Pro**: 100GB included ($25/month)
- **Additional**: $0.021/GB/month

### Estimated Usage

| Usage Level | Shops | Avg Images | Total Size | Monthly Cost |
|-------------|-------|------------|------------|--------------|
| Small | 100 | 3 x 500KB | ~150MB | Free |
| Medium | 1,000 | 3 x 500KB | ~1.5GB | $0.03 |
| Large | 10,000 | 3 x 500KB | ~15GB | $0.30 |

## Migration from URLs

If you have existing shops with URL-based images:

1. **No migration needed** - URLs still work
2. **Optional**: Migrate to Supabase for consistency
3. **Both systems** can coexist

## Future Enhancements

Potential improvements:

- [ ] Image cropping tool
- [ ] Multiple image formats/sizes
- [ ] CDN integration
- [ ] Image optimization pipeline
- [ ] Batch upload
- [ ] Image templates
- [ ] AI-powered image enhancement
- [ ] Automatic background removal for logos

## Support

For issues or questions:
1. Check Supabase Storage logs
2. Review browser console errors
3. Verify bucket policies
4. Check authentication status
5. Review this documentation

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0

