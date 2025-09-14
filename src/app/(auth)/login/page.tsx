import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Image from 'next/image';
import BagIllustration from '@/../public/bag-1.png';

export const metadata: Metadata = {
  title: 'Sign In | Fabriqly',
  description: 'Sign in to your Fabriqly account'
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="w-full max-w-xs lg:max-w-sm">
                <Image
                  src={BagIllustration}
                  alt="Shopping bag illustration"
                  priority
                  sizes="(min-width: 1024px) 384px, 60vw"
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <LoginForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
