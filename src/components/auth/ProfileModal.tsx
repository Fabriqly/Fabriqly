'use client';

import { useState } from 'react';
import { ProfileEdit } from '@/components/auth/ProfileEdit';
import { X } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (profileData: any) => void;
}

export function ProfileModal({ isOpen, onClose, onSave }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
        <ProfileEdit onClose={onClose} onSave={onSave} />
      </div>
    </div>
  );
}
