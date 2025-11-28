'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface FileDisputeButtonProps {
  orderId?: string;
  customizationRequestId?: string;
  variant?: 'default' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function FileDisputeButton({
  orderId,
  customizationRequestId,
  variant = 'outline',
  size = 'md'
}: FileDisputeButtonProps) {
  const [canFile, setCanFile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId || customizationRequestId) {
      checkEligibility();
    }
  }, [orderId, customizationRequestId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/disputes/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customizationRequestId
        })
      });

      const data = await response.json();
      setCanFile(data.data?.canFile || false);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setCanFile(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || canFile === null) {
    return null;
  }

  if (!canFile) {
    return null;
  }

  const href = orderId
    ? `/disputes/file/order/${orderId}`
    : `/disputes/file/customization/${customizationRequestId}`;

  return (
    <Link href={href} className="block w-full">
      <Button variant={variant} size={size} className="w-full">
        <AlertTriangle className="w-4 h-4 mr-2" />
        File Dispute
      </Button>
    </Link>
  );
}






