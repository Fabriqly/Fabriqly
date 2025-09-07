import { MultiStepRegisterForm } from '@/components/auth/MultiStepRegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Fabriqly',
  description: 'Create your Fabriqly account'
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <MultiStepRegisterForm />
    </div>
  );
}
