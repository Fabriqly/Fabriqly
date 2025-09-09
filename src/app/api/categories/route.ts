import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { 
  Category, 
  CreateCategoryData, 
  UpdateCategoryData 
} from '@/types/products';

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const parentId = searchParams.get('parentId');

    // Build query constraints
    const constraints = [];
    
    if (!includeInactive) {
      constraints.push({ field: 'isActive', operator: '==' as const, value: true });
    }
    
    if (parentId) {
      constraints.push({ field: 'parentId', operator: '==' as const, value: parentId });
    } else if (parentId === '') {
      // Get only root categories (no parent)
      constraints.push({ field: 'parentId', operator: '==' as const, value: null });
    }

    const categories = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_CATEGORIES,
      constraints,
      { field: 'name', direction: 'asc' }
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: CreateCategoryData = await request.json();
    
    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCategory = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_CATEGORIES,
      [{ field: 'slug', operator: '==' as const, value: body.slug }]
    );

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    const categoryData: Omit<Category, 'id'> = {
      name: body.name,
      description: body.description,
      parentId: body.parentId,
      slug: body.slug,
      isActive: body.isActive !== false, // Default to true
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const category = await FirebaseAdminService.createDocument(
      Collections.PRODUCT_CATEGORIES,
      categoryData
    );

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

