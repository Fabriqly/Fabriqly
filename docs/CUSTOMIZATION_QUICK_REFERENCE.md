# Customization System - Quick Reference

## 🚀 Quick Start

### For Customers

1. **Find a customizable product**
   ```
   Look for products with "Customizable" badge
   ```

2. **Click "Customize This Product"**
   ```
   Redirects to /products/{id}/customize
   ```

3. **Fill out the form**
   - Enter quantity
   - Add instructions
   - Upload design file (optional)
   - Upload preview image (optional)

4. **Submit and track**
   - View status at `/dashboard/customizations`
   - Get notified when designer completes work
   - Review and approve/reject

### For Designers

1. **View pending requests**
   ```
   Go to /dashboard/customizations
   ```

2. **Claim a request**
   - Review requirements
   - Click "Claim Request"

3. **Work on design**
   - Download customer files
   - Create in Photoshop/Illustrator
   - Export final files

4. **Upload final work**
   - Click "View Details" on your active request
   - Upload design file (AI, PSD, PDF, etc.)
   - Upload preview image (required)
   - Add notes
   - Submit for customer review

## 📁 File Requirements

### Design Files
- **Types**: .ai, .psd, .pdf, .png, .jpg, .svg
- **Max Size**: 20MB
- **Purpose**: Source files for printing/production

### Preview Images
- **Types**: Any image format
- **Max Size**: 5MB
- **Purpose**: Visual preview for customer

## 🔗 Key URLs

- **Dashboard**: `/dashboard/customizations`
- **Customize Product**: `/products/{id}/customize`
- **API Base**: `/api/customizations`

## 📡 API Quick Reference

### Get Requests
```typescript
GET /api/customizations?customerId={id}&status={status}
```

### Create Request
```typescript
POST /api/customizations
Body: {
  productId, productName, quantity,
  customizationNotes, customerDesignFile, customerPreviewImage
}
```

### Update Request
```typescript
PATCH /api/customizations/{id}
Body: { action: 'assign' | 'uploadFinal' | 'approve' | 'reject' | 'cancel' }
```

### Upload File
```typescript
POST /api/customizations/upload
FormData: { file, type: 'customer_design' | 'designer_final' | 'preview' }
```

## 🎨 Adding Customize Button to Product Pages

```tsx
import { CustomizeButton } from '@/components/customization/CustomizeButton';

// In your product page component:
<CustomizeButton 
  productId={product.id}
  isCustomizable={product.isCustomizable}
  variant="primary"
/>
```

## 🔔 Notification Events

- `customization.request.created` - New request submitted
- `customization.designer.assigned` - Designer claimed request
- `customization.design.completed` - Designer uploaded work
- `customization.design.approved` - Customer approved
- `customization.design.rejected` - Customer requested revision
- `customization.request.cancelled` - Request cancelled

## 🎯 Status Flow

```
pending_designer_review
         ↓
    in_progress
         ↓
awaiting_customer_approval
         ↓
   approved/rejected
         ↓
     completed
```

## 🔐 Authorization

- **Customers**: Own requests only
- **Designers**: Pending + assigned requests
- **Admins**: All requests

## 💡 Tips

### For Customers
- Provide detailed instructions
- Upload reference images
- Be specific about colors, sizes, placement
- Review designer work carefully

### For Designers
- Read all instructions carefully
- Download customer files before starting
- Upload high-quality preview images
- Add notes explaining your design choices
- Respond to rejection feedback promptly

## 🐛 Troubleshooting

### File Upload Fails
- Check file size (20MB max for designs, 5MB for previews)
- Verify file type is supported
- Try a different browser

### Request Not Showing
- Refresh the page
- Check filters
- Verify authentication

### Can't Claim Request
- Another designer may have claimed it
- Refresh to see updated list

## 📊 Statistics

Access your stats:
```typescript
GET /api/customizations/stats?customerId={id}
GET /api/customizations/stats?designerId={id}
```

Returns:
- Total requests
- By status counts
- Completed count
- Active count

## 🔧 Developer Notes

### Database Schema
```typescript
Collection: customizationRequests
Fields: See src/types/customization.ts
```

### Service Architecture
```
Component → API Route → Service → Repository → Firestore
```

### Adding to Navigation

Add to your dashboard navigation:
```tsx
{
  name: 'Customizations',
  href: '/dashboard/customizations',
  icon: Paintbrush,
  roles: ['customer', 'designer', 'business_owner', 'admin']
}
```

## 📞 Support

For implementation help, see full documentation at:
`docs/CUSTOMIZATION_SYSTEM.md`

