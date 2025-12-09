'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Send, X } from 'lucide-react';

interface ReviewReplyFormProps {
  reviewId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialComment?: string;
}

export function ReviewReplyForm({
  reviewId,
  onSuccess,
  onCancel,
  initialComment = ''
}: ReviewReplyFormProps) {
  const [comment, setComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!comment.trim()) {
      setError('Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reply: {
            comment: comment.trim()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      setError('Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Write a reply..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={submitting || !comment.trim()}
          size="sm"
        >
          <Send className="w-4 h-4 mr-1" />
          {submitting ? 'Submitting...' : 'Reply'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

