import { BaseRepository } from './BaseRepository';
import { Collections } from '@/services/firebase';
import { Cart, CartItem } from '@/types/cart';

export class CartRepository extends BaseRepository<Cart> {
  constructor() {
    super(Collections.CARTS);
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    try {
      const carts = await this.findAll({
        filters: [
          {
            field: 'userId',
            operator: '==',
            value: userId
          }
        ]
      });
      return carts.length > 0 ? carts[0] : null;
    } catch (error) {
      console.error('Error finding cart by user ID:', error);
      throw error;
    }
  }

  async createOrUpdateCart(userId: string, items: CartItem[]): Promise<Cart> {
    try {
      const existingCart = await this.findByUserId(userId);
      
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Filter out undefined values from items to prevent Firestore errors
      const cleanItems = items.map(item => {
        const cleanItem: any = { ...item };
        // Remove undefined properties
        Object.keys(cleanItem).forEach(key => {
          if (cleanItem[key] === undefined) {
            delete cleanItem[key];
          }
        });
        return cleanItem;
      });

      const cartData = {
        userId,
        items: cleanItems,
        totalItems,
        totalAmount,
        updatedAt: new Date()
      };

      if (existingCart) {
        // Update existing cart
        return await this.update(existingCart.id, cartData);
      } else {
        // Create new cart
        return await this.create({
          ...cartData,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error creating or updating cart:', error);
      throw error;
    }
  }

  async addItemToCart(userId: string, newItem: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cart> {
    try {
      const existingCart = await this.findByUserId(userId);
      let items: CartItem[] = [];

      if (existingCart) {
        items = [...existingCart.items];
      }

      // Generate unique ID for the cart item
      let itemId: string;
      if (newItem.itemType === 'design' && newItem.designId) {
        // For designs: designId is unique identifier
        itemId = `design-${newItem.designId}`;
      } else if (newItem.itemType === 'product' && newItem.productId) {
        // For products: Include productId, variants, color, design, and size to ensure unique items
        const designId = newItem.selectedDesign?.name || 'no-design';
        const sizeId = newItem.selectedSize?.name || 'no-size';
        itemId = `product-${newItem.productId}-${JSON.stringify(newItem.selectedVariants)}-${newItem.selectedColorId || 'default'}-${designId}-${sizeId}`;
      } else {
        throw new Error('Invalid cart item: must have either productId or designId');
      }
      
      // Check if item already exists
      const existingItemIndex = items.findIndex(item => item.id === itemId);

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = items[existingItemIndex];
        items[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + newItem.quantity,
          totalPrice: existingItem.unitPrice * (existingItem.quantity + newItem.quantity),
          updatedAt: new Date()
        };
      } else {
        // Add new item
        const cartItem: CartItem = {
          ...newItem,
          id: itemId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        items.push(cartItem);
      }

      return await this.createOrUpdateCart(userId, items);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<Cart> {
    try {
      const existingCart = await this.findByUserId(userId);
      if (!existingCart) {
        throw new Error('Cart not found');
      }

      let items = [...existingCart.items];
      const itemIndex = items.findIndex(item => item.id === itemId);

      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      if (quantity <= 0) {
        // Remove item
        items.splice(itemIndex, 1);
      } else {
        // Update quantity
        items[itemIndex] = {
          ...items[itemIndex],
          quantity,
          totalPrice: items[itemIndex].unitPrice * quantity,
          updatedAt: new Date()
        };
      }

      return await this.createOrUpdateCart(userId, items);
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  async removeItemFromCart(userId: string, itemId: string): Promise<Cart> {
    try {
      const existingCart = await this.findByUserId(userId);
      if (!existingCart) {
        throw new Error('Cart not found');
      }

      const items = existingCart.items.filter(item => item.id !== itemId);
      return await this.createOrUpdateCart(userId, items);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  async clearCart(userId: string): Promise<Cart> {
    try {
      return await this.createOrUpdateCart(userId, []);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
}
