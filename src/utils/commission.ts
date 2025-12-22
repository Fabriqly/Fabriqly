/**
 * Commission calculation utility
 * 
 * Commission rates:
 * - 8% for product orders (physical goods)
 * - 10% for design purchases and customizations (digital/higher margin services)
 */

export interface CommissionCalculationParams {
  productSubtotal: number;
  designSubtotal: number;
  customizationDesignFee?: number; // For customization requests
}

export interface CommissionResult {
  rate: number; // Commission rate as decimal (0.08 or 0.10)
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
  
  // For customization requests (design fees)
  if (customizationDesignFee > 0) {
    return {
      rate: 0.10, // 10% for customizations
      amount: customizationDesignFee * 0.10,
      type: 'customization'
    };
  }
  
  // For regular orders
  const totalSubtotal = productSubtotal + designSubtotal;
  
  // If no items, return zero commission
  if (totalSubtotal === 0) {
    return {
      rate: 0,
      amount: 0,
      type: 'product'
    };
  }
  
  // Design-only orders or design-dominant orders (design >= product)
  if (designSubtotal >= productSubtotal) {
    return {
      rate: 0.10, // 10% for design purchases
      amount: totalSubtotal * 0.10,
      type: designSubtotal > 0 && productSubtotal === 0 ? 'design' : 'mixed'
    };
  }
  
  // Product-dominant orders (product > design)
  return {
    rate: 0.08, // 8% for product orders
    amount: totalSubtotal * 0.08,
    type: 'product'
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

