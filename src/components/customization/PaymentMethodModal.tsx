'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Building, Smartphone, Store, QrCode, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaymentMethod {
  type: string;
  name: string;
  description: string;
  supported_currencies: string[];
  configuration?: any;
}

interface PaymentMethodModalProps {
  onSubmit: (paymentMethod: string) => void;
  onClose: () => void;
  amount: number;
  loading?: boolean;
}

function PaymentMethodModal({
  onSubmit,
  onClose,
  amount,
  loading = false
}: PaymentMethodModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loadingMethods, setLoadingMethods] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoadingMethods(true);
      const response = await fetch('/api/payments/methods');
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods);
        // Set default to first method
        if (data.paymentMethods.length > 0) {
          setSelectedMethod(data.paymentMethods[0].type);
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'virtual_account':
        return <Building className="h-5 w-5" />;
      case 'ewallet':
        return <Smartphone className="h-5 w-5" />;
      case 'retail_outlet':
        return <Store className="h-5 w-5" />;
      case 'qr_code':
        return <QrCode className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = () => {
    if (selectedMethod) {
      onSubmit(selectedMethod);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Select Payment Method</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Amount Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
          </div>

          {loadingMethods ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading payment methods...</span>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.type}
                    onClick={() => setSelectedMethod(method.type)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedMethod === method.type
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedMethod === method.type
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getMethodIcon(method.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      </div>
                      {selectedMethod === method.type && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={!selectedMethod || loading}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { PaymentMethodModal };
export default PaymentMethodModal;
