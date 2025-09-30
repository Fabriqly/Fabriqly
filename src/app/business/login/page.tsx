import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import { Header } from '@/components/layout';
import Link from 'next/link';

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
      
      {/* Custom Footer for Business Login Page */}
      <footer className="w-full bg-sky-100 border-t border-sky-200 border-l border-r border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* About Fabriqly Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">ABOUT FABRIQLY</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/about" 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/privacy-policy" 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/seller-centre" 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Seller Centre
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Centre Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Centre</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/login" 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Customer Login
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/register" 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Customer Register
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-gray-600 my-6"></div>

          {/* Copyright */}
          <div className="text-gray-600">
            © 2025 Fabriqly. All right resereved.
          </div>
        </div>
      </footer>
    </div>
  );
}
