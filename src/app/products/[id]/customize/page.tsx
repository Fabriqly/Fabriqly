'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { CustomizationRequestForm } from '@/components/customization/CustomizationRequestForm';
import { ProductWithDetails } from '@/types/products';
import { Loader, AlertCircle, ArrowLeft } from 'lucide-react';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function CustomizeProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [colorPriceAdjustment, setColorPriceAdjustment] = useState<number>(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/products/${productId}/customize`);
    }
  }, [status, router, productId]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      // Try to get selected variants from URL params or sessionStorage
      loadSelectedOptions();
    }
  }, [productId]);

  const loadSelectedOptions = () => {
    // Try to get from URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const variantParam = searchParams.get('variants');
    const colorParam = searchParams.get('color');
    
    if (variantParam) {
      try {
        setSelectedVariants(JSON.parse(variantParam));
      } catch (e) {
        console.error('Error parsing variants:', e);
      }
    }
    
    if (colorParam) {
      setSelectedColorId(colorParam);
    }

    // Also try sessionStorage as fallback
    const storedVariants = sessionStorage.getItem(`product_${productId}_variants`);
    const storedColor = sessionStorage.getItem(`product_${productId}_color`);
    const storedColorAdjustment = sessionStorage.getItem(`product_${productId}_colorAdjustment`);
    
    if (storedVariants) {
      try {
        setSelectedVariants(JSON.parse(storedVariants));
      } catch (e) {
        console.error('Error parsing stored variants:', e);
      }
    }
    
    if (storedColor) {
      setSelectedColorId(storedColor);
    }
    
    if (storedColorAdjustment) {
      setColorPriceAdjustment(parseFloat(storedColorAdjustment));
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      const result = await response.json();
      
      if (result.success) {
        setProduct(result.data);
        
        if (!result.data.isCustomizable) {
          setError('This product is not available for customization');
        }
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch('/api/customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create request');
      }

      // Redirect to customizations page
      router.push('/my-customizations?success=true');
    } catch (error: any) {
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(`/products/${productId}`);
  };

  // Get breadcrumb information from sessionStorage or determine from context
  const getBreadcrumbInfo = () => {
    if (typeof window === 'undefined') {
      return { label: 'Products', path: '/products' };
    }

    // Try to get from sessionStorage first (same key as ProductDetail uses)
    const referrer = sessionStorage.getItem(`product_${productId}_referrer`);
    const referrerLabel = sessionStorage.getItem(`product_${productId}_referrerLabel`);
    const referrerPath = sessionStorage.getItem(`product_${productId}_referrerPath`);

    if (referrer && referrerLabel && referrerPath) {
      return { label: referrerLabel, path: referrerPath };
    }

    // Fallback: determine from document.referrer or default
    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const referrerPathname = referrerUrl.pathname;
        const referrerQuery = referrerUrl.searchParams.get('q') || referrerUrl.searchParams.get('query') || '';
        
        if (referrerPathname === '/search' || referrerPathname.startsWith('/search')) {
          const searchPath = referrerQuery ? `/search?q=${encodeURIComponent(referrerQuery)}` : '/search';
          return { label: 'Search', path: searchPath };
        } else if (referrerPathname.startsWith('/explore/merchandise')) {
          return { label: 'Merchandise', path: '/explore/merchandise' };
        } else if (referrerPathname.startsWith('/explore/shops')) {
          return { label: 'Shops', path: '/explore/shops' };
        } else if (referrerPathname.startsWith('/explore/designs')) {
          return { label: 'Designs', path: '/explore/designs' };
        } else if (referrerPathname.startsWith('/explore')) {
          return { label: 'Explore', path: '/explore' };
        } else if (referrerPathname.startsWith('/shops/')) {
          const shopUsername = referrerPathname.split('/')[2];
          return { label: 'Shop', path: `/shops/${shopUsername}` };
        }
      } catch (e) {
        // Invalid URL, use default
      }
    }

    // Default fallback
    return { label: 'Products', path: '/products' };
  };

  const breadcrumbInfo = getBreadcrumbInfo();

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CustomerHeader user={user} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CustomerHeader user={user} />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {error || 'Product not found'}
            </h2>
            <Button
              onClick={() => router.push(`/products/${productId}`)}
              className="mt-4"
            >
              Back to Product
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push(breadcrumbInfo.path)}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {breadcrumbInfo.label}
            </button>
            <span className="text-slate-400">/</span>
            <button
              onClick={() => router.push(`/products/${productId}`)}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {product.name}
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-medium">Customize</span>
          </div>
        </nav>

        {/* Back Button */}
        <div className="mb-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex items-center space-x-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Product</span>
          </Button>
        </div>

        {/* Form */}
        <CustomizationRequestForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          selectedVariants={selectedVariants}
          selectedColorId={selectedColorId}
          colorPriceAdjustment={colorPriceAdjustment}
        />
      </div>
      
      <ScrollToTop />
    </div>
  );
}

