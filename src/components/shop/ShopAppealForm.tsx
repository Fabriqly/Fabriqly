'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, MessageSquare } from 'lucide-react';

interface ShopAppealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suspensionReason?: string;
}

export default function ShopAppealForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  suspensionReason 
}: ShopAppealFormProps) {
  const [formData, setFormData] = useState({
    appealReason: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appealReason.trim()) {
      setSubmitMessage({ type: 'error', text: 'Appeal reason is required.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/shop-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit appeal');
      }

      setSubmitMessage({ 
        type: 'success', 
        text: 'Appeal submitted successfully! We will review your appeal within 3-5 business days.' 
      });
      
      // Reset form
      setFormData({
        appealReason: '',
        additionalInfo: ''
      });

      // Close modal after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (error: any) {
      setSubmitMessage({ 
        type: 'error', 
        text: error.message || 'An error occurred while submitting your appeal. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Submit Appeal</h2>
                <p className="text-gray-600">Request review of your shop suspension</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Suspension Reason */}
          {suspensionReason && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">Suspension Reason</h3>
                  <p className="text-sm text-red-700">{suspensionReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Message */}
          {submitMessage && (
            <div className={`mb-6 p-4 rounded-lg ${
              submitMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {submitMessage.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appeal Reason */}
            <div>
              <label htmlFor="appealReason" className="block text-sm font-medium text-gray-700 mb-2">
                Appeal Reason *
              </label>
              <textarea
                id="appealReason"
                value={formData.appealReason}
                onChange={(e) => setFormData(prev => ({ ...prev, appealReason: e.target.value }))}
                placeholder="Please explain why you believe your shop should be restored. Include any relevant information that may help with the review process..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Be specific and provide any relevant context or evidence that supports your appeal.
              </p>
            </div>

            {/* Additional Information */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Any additional information, documents, or context that may be relevant to your appeal..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
              </Button>
            </div>
          </form>

          {/* Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">What Happens Next?</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Our team will review your appeal and the original suspension reason</li>
              <li>2. We may reach out for additional information if needed</li>
              <li>3. You'll receive an email notification once the appeal is reviewed</li>
              <li>4. If approved, your shop will be restored and you can continue selling</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
