'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Paintbrush } from 'lucide-react';

interface CustomizeButtonProps {
  productId: string;
  isCustomizable: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function CustomizeButton({ 
  productId, 
  isCustomizable,
  className = '',
  variant = 'primary'
}: CustomizeButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();

  if (!isCustomizable) {
    return null;
  }

  const handleClick = () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/products/${productId}/customize`);
      return;
    }
    router.push(`/products/${productId}/customize`);
  };

  const baseStyles = 'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all';
  
  const variantStyles = variant === 'primary'
    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
    : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50';

  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      <Paintbrush className="w-5 h-5" />
      Customize This Product
    </button>
  );
}

