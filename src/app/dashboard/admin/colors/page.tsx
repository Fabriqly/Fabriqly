'use client';

import { AdminLayout } from '@/components/admin';
import { ColorManagement } from '@/components/admin/ColorManagement';

export default function AdminColorsPage() {
  return (
    <AdminLayout>
      <ColorManagement 
        onColorChange={() => {
          // Optional: Add any additional logic when colors change
          console.log('Colors updated');
        }}
      />
    </AdminLayout>
  );
}