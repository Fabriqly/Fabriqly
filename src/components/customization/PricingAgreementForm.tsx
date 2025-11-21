'use client';

import { useState } from 'react';
import { PaymentType } from '@/types/customization';

interface PricingAgreementFormProps {
  customizationRequestId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PricingAgreementForm({
  customizationRequestId,
  onSuccess,
  onCancel
}: PricingAgreementFormProps) {
  const [designFee, setDesignFee] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('upfront');
  const [milestones, setMilestones] = useState<Array<{ description: string; amount: string }>>([
    { description: 'Initial Payment', amount: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const totalCost = parseFloat(designFee) || 0;

  const handleAddMilestone = () => {
    setMilestones([...milestones, { description: '', amount: '' }]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!designFee) {
      alert('Design fee is required');
      return;
    }

    if (paymentType === 'milestone') {
      const milestoneTotals = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
      if (Math.abs(milestoneTotals - totalCost) > 0.01) {
        alert('Milestone amounts must add up to total cost');
        return;
      }
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/customizations/${customizationRequestId}/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designFee: parseFloat(designFee),
          productCost: 0,  // Not set by designer
          printingCost: 0, // Not set by designer
          paymentType,
          milestones: paymentType === 'milestone' ? milestones.map(m => ({
            description: m.description,
            amount: parseFloat(m.amount)
          })) : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Pricing agreement created successfully!');
        onSuccess();
      } else {
        alert(data.error || 'Failed to create pricing agreement');
      }
    } catch (error) {
      console.error('Error creating pricing:', error);
      alert('Failed to create pricing agreement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Set Your Design Fee</h3>
        <p className="text-sm text-gray-600">
          Set your fee for the design work. Product and printing costs will be handled separately by the shop.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Design Fee (₱) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={designFee}
          onChange={(e) => setDesignFee(e.target.value)}
          placeholder="e.g., 500"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          This is your fee for creating the custom design
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Your Design Fee:</span> ₱{totalCost.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Product and printing costs will be added by the printing shop
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Type
        </label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as PaymentType)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="upfront">Upfront (100% before production)</option>
          <option value="half_payment">Half Payment (50% upfront, 50% on completion)</option>
          <option value="milestone">Milestone-based</option>
        </select>
      </div>

      {paymentType === 'milestone' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Payment Milestones
            </label>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Milestone
            </button>
          </div>
          
          {milestones.map((milestone, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Description"
                value={milestone.description}
                onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={milestone.amount}
                onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Saving...' : 'Set Design Fee'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

