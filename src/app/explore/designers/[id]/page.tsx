'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DesignerProfileDisplay } from '@/components/designer/DesignerProfileDisplay';
import { DesignerProfile } from '@/types/enhanced-products';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DesignerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { user } = useAuth();
  const [designer, setDesigner] = useState<DesignerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const designerId = params.id as string;

  useEffect(() => {
    if (designerId) {
      fetchDesigner();
    }
  }, [designerId]);

  const fetchDesigner = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/designer-profiles/${designerId}`);
      const data = await response.json();

      if (data.profile) {
        setDesigner(data.profile);
      } else {
        setError(data.error || 'Designer not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load designer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/designer-profile`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading designer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Designer Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The designer you are looking for does not exist.'}</p>
            <a
              href="/explore/designers"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse All Designers
            </a>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = session && (session.user as any)?.id === designer.userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader user={user} />
      <div className="container mx-auto px-4 py-8">
        <DesignerProfileDisplay 
          profile={designer} 
          showActions={canEdit} 
          onEdit={canEdit ? handleEdit : undefined}
        />
      </div>
    </div>
  );
}

