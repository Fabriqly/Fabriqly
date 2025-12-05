'use client';

import { ProductList } from '@/components/products/ProductList';
import { DashboardHeader, DashboardSidebar } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Palette, Plus, RefreshCw, Download } from 'lucide-react';
import { useRef, useCallback, useState } from 'react';


export default function BusinessProductsPage() {
  const { user, isLoading } = useAuth(true);
  const refreshProductsRef = useRef<(() => void) | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  const handleRefresh = useCallback(() => {
    if (refreshProductsRef.current) {
      refreshProductsRef.current();
    }
  }, []);

  const handleProductCountChange = useCallback((count: number, draftCount: number) => {
    setProductCount(count);
    setDraftCount(draftCount);
  }, []);

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
        <div className="flex-1 pt-20 overflow-y-auto bg-gray-50 lg:ml-64">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            {/* Page Header */}
            <div className="mb-6">
              {/* Title Section with Products Counter */}
              <div className="flex items-start justify-between mb-4 md:mb-0">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                  <p className="text-gray-600">Manage your products and colors</p>
                </div>
                {/* Products Counter - Right side, aligned with header */}
                <div className="hidden md:block text-right">
                  <div className="text-sm text-gray-600">
                    {productCount} products
                    {draftCount > 0 && (
                      <span className="ml-2 text-orange-600">
                        ({draftCount} draft{draftCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Stack on mobile, horizontal on desktop */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center flex-1 md:flex-initial"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="ml-2 md:hidden">Refresh</span>
                  </Button>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center flex-1 md:flex-initial"
                  >
                    <Download className="w-4 h-4" />
                    <span className="ml-2">Export</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <Button
                    onClick={() => window.location.href = '/dashboard/products/colors'}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center flex-1 md:flex-initial"
                  >
                    <Palette className="w-4 h-4" />
                    <span className="ml-2">Manage Colors</span>
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/dashboard/products/create'}
                    size="sm"
                    className="flex items-center justify-center flex-1 md:flex-initial"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-2">Add Product</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Products List */}
            <ProductList 
              businessOwnerId={user?.id}
              showCreateButton={false}
              onRefreshReady={(refreshFn) => {
                refreshProductsRef.current = refreshFn;
              }}
              onProductCountChange={handleProductCountChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

