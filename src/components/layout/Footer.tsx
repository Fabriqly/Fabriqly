import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-sky-100 border-t border-sky-200 border-l border-r border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  href="/seller-centre" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Seller Centre
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">LEGAL & POLICIES</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/terms-and-conditions" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Terms & Conditions
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
                  href="/shipping-policy" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/refund-policy" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Business Centre Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Business Centre</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/business/login" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Centre Login
                </Link>
              </li>
              <li>
                <Link 
                  href="/business/register" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Register Business
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
  );
}

export default Footer;
