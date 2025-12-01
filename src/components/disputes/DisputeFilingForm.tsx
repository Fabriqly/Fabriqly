'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DisputeCategory } from '@/types/dispute';

interface DisputeFilingFormProps {
  orderId?: string;
  customizationRequestId?: string;
  onSuccess: (disputeId: string) => void;
  onCancel: () => void;
}

const DISPUTE_CATEGORIES: Record<DisputeCategory, { label: string; description: string; phase: 'design' | 'shipping' }> = {
  // Design Phase
  design_ghosting: {
    label: 'Designer Not Responding',
    description: 'Designer has stopped responding to messages',
    phase: 'design'
  },
  design_quality_mismatch: {
    label: 'Poor Design Quality',
    description: 'Final design does not meet requirements or expectations',
    phase: 'design'
  },
  design_copyright_infringement: {
    label: 'Copyright Infringement',
    description: 'Design contains copyrighted material without permission',
    phase: 'design'
  },
  // Shipping Phase
  shipping_not_received: {
    label: 'Item Not Received',
    description: 'Order was not delivered',
    phase: 'shipping'
  },
  shipping_damaged: {
    label: 'Item Damaged',
    description: 'Product arrived damaged or defective',
    phase: 'shipping'
  },
  shipping_wrong_item: {
    label: 'Wrong Item',
    description: 'Received different product than ordered',
    phase: 'shipping'
  },
  shipping_print_quality: {
    label: 'Poor Print Quality',
    description: 'Print quality is below acceptable standards',
    phase: 'shipping'
  },
  shipping_late_delivery: {
    label: 'Late Delivery',
    description: 'Order arrived after promised delivery date',
    phase: 'shipping'
  },
  shipping_incomplete_order: {
    label: 'Incomplete Order',
    description: 'Received fewer items than ordered',
    phase: 'shipping'
  }
};

export function DisputeFilingForm({
  orderId,
  customizationRequestId,
  onSuccess,
  onCancel
}: DisputeFilingFormProps) {
  const [category, setCategory] = useState<DisputeCategory | ''>('');
  const [description, setDescription] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);
  const [evidenceVideo, setEvidenceVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  // Filter categories based on order vs customization
  const availableCategories = Object.entries(DISPUTE_CATEGORIES).filter(([key, value]) => {
    if (customizationRequestId) {
      return value.phase === 'design';
    } else if (orderId) {
      return value.phase === 'shipping';
    }
    return true;
  }) as [DisputeCategory, typeof DISPUTE_CATEGORIES[DisputeCategory]][];

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    newFiles.forEach(file => {
      if (!file.type.startsWith('image/') || !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPG, PNG, and WEBP are allowed.`);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 5MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    const totalImages = evidenceImages.length + validFiles.length;
    if (totalImages > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You have ${evidenceImages.length}, trying to add ${validFiles.length}.`);
      return;
    }

    setEvidenceImages(prev => [...prev, ...validFiles]);
    setError('');
  };

  const handleVideoSelect = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Invalid video file type');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError('Video file too large. Maximum size is 50MB.');
      return;
    }

    setEvidenceVideo(file);
    setError('');
  };

  const removeImage = (index: number) => {
    setEvidenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setEvidenceVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('Please select a dispute category');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      if (orderId) formData.append('orderId', orderId);
      if (customizationRequestId) formData.append('customizationRequestId', customizationRequestId);
      formData.append('category', category);
      formData.append('description', description);

      evidenceImages.forEach((file, index) => {
        formData.append('evidenceImages', file);
      });

      if (evidenceVideo) {
        formData.append('evidenceVideo', evidenceVideo);
      }

      const response = await fetch('/api/disputes', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to file dispute');
      }

      onSuccess(data.data.id);
    } catch (err: any) {
      setError(err.message || 'Failed to file dispute');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">File a Dispute</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dispute Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableCategories.map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  category === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{info.label}</div>
                <div className="text-sm text-gray-600 mt-1">{info.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide detailed information about the issue. Include any relevant details that will help resolve the dispute."
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            {description.length} / 2000 characters (minimum 20)
          </p>
        </div>

        {/* Evidence Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence Images (Optional)
            <span className="text-gray-500 font-normal ml-2">
              Max {MAX_IMAGES} images, 5MB each (JPG, PNG, WEBP)
            </span>
          </label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={(e) => handleImageSelect(e.target.files)}
            className="hidden"
          />
          <div className="space-y-2">
            {evidenceImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {evidenceImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
            {evidenceImages.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center"
              >
                <ImageIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Add Images ({evidenceImages.length}/{MAX_IMAGES})</span>
              </button>
            )}
          </div>
        </div>

        {/* Evidence Video */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence Video (Optional)
            <span className="text-gray-500 font-normal ml-2">
              Max 1 video, 50MB, 30-60 seconds
            </span>
          </label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleVideoSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
          {evidenceVideo ? (
            <div className="relative">
              <video
                src={URL.createObjectURL(evidenceVideo)}
                controls
                className="w-full max-h-64 rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-sm text-gray-500 mt-1">{evidenceVideo.name}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center"
            >
              <Video className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-gray-600">Add Video</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={uploading || !category || !description.trim()}
          >
            {uploading ? 'Filing Dispute...' : 'File Dispute'}
          </Button>
        </div>
      </form>
    </div>
  );
}






