'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PayoutManagement } from '@/components/admin/PayoutManagement';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function PayoutsContent() {
  return (
    <AdminLayout>
      <div className="p-6">
        <PayoutManagement />
      </div>
    </AdminLayout>
  );
}

export default function AdminPayoutsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <PayoutsContent />
    </ProtectedRoute>
  );
}

