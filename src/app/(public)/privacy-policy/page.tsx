import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { policyService } from '@/services/PolicyService';
import { PolicyType } from '@/types/policy';
import { sanitizeHtml } from '@/lib/dompurify';
import { Header, Footer } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Privacy Policy | Fabriqly',
  description: 'Learn how Fabriqly collects, uses, and protects your personal information. Compliant with Philippines Data Privacy Act (RA 10173).'
};

export const revalidate = 3600; // Revalidate every hour (ISR)

export default async function PrivacyPolicyPage() {
  const policy = await policyService.getActivePolicy(PolicyType.PRIVACY);

  if (!policy) {
    notFound();
  }

  // Sanitize HTML content
  const sanitizedContent = sanitizeHtml(policy.content);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {policy.title}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date(policy.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} • Version {policy.version}
            </p>
            
            <div 
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal prose-li:my-2"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

