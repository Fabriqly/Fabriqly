'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DebugPage, debug } from '@/utils/debug';

export default function GoogleOAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<string>('');

  const checkGoogleOAuthConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'Not set';
    const hasClientSecret = process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set';
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'Not set';
    const nextAuthSecret = process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set';
    
    const info = `
Google OAuth Configuration Check:
================================
Client ID: ${clientId}
Client Secret: ${hasClientSecret}
NEXTAUTH_URL: ${nextAuthUrl}
NEXTAUTH_SECRET: ${nextAuthSecret}

Expected Redirect URIs:
======================
http://localhost:3000/api/auth/callback/google

Current URL: ${window.location.href}

Environment Check:
=================
NODE_ENV: ${process.env.NODE_ENV}
    `;
    
    setDebugInfo(info);
  };

  const testGoogleOAuth = async () => {
    try {
      setDebugInfo('Testing Google OAuth...');
      debug.userAction('test-google-oauth');
      
      // Try to initiate Google OAuth
      const response = await fetch('/api/auth/providers');
      const providers = await response.json();
      
      debug.api('/api/auth/providers', 'GET', providers);
      setDebugInfo(prev => prev + `\n\nOAuth Providers:\n${JSON.stringify(providers, null, 2)}`);
    } catch (error) {
      debug.api('/api/auth/providers', 'GET', undefined, error);
      setDebugInfo(prev => prev + `\n\nError testing OAuth: ${error}`);
    }
  };

  return (
    <DebugPage title="Google OAuth Debug">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Configuration Check</h2>
              <div className="space-x-4">
                <Button onClick={checkGoogleOAuthConfig}>Check Config</Button>
                <Button onClick={testGoogleOAuth} variant="outline">Test OAuth</Button>
              </div>
            </div>

            {debugInfo && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">Quick Links</h2>
              <div className="space-y-2">
                <p><strong>OAuth Consent Screen:</strong> <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" className="text-blue-600 hover:underline">Configure Consent Screen</a></p>
                <p><strong>OAuth Credentials:</strong> <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-blue-600 hover:underline">Check Credentials</a></p>
                <p><strong>Google Identity API:</strong> <a href="https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com" target="_blank" className="text-blue-600 hover:underline">Enable API</a></p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4">Common Issues</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><strong>Test Users:</strong> Add your email to OAuth consent screen test users</li>
                <li><strong>Publishing Status:</strong> Set to "Testing" for development</li>
                <li><strong>Scopes:</strong> Make sure openid, email, profile are added</li>
                <li><strong>Redirect URI:</strong> Verify http://localhost:3000/api/auth/callback/google</li>
                <li><strong>API Enabled:</strong> Enable Google Identity API</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </DebugPage>
  );
}
