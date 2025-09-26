import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import { Header, Footer } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Business Centre Login | Fabriqly',
  description: 'Sign in to your Fabriqly Business Centre account'
};

export default function BusinessLoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="w-full max-w-md">
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Business Centre</h1>
                  <p className="text-lg text-gray-600 mb-6">Sign in to access your business dashboard and manage your products, orders, and customers.</p>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      <span>Manage your product catalog</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      <span>Track orders and sales</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      <span>Connect with customers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    Business Login
                  </h2>
                  <LoginForm />
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Don't have a business account?{' '}
                      <a 
                        href="/business/register" 
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Register your business
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
