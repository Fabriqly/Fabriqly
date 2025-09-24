import { ProductForm } from '@/components/products/ProductForm';
import { useRequireAuth } from '@/hooks/useAuth';

export default function AddProductPage() {
  const { user, isLoading } = useRequireAuth('business_owner');

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductForm />
      </div>
    </div>
  );
}

