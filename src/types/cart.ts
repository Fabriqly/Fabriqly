// Cart Types for Database Storage
export interface CartItem {
  id: string;
  productId: string;
  product: {
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
  quantity: number;
  selectedVariants: Record<string, string>;
  selectedColorId?: string;
  selectedColorName?: string;
  colorPriceAdjustment?: number;
  unitPrice: number;
  totalPrice: number;
  businessOwnerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
  selectedColorId?: string;
  selectedColorName?: string;
  colorPriceAdjustment?: number;
  businessOwnerId: string;
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


