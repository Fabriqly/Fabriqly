import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProductRepository } from '@/repositories/ProductRepository';
import { ResponseBuilder } from '@/utils/ResponseBuilder';

interface StockValidationRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface StockValidationResult {
  isValid: boolean;
  errors: string[];
  outOfStockItems: Array<{
    productId: string;
    productName: string;
    requestedQuantity: number;
    availableQuantity: number;
  }>;
  inactiveItems: Array<{
    productId: string;
    productName: string;
    status: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(ResponseBuilder.error('Authentication required'), { status: 401 });
    }

    const body: StockValidationRequest = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(ResponseBuilder.error('Items array is required'), { status: 400 });
    }

    const productRepository = new ProductRepository();
    const errors: string[] = [];
    const outOfStockItems: StockValidationResult['outOfStockItems'] = [];
    const inactiveItems: StockValidationResult['inactiveItems'] = [];

    // Validate stock and status for each item
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
        continue;
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
        continue;
      }

      try {
        const product = await productRepository.findById(item.productId);
        
        if (!product) {
          errors.push(`Item ${index + 1}: Product not found`);
          continue;
        }

        // Check if product is active
        if (product.status !== 'active') {
          const errorMessage = `"${product.name}" is no longer available (product is ${product.status})`;
          errors.push(`Item ${index + 1}: ${errorMessage}`);
          
          inactiveItems.push({
            productId: item.productId,
            productName: product.name,
            status: product.status
          });
          continue; // Skip stock check for inactive products
        }

        // Check stock availability for active products
        if (product.stockQuantity < item.quantity) {
          const errorMessage = `"${product.name}" is out of stock. Available: ${product.stockQuantity}, Requested: ${item.quantity}`;
          errors.push(`Item ${index + 1}: ${errorMessage}`);
          
          outOfStockItems.push({
            productId: item.productId,
            productName: product.name,
            requestedQuantity: item.quantity,
            availableQuantity: product.stockQuantity
          });
        }
      } catch (error) {
        console.error(`Error checking product ${item.productId}:`, error);
        errors.push(`Item ${index + 1}: Unable to verify product availability`);
      }
    }

    const result: StockValidationResult = {
      isValid: errors.length === 0,
      errors,
      outOfStockItems,
      inactiveItems
    };

    return NextResponse.json(ResponseBuilder.success(result));
  } catch (error) {
    console.error('Error validating stock:', error);
    return NextResponse.json(ResponseBuilder.error('Failed to validate stock'), { status: 500 });
  }
}
