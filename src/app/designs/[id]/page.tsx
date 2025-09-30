'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DesignWithDetails } from '@/types/enhanced-products';
import { DesignDetail } from '@/components/designs/DesignDetail';
import { Button } from '@/components/ui/Button';
import { 
  Download, 
  Heart, 
  Share2, 
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [design, setDesign] = useState<DesignWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadDesign();
    }
  }, [params.id]);

  const loadDesign = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/designs/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load design');
      }

      setDesign(data.design);
    } catch (error: any) {
      console.error('Error loading design:', error);
      setError(error.message || 'Failed to load design');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (designId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setDownloading(true);
      
      const response = await fetch(`/api/designs/${designId}/download`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const data = await response.json();
      
      // Create download link
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `${data.designName}.${design?.fileFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      alert('Design downloaded successfully!');
      
    } catch (error: any) {
      console.error('Download error:', error);
      alert(error.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleLike = async (designId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/designs/${designId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Like failed');
      }

      setIsLiked(!isLiked);
      
      // Update design likes count
      if (design) {
        setDesign({
          ...design,
          likesCount: isLiked ? design.likesCount - 1 : design.likesCount + 1
        });
      }
      
    } catch (error: any) {
      console.error('Like error:', error);
      alert(error.message || 'Like failed');
    }
  };

  const handleShare = async (designId: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: design?.designName,
          text: design?.description,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Design Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Design Not Found</h1>
          <p className="text-gray-600 mb-8">The design you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DesignDetail
      design={design}
      onDownload={handleDownload}
      onLike={handleLike}
      onShare={handleShare}
      isLiked={isLiked}
      showNavigation={true}
    />
  );
}
