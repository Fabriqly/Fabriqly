import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        {
          'border-gray-200 bg-gray-50 text-gray-900': variant === 'default',
          'border-red-200 bg-red-50 text-red-900': variant === 'destructive',
          'border-green-200 bg-green-50 text-green-900': variant === 'success',
          'border-yellow-200 bg-yellow-50 text-yellow-900': variant === 'warning',
        },
        className
      )}
      {...props}
    >
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}
