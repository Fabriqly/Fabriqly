import { ProductForm } from '@/components/products/ProductForm';
import { BusinessOwnerRoute } from '@/components/auth/ProtectedRoute';

export default function AddProductPage() {
  return (
    <BusinessOwnerRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductForm />
        </div>
      </div>
    </BusinessOwnerRoute>
  );
}

