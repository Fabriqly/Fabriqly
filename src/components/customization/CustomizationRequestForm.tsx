'use client';

import { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Product } from '@/types/products';

interface CustomizationRequestFormProps {
  product: Product;
  onSubmit: (data: CustomizationFormData) => Promise<void>;
  onCancel: () => void;
}

export interface CustomizationFormData {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  customizationNotes: string;
  customerDesignFile?: any;
  customerPreviewImage?: any;
}

export function CustomizationRequestForm({ product, onSubmit, onCancel }: CustomizationRequestFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (20MB max for design files)
      if (file.size > 20 * 1024 * 1024) {
        setError('Design file must be less than 20MB');
        return;
      }
      setDesignFile(file);
      setError('');
    }
  };

  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max for preview)
      if (file.size > 5 * 1024 * 1024) {
        setError('Preview image must be less than 5MB');
        return;
      }
      // Validate it's an image
      if (!file.type.startsWith('image/')) {
        setError('Preview must be an image file');
        return;
      }
      setPreviewFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError('');
    }
  };

  const uploadFile = async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/customizations/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      // Validate
      if (!notes.trim()) {
        throw new Error('Please provide customization instructions');
      }

      if (!designFile && !previewFile) {
        throw new Error('Please upload at least a design file or preview image');
      }

      // Upload files
      let designFileData = null;
      let previewFileData = null;

      if (designFile) {
        designFileData = await uploadFile(designFile, 'customer_design');
      }

      if (previewFile) {
        previewFileData = await uploadFile(previewFile, 'preview');
      }

      // Submit request
      await onSubmit({
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || undefined,
        quantity,
        customizationNotes: notes,
        customerDesignFile: designFileData,
        customerPreviewImage: previewFileData
      });

    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Request Custom Design</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Product Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          {product.images?.[0] && (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-20 h-20 object-cover rounded"
            />
          )}
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-gray-600">Base Price: ${product.price}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Customization Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customization Instructions <span className="text-red-500">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe your design requirements, preferred colors, text, sizes, placement, etc."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Design File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Design File (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Upload your design file (AI, PSD, PDF, PNG, JPG, SVG - Max 20MB)
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
            <label className="flex flex-col items-center cursor-pointer">
              <FileText className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {designFile ? designFile.name : 'Click to upload design file'}
              </span>
              <input
                type="file"
                onChange={handleDesignFileChange}
                accept=".ai,.psd,.pdf,.png,.jpg,.jpeg,.svg"
                className="hidden"
              />
            </label>
          </div>
          {designFile && (
            <div className="mt-2 flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm text-green-700">✓ {designFile.name}</span>
              <button
                type="button"
                onClick={() => setDesignFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Preview Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview Image (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Upload a mockup or preview of how you want it to look (Max 5MB)
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
            <label className="flex flex-col items-center cursor-pointer">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {previewFile ? previewFile.name : 'Click to upload preview image'}
              </span>
              <input
                type="file"
                onChange={handlePreviewFileChange}
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>
          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewFile(null);
                  setPreviewUrl('');
                }}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Remove preview
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

