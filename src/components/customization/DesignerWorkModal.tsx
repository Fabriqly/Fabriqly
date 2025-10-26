'use client';

import { useState } from 'react';
import { X, Upload, FileText, Image as ImageIcon, Loader, Send } from 'lucide-react';
import { CustomizationRequestWithDetails } from '@/types/customization';

interface DesignerWorkModalProps {
  request: CustomizationRequestWithDetails;
  onClose: () => void;
  onSubmit: (finalFile: any, previewImage: any, notes: string) => Promise<void>;
}

export function DesignerWorkModal({ request, onClose, onSubmit }: DesignerWorkModalProps) {
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    
    // Handle Firestore Timestamp object
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    // Handle Firestore Timestamp serialized as object with seconds
    else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    // Handle ISO string or timestamp number
    else {
      date = new Date(timestamp);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleFinalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('Final design file must be less than 20MB');
        return;
      }
      setFinalFile(file);
      setError('');
    }
  };

  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Preview image must be less than 5MB');
        return;
      }
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
      if (!finalFile) {
        throw new Error('Please upload the final design file');
      }

      if (!previewFile) {
        throw new Error('Please upload a preview image');
      }

      // Upload files
      const [finalFileData, previewFileData] = await Promise.all([
        uploadFile(finalFile, 'designer_final'),
        uploadFile(previewFile, 'preview')
      ]);

      // Submit to backend
      await onSubmit(finalFileData, previewFileData, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit work');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Upload Final Design</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Request Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Request Details</h3>
            <div className="flex items-start gap-4">
              {request.productImage && (
                <img 
                  src={request.productImage} 
                  alt={request.productName}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div>
                <p className="font-medium">{request.productName}</p>
                <p className="text-sm text-gray-600">Customer: {request.customerName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Requested: {formatDate(request.requestedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Customer Instructions</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{request.customizationNotes}</p>
          </div>

          {/* Customer Files Reference */}
          {(request.customerDesignFile || request.customerPreviewImage) && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Customer Files</h3>
              <div className="grid gap-2">
                {request.customerDesignFile && (
                  <a
                    href={request.customerDesignFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    📎 {request.customerDesignFile.fileName}
                  </a>
                )}
                {request.customerPreviewImage && (
                  <a
                    href={request.customerPreviewImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    🖼️ View Customer Preview
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Rejection Feedback (if any) */}
          {request.rejectionReason && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">
                ⚠️ Revision Requested
              </h3>
              <p className="text-yellow-800">{request.rejectionReason}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Final Design File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Design File <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Upload the final design file (AI, PSD, PDF, PNG, JPG, SVG - Max 20MB)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <label className="flex flex-col items-center cursor-pointer">
                  <FileText className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {finalFile ? finalFile.name : 'Click to upload final design'}
                  </span>
                  <input
                    type="file"
                    onChange={handleFinalFileChange}
                    accept=".ai,.psd,.pdf,.png,.jpg,.jpeg,.svg"
                    className="hidden"
                  />
                </label>
              </div>
              {finalFile && (
                <div className="mt-2 flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm text-green-700">✓ {finalFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setFinalFile(null)}
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
                Preview Image <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Upload a preview/mockup image of the final design (Max 5MB)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
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

            {/* Designer Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes for Customer (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or instructions for the customer..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !finalFile || !previewFile}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit to Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

