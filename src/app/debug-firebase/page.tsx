'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function DebugFirebasePage() {
  const [result, setResult] = useState<string>('');
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('TestPassword123');

  const testFirebaseDirectly = async () => {
    try {
      setResult('Testing Firebase Auth directly...');
      
      // Import Firebase auth
      const { auth } = await import('@/lib/firebase');
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      
      // Try to create user directly with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setResult(`✅ Firebase Auth works! User created: ${userCredential.user.email}`);
      
    } catch (error: any) {
      setResult(`❌ Firebase Auth Error: ${error.code} - ${error.message}`);
      console.error('Firebase Auth Error:', error);
    }
  };

  const testEnvironmentVars = () => {
    const vars = {
      'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const output = Object.entries(vars)
      .map(([key, value]) => `${key}: ${value ? '✅ Set' : '❌ Missing'}`)
      .join('\n');

    setResult(`Environment Variables:\n${output}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Firebase Debug Tool</h1>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Environment Check</h2>
              <Button onClick={testEnvironmentVars}>Check Environment Variables</Button>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4">Direct Firebase Test</h2>
              <div className="space-y-4">
                <Input
                  label="Test Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                />
                <Input
                  label="Test Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="TestPassword123"
                />
                <Button onClick={testFirebaseDirectly}>Test Firebase Auth Directly</Button>
              </div>
            </div>

            {result && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            )}

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">Quick Links</h2>
              <div className="space-y-2">
                <p><strong>Firebase Console:</strong> <a href="https://console.firebase.google.com/project/fabriqly-cb104/authentication/providers" target="_blank" className="text-blue-600 hover:underline">Authentication Settings</a></p>
                <p><strong>Firestore Rules:</strong> <a href="https://console.firebase.google.com/project/fabriqly-cb104/firestore/rules" target="_blank" className="text-blue-600 hover:underline">Database Rules</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
