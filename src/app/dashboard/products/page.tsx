'use client';

import { ProductList } from '@/components/products/ProductList';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Palette, Plus, RefreshCw, Download } from 'lucide-react';


export default function BusinessProductsPage() {
  const { user, isLoading } = useAuth(true);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    // Export functionality - you can implement this based on your needs
    console.log('Export products');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader user={user} />

      <div className="flex flex-1">
        {/* Dashboard Sidebar */}
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <div className="flex-1">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            {/* Page Header with Manage Colors Button */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                  <p className="text-gray-600">Manage your products and colors</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/dashboard/products/colors'}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Manage Colors
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/dashboard/products/create'}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>
            </div>

            {/* Products List */}
            <ProductList 
              businessOwnerId={user?.id}
              showCreateButton={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

