'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Store
} from 'lucide-react';
import Link from 'next/link';

interface ShopProductsPageProps {
  params: Promise<{
    username: string;
  }>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  status: string;
  categoryId: string;
  shopId?: string;
  images?: any[];
}

interface Shop {
  id: string;
  shopName: string;
  username: string;
  userId: string;
  approvalStatus: string;
}

export default function ShopProductsPage({ params }: ShopProductsPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // Unwrap params Promise
    params.then(({ username: u }) => setUsername(u));
  }, [params]);

  useEffect(() => {
    if (username) {
      loadShopAndProducts();
    }
  }, [username, session]);

  const loadShopAndProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load shop profile
      const shopResponse = await fetch(`/api/shop-profiles/username/${username}`);
      
      if (!shopResponse.ok) {
        throw new Error('Shop not found');
      }

      const shopData = await shopResponse.json();
      const shopProfile = shopData.data;
      setShop(shopProfile);

      // Check if current user is the owner
      if (session?.user?.id === shopProfile.userId) {
        setIsOwner(true);
      }

      // Load products for this shop
      const productsResponse = await fetch(`/api/products?shopId=${shopProfile.id}`);
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.data?.products || []);
      }
    } catch (err: any) {
      console.error('Error loading shop products:', err);
      setError(err.message || 'Failed to load shop products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      // Reload products
      loadShopAndProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading shop products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 text-center mb-2">Error</h2>
          <p className="text-red-700 text-center">{error}</p>
          <Button
            onClick={() => router.back()}
            className="mt-4 w-full"
            variant="outline"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-gray-600 mb-4">The shop you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/shops')}>
            Browse All Shops
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/shops/${username}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop Profile
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {shop.shopName} - Products
              </h1>
              <p className="text-gray-600">
                Manage products for your shop
              </p>
            </div>

            {isOwner && (
              <Link href="/dashboard/products/new">
                <Button className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-600 mb-6">
              {isOwner
                ? "Start adding products to your shop to showcase your offerings."
                : "This shop hasn't added any products yet."}
            </p>
            {isOwner && (
              <Link href="/dashboard/products/new">
                <Button>
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Product
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {isOwner && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].imageUrl}
                                alt={product.name}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.stockQuantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/products/${product.id}`}>
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-5 h-5" />
                              </button>
                            </Link>
                            <Link href={`/dashboard/products/edit/${product.id}`}>
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <Edit className="w-5 h-5" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {products.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.reduce((sum, p) => sum + p.stockQuantity, 0)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
