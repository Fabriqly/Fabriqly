'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signOut } from 'next-auth/react';

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [email, setEmail] = useState('test@example.com');

  const testDatabaseConnection = async () => {
    try {
      setTestResult('Testing database connection...');
      
      // Test creating a document
      const testDoc = await FirebaseService.create('test', {
        message: 'Hello from Fabriqly!',
        timestamp: new Date(),
        testUser: user?.email || 'anonymous'
      });
      
      setTestResult(`✅ Database test successful! Created document with ID: ${testDoc.id}`);
    } catch (error: any) {
      setTestResult(`❌ Database test failed: ${error.message}`);
    }
  };

  const testUserQuery = async () => {
    try {
      setTestResult('Testing user query...');
      
      if (!user) {
        setTestResult('❌ No user logged in to test');
        return;
      }

      const userData = await FirebaseService.getById('users', user.id);
      setTestResult(`✅ User data retrieved: ${JSON.stringify(userData, null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ User query failed: ${error.message}`);
    }
  };

  const testFirebaseAuth = async () => {
    try {
      setTestResult('Testing Firebase Auth...');
      
      // Import Firebase auth for client-side testing
      const { auth } = await import('@/lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');
      
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setTestResult(`✅ Firebase Auth working! User: ${firebaseUser.email}`);
        } else {
          setTestResult('ℹ️ No Firebase user authenticated');
        }
      });
    } catch (error: any) {
      setTestResult(`❌ Firebase Auth test failed: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Authentication & Database Testing</h1>
          
          {/* Authentication Status */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Authentication Status</h2>
            {isAuthenticated ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ User is authenticated</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Name:</strong> {user?.name || 'Not set'}</p>
                <Button onClick={() => signOut()} variant="outline" size="sm" className="mt-2">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-red-600">❌ User is not authenticated</p>
                <div className="mt-4 space-x-2">
                  <a href="/login">
                    <Button size="sm">Go to Login</Button>
                  </a>
                  <a href="/register">
                    <Button variant="outline" size="sm">Go to Register</Button>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Database Testing */}
          <div className="mb-8 p-4 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold text-green-900 mb-4">Database Testing</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={testDatabaseConnection} size="sm">
                  Test Database Write
                </Button>
                <Button onClick={testUserQuery} size="sm" disabled={!isAuthenticated}>
                  Test User Query
                </Button>
                <Button onClick={testFirebaseAuth} size="sm">
                  Test Firebase Auth
                </Button>
              </div>
              
              {testResult && (
                <div className="mt-4 p-3 bg-gray-100 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 p-4 bg-purple-50 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </a>
              <a href="/">
                <Button variant="outline" className="w-full">Go to Homepage</Button>
              </a>
              <a href="/login">
                <Button variant="outline" className="w-full">Test Login Page</Button>
              </a>
              <a href="/register">
                <Button variant="outline" className="w-full">Test Register Page</Button>
              </a>
            </div>
          </div>

          {/* Environment Check */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold text-yellow-900 mb-4">Environment Check</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Firebase Project ID:</strong></p>
                <p className="text-gray-600">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Not set'}</p>
              </div>
              <div>
                <p><strong>Firebase Auth Domain:</strong></p>
                <p className="text-gray-600">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '❌ Not set'}</p>
              </div>
              <div>
                <p><strong>NextAuth URL:</strong></p>
                <p className="text-gray-600">{process.env.NEXTAUTH_URL || '❌ Not set'}</p>
              </div>
              <div>
                <p><strong>NextAuth Secret:</strong></p>
                <p className="text-gray-600">{process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
