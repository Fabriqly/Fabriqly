'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Check } from 'lucide-react';

interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

interface AddressListModalProps {
  userId: string;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
  onClose: () => void;
  refreshTrigger?: number; // Trigger refresh when this changes
}

export function AddressListModal({
  userId,
  onSelect,
  onAddNew,
  onClose,
  refreshTrigger
}: AddressListModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, [userId, refreshTrigger]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      console.log('[AddressListModal] Loading addresses for userId:', userId);
      const response = await fetch(`/api/users/${userId}/addresses`);
      const data = await response.json();

      console.log('[AddressListModal] API Response:', { 
        success: data.success, 
        addressCount: data.data?.length || 0,
        addresses: data.data 
      });

      if (data.success) {
        setAddresses(data.data || []);
        // Auto-select default address if exists
        const defaultAddr = data.data?.find((addr: Address) => addr.isDefault);
        if (defaultAddr) {
          setSelectedId(defaultAddr.id!);
        }
      } else {
        console.error('[AddressListModal] API Error:', data.error);
      }
    } catch (error) {
      console.error('[AddressListModal] Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    const selected = addresses.find(addr => addr.id === selectedId);
    if (selected) {
      onSelect(selected);
    }
  };

  const AddressCard = ({ address }: { address: Address }) => {
    const isSelected = selectedId === address.id;
    
    return (
      <div
        onClick={() => setSelectedId(address.id!)}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-600 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-gray-900">
                {address.firstName} {address.lastName}
              </span>
              {address.isDefault && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                  Default
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1 ml-6">
              <p>{address.address1}</p>
              {address.address2 && <p>{address.address2}</p>}
              <p>
                {address.city}, {address.state} {address.zipCode}
              </p>
              <p>{address.country}</p>
              <p className="text-gray-500">📱 {address.phone}</p>
            </div>
          </div>
          
          {isSelected && (
            <div className="flex-shrink-0 ml-4">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Select Shipping Address</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose where you&apos;d like your order delivered
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border-2 border-gray-200 rounded-lg animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      </div>
                      <div className="space-y-2 ml-6">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                        <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No saved addresses yet</p>
              <p className="text-sm text-gray-500 mb-6">
                Add your first shipping address to continue
              </p>
              <button
                onClick={onAddNew}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))}
              
              <button
                onClick={onAddNew}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600 font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add New Address
              </button>
            </div>
          )}
        </div>

        {addresses.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={handleSelect}
              disabled={!selectedId}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              Deliver to This Address
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

