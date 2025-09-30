'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FeaturedDesignsManagement } from '@/components/admin/FeaturedDesignsManagement';

export default function AdminFeaturedDesignsPage() {
  return (
    <AdminLayout>
      <FeaturedDesignsManagement />
    </AdminLayout>
  );
}
