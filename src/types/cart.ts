// Cart Types for Database Storage
export interface CartItem {
  id: string;
  productId?: string; // Optional - for product items
  designId?: string; // Optional - for design items
  itemType: 'product' | 'design'; // Type of item
  product?: {
    id: string;
    name: string;
    price: number;
    sku: string;
    images?: Array<{
      id: string;
      imageUrl: string;
      altText?: string;
      isPrimary?: boolean;
    }>;
  };
  design?: {
    id: string;
    name: string;
    price: number;
    designType: 'template' | 'custom' | 'premium';
    thumbnailUrl?: string;
    storagePath?: string;
    storageBucket?: string;
  };
  quantity: number;
  selectedVariants: Record<string, string>;
  selectedColorId?: string;
  selectedColorName?: string;
  colorPriceAdjustment?: number;
  selectedDesign?: { name: string; price: number }; // Selected design variant with price modifier (for products)
  selectedSize?: { name: string; price: number }; // Selected size variant with price modifier
  unitPrice: number;
  totalPrice: number;
  businessOwnerId?: string; // Optional for design items (designerId)
  designerId?: string; // For design items
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  discountAmount?: number;
  appliedCouponCode?: string;
  appliedDiscounts?: Array<{
    discountId: string;
    couponCode?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountValue: number;
    discountAmount: number;
    scope: 'product' | 'category' | 'order' | 'shipping';
    targetIds?: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface AddToCartRequest {
  productId?: string; // For product items
  designId?: string; // For design items
  itemType: 'product' | 'design'; // Type of item
  quantity: number;
  selectedVariants?: Record<string, string>;
  selectedColorId?: string;
  selectedColorName?: string;
  colorPriceAdjustment?: number;
  selectedDesign?: { name: string; price: number }; // Selected design variant with price modifier (for products)
  selectedSize?: { name: string; price: number }; // Selected size variant with price modifier
  businessOwnerId?: string; // For product items
  designerId?: string; // For design items
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  data?: Cart;
  error?: string;
}

export interface CartItemResponse {
  success: boolean;
  data?: CartItem;
  error?: string;
}


