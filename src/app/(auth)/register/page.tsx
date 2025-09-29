import { MultiStepRegisterForm } from '@/components/auth/MultiStepRegisterForm';
import { Metadata } from 'next';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Sign Up | Fabriqly',
  description: 'Create your Fabriqly account'
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 sm:px-6 lg:px-8">
        <MultiStepRegisterForm />
      </main>
    </div>
  );
}
