'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DebugPage, debug, debugTimer, debugOnly } from '@/utils/debug';

export default function TestDebugPage() {
  const [counter, setCounter] = useState(0);
  const [data, setData] = useState<any>(null);

  const handleIncrement = () => {
    setCounter(prev => prev + 1);
    debug.userAction('increment-counter', { newValue: counter + 1 });
  };

  const handleLoadData = async () => {
    debug.timer.start('load-data');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = { id: 1, name: 'Test Data', timestamp: new Date() };
      setData(mockData);
      
      debug.api('/api/test', 'GET', undefined, mockData);
      debug.log.log('Data loaded successfully:', mockData);
    } catch (error) {
      debug.api('/api/test', 'GET', undefined, undefined, error);
      debug.log.error('Failed to load data:', error);
    } finally {
      debug.timer.end('load-data');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const formObject = Object.fromEntries(formData.entries());
    
    debug.form('test-form', formObject);
    debug.userAction('form-submit', { formName: 'test-form' });
    
    alert('Form submitted! Check console for debug info.');
  };

  const handleStorageTest = () => {
    const testData = { test: 'value', timestamp: Date.now() };
    
    // Test localStorage
    localStorage.setItem('debug-test', JSON.stringify(testData));
    debug.storage('set', 'debug-test', testData);
    
    // Test sessionStorage
    sessionStorage.setItem('debug-session', JSON.stringify(testData));
    debug.storage('set', 'debug-session', testData);
    
    debug.log.log('Storage test completed');
  };

  const handleMemoryTest = () => {
    debug.memory('Before memory test');
    
    // Create some objects to test memory usage
    const largeArray = new Array(10000).fill(0).map((_, i) => ({
      id: i,
      data: `Item ${i}`,
      timestamp: Date.now()
    }));
    
    debug.memory('After creating large array');
    
    // Clear the array
    largeArray.length = 0;
    
    debug.memory('After clearing array');
  };

  const handleNavigationTest = () => {
    debug.navigation('test-debug', 'dashboard', { 
      from: 'debug-page',
      reason: 'test-navigation' 
    });
  };

  const handleComponentLifecycleTest = () => {
    debug.component('TestDebugPage', 'render', { 
      counter, 
      hasData: !!data 
    });
  };

  const handleHookTest = () => {
    debug.hook('useState', { counter, data }, [counter, data]);
  };

  const handleErrorTest = () => {
    try {
      throw new Error('Test error for debugging');
    } catch (error) {
      debug.errorBoundary(error as Error, { 
        component: 'TestDebugPage',
        action: 'error-test' 
      });
    }
  };

  const handlePerformanceTest = () => {
    debug.performance('test-operation', () => {
      // Simulate expensive operation
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.random();
      }
      return result;
    });
  };

  const handleDatabaseTest = () => {
    const mockData = { id: 1, name: 'Test Record' };
    debug.database('create', 'test-collection', mockData);
    
    // Simulate error
    setTimeout(() => {
      const error = new Error('Database connection failed');
      debug.database('create', 'test-collection', mockData, error);
    }, 100);
  };

  // Debug-only code that won't run in production
  debugOnly(() => {
    console.log('This is debug-only code that only runs in development');
  });

  return (
    <DebugPage title="Debug System Test">
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Debug System Test</h2>
          <p className="text-blue-700">
            This page demonstrates all the debug utilities. Check the browser console for debug output.
            In production, this page will show "Page Not Available".
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Debugging */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Basic Debugging</h3>
            <div className="space-y-2">
              <Button onClick={handleIncrement}>
                Increment Counter ({counter})
              </Button>
              <Button onClick={handleLoadData} variant="outline">
                Load Test Data
              </Button>
              <Button onClick={handleFormSubmit} variant="outline">
                Test Form Debug
              </Button>
            </div>
          </div>

          {/* Storage & Memory */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Storage & Memory</h3>
            <div className="space-y-2">
              <Button onClick={handleStorageTest}>
                Test Storage
              </Button>
              <Button onClick={handleMemoryTest} variant="outline">
                Test Memory Usage
              </Button>
            </div>
          </div>

          {/* Navigation & Components */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Navigation & Components</h3>
            <div className="space-y-2">
              <Button onClick={handleNavigationTest}>
                Test Navigation
              </Button>
              <Button onClick={handleComponentLifecycleTest} variant="outline">
                Test Component Lifecycle
              </Button>
              <Button onClick={handleHookTest} variant="outline">
                Test Hook Debug
              </Button>
            </div>
          </div>

          {/* Performance & Database */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Performance & Database</h3>
            <div className="space-y-2">
              <Button onClick={handlePerformanceTest}>
                Test Performance
              </Button>
              <Button onClick={handleDatabaseTest} variant="outline">
                Test Database Debug
              </Button>
              <Button onClick={handleErrorTest} variant="outline">
                Test Error Debug
              </Button>
            </div>
          </div>
        </div>

        {/* Form for testing */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Test Form</h3>
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                defaultValue="Test User"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                defaultValue="test@example.com"
              />
            </div>
            <Button type="submit">Submit Form</Button>
          </form>
        </div>

        {/* Data Display */}
        {data && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Loaded Data</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Information */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Debug Information</h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Debug Mode:</strong> {process.env.NODE_ENV === 'development' ? 'Enabled' : 'Disabled'}</p>
            <p><strong>Counter:</strong> {counter}</p>
            <p><strong>Data Loaded:</strong> {data ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </DebugPage>
  );
}
