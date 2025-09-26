'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductCatalog } from '@/components/products/ProductCatalog';
import { ProductForm } from '@/components/products/ProductForm';
import { ProductList } from '@/components/products/ProductList';
import { 
  ProductWithDetails, 
  CreateProductData, 
  ProductFilters,
  Category 
} from '@/types/products';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Database, 
  Search, 
  Plus, 
  List,
  Grid,
  Filter,
  RefreshCw
} from 'lucide-react';

export default function TestProductCatalogPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'components' | 'integration'>('overview');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testProduct, setTestProduct] = useState<CreateProductData>({
    name: 'Test Product',
    description: 'This is a test product for catalog testing',
    shortDescription: 'Test product',
    categoryId: '',
    price: 29.99,
    stockQuantity: 10,
    sku: 'TEST-001',
    status: 'draft',
    isCustomizable: true,
    isDigital: false,
    tags: ['test', 'catalog'],
    specifications: {
      material: 'Cotton',
      size: 'M',
      color: 'Blue'
    }
  });

  // Test API endpoints
  const testAPIEndpoint = async (endpoint: string, method: string = 'GET', data?: any) => {
    setIsLoading(true);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(endpoint, options);
      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          success: response.ok,
          data: result,
          timestamp: new Date().toISOString()
        }
      }));

      return { success: response.ok, data: result, status: response.status };
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: 'error',
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Test product creation
  const testCreateProduct = async () => {
    const result = await testAPIEndpoint('/api/products', 'POST', testProduct);
    if (result.success) {
      console.log('✅ Product created successfully:', result.data);
    }
  };

  // Test product listing
  const testListProducts = async () => {
    const result = await testAPIEndpoint('/api/products');
    if (result.success) {
      console.log('✅ Products listed successfully:', result.data);
    }
  };

  // Test categories
  const testCategories = async () => {
    const result = await testAPIEndpoint('/api/categories');
    if (result.success) {
      console.log('✅ Categories loaded successfully:', result.data);
    }
  };

  // Test product search
  const testProductSearch = async () => {
    const result = await testAPIEndpoint('/api/products?search=test&limit=5');
    if (result.success) {
      console.log('✅ Product search successful:', result.data);
    }
  };

  // Test product filters
  const testProductFilters = async () => {
    const result = await testAPIEndpoint('/api/products?isCustomizable=true&minPrice=10&maxPrice=100');
    if (result.success) {
      console.log('✅ Product filters successful:', result.data);
    }
  };

  // Run all API tests
  const runAllAPITests = async () => {
    setIsLoading(true);
    const tests = [
      { name: 'Categories', fn: testCategories },
      { name: 'List Products', fn: testListProducts },
      { name: 'Product Search', fn: testProductSearch },
      { name: 'Product Filters', fn: testProductFilters },
      { name: 'Create Product', fn: testCreateProduct }
    ];

    for (const test of tests) {
      console.log(`Running ${test.name} test...`);
      await test.fn();
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }
    setIsLoading(false);
  };

  // Clear test results
  const clearTestResults = () => {
    setTestResults({});
  };

  const getStatusIcon = (success: boolean) => {
    if (success === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (success === false) return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = (success: boolean) => {
    if (success === true) return 'text-green-600 bg-green-50';
    if (success === false) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Product Catalog Testing Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive testing interface for the Fabriqly product catalog system
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Database },
              { id: 'api', label: 'API Tests', icon: Search },
              { id: 'components', label: 'Components', icon: Grid },
              { id: 'integration', label: 'Integration', icon: RefreshCw }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Testing Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">API Endpoints</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Test all product catalog API endpoints
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900">Components</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Test React components in isolation
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900">Integration</h3>
                  <p className="text-purple-700 text-sm mt-1">
                    Test complete user workflows
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Button onClick={runAllAPITests} disabled={isLoading}>
                  {isLoading ? 'Testing...' : 'Run All API Tests'}
                </Button>
                <Button onClick={clearTestResults} variant="outline">
                  Clear Results
                </Button>
                <Button onClick={() => window.open('/products', '_blank')} variant="outline">
                  Open Product Catalog
                </Button>
                <Button onClick={() => window.open('/dashboard/products', '_blank')} variant="outline">
                  Open Product Management
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* API Tests Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">API Endpoint Tests</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Individual Tests</h3>
                  <div className="space-y-2">
                    <Button onClick={testCategories} size="sm" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Test Categories API
                    </Button>
                    <Button onClick={testListProducts} size="sm" className="w-full justify-start">
                      <List className="w-4 h-4 mr-2" />
                      Test Products List API
                    </Button>
                    <Button onClick={testProductSearch} size="sm" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-2" />
                      Test Product Search API
                    </Button>
                    <Button onClick={testProductFilters} size="sm" className="w-full justify-start">
                      <Filter className="w-4 h-4 mr-2" />
                      Test Product Filters API
                    </Button>
                    <Button onClick={testCreateProduct} size="sm" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Test Create Product API
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Test Product Data</h3>
                  <div className="space-y-2">
                    <Input
                      label="Product Name"
                      value={testProduct.name}
                      onChange={(e) => setTestProduct(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      label="Price"
                      type="number"
                      value={testProduct.price}
                      onChange={(e) => setTestProduct(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    />
                    <Input
                      label="Stock Quantity"
                      type="number"
                      value={testProduct.stockQuantity}
                      onChange={(e) => setTestProduct(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={runAllAPITests} disabled={isLoading} className="w-full">
                {isLoading ? 'Running Tests...' : 'Run All API Tests'}
              </Button>
            </div>

            {/* Test Results */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              {Object.keys(testResults).length === 0 ? (
                <p className="text-gray-500">No test results yet. Run some tests to see results here.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testResults).map(([endpoint, result]) => (
                    <div key={endpoint} className={`p-4 rounded-lg border ${getStatusColor(result.success)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.success)}
                          <span className="font-medium">{endpoint}</span>
                        </div>
                        <span className="text-sm opacity-75">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p><strong>Status:</strong> {result.status}</p>
                        {result.error && <p><strong>Error:</strong> {result.error}</p>}
                        {result.data && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-medium">Response Data</summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Component Testing</h2>
              <p className="text-gray-600 mb-4">
                Test individual components in isolation to verify their functionality.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Product Catalog Component</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <ProductCatalog />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Product Management Component</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <ProductList showCreateButton={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integration Tab */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Integration Testing</h2>
              <p className="text-gray-600 mb-4">
                Test complete user workflows and component interactions.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Customer Workflow</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Test the complete customer experience: browse products, search, filter, and view details.
                  </p>
                  <Button onClick={() => window.open('/products', '_blank')}>
                    Open Customer Product Catalog
                  </Button>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Business Owner Workflow</h3>
                  <p className="text-green-700 text-sm mb-3">
                    Test product management: create, edit, manage images, and organize products.
                  </p>
                  <Button onClick={() => window.open('/dashboard/products', '_blank')}>
                    Open Product Management Dashboard
                  </Button>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Admin Workflow</h3>
                  <p className="text-purple-700 text-sm mb-3">
                    Test category management and system administration features.
                  </p>
                  <Button onClick={() => window.open('/dashboard/admin/categories', '_blank')}>
                    Open Admin Category Management
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

