import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">UI Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border border-gray-300 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Basic Styling Test</h2>
          <p className="text-gray-600">This should show basic Tailwind CSS is working.</p>
        </div>
        
        <div className="p-4 bg-blue-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Background Test</h2>
          <p className="text-blue-800">This should have a blue background.</p>
        </div>
        
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Test Button
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Outline Button
          </button>
        </div>
        
        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
