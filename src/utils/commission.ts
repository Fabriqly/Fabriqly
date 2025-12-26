/**
 * Commission calculation utility
 * 
 * Commission rate:
 * - 8% per transaction (approved rate for all transaction types)
 */

export interface CommissionCalculationParams {
  productSubtotal: number;
  designSubtotal: number;
  customizationDesignFee?: number; // For customization requests
}

export interface CommissionResult {
  rate: number; // Commission rate as decimal (0.08 = 8%)
  amount: number; // Commission amount
  type: 'product' | 'design' | 'mixed' | 'customization';
}

/**
 * Calculate commission rate and amount based on transaction type
 * 
 * @param params - Transaction parameters
 * @returns Commission rate, amount, and type
 */
export function calculateCommission(params: CommissionCalculationParams): CommissionResult {
  const { productSubtotal, designSubtotal, customizationDesignFee = 0 } = params;
  
  // Calculate total transaction amount
  const totalSubtotal = productSubtotal + designSubtotal + customizationDesignFee;
  
  // If no items, return zero commission
  if (totalSubtotal === 0) {
    return {
      rate: 0,
      amount: 0,
      type: 'product'
    };
  }
  
  // All transactions use 8% commission rate (approved rate)
  const commissionRate = 0.08; // 8% per transaction
  
  // Determine transaction type for reporting
  let transactionType: 'product' | 'design' | 'mixed' | 'customization';
  if (customizationDesignFee > 0) {
    transactionType = 'customization';
  } else if (designSubtotal > 0 && productSubtotal === 0) {
    transactionType = 'design';
  } else if (productSubtotal > 0 && designSubtotal === 0) {
    transactionType = 'product';
  } else {
    transactionType = 'mixed';
  }
  
  return {
    rate: commissionRate,
    amount: totalSubtotal * commissionRate,
    type: transactionType
  };
}

/**
 * Get commission rate for a given transaction type
 */
export function getCommissionRate(params: CommissionCalculationParams): number {
  return calculateCommission(params).rate;
}

/**
 * Get commission amount for a given transaction
 */
export function getCommissionAmount(params: CommissionCalculationParams): number {
  return calculateCommission(params).amount;
}

