import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CategoryService } from '@/services/CategoryService';
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
    const level = searchParams.get('level');
    const format = searchParams.get('format') || 'flat'; // 'flat' or 'tree'

    const categoryService = new CategoryService();

    let categories: Category[] = [];

    if (format === 'tree') {
      const hierarchy = await categoryService.getCategoryHierarchy();
      categories = hierarchy.map(item => item.category);
    } else if (parentId !== null) {
      if (parentId === '') {
        categories = await categoryService.getRootCategories();
      } else {
        categories = await categoryService.getSubcategories(parentId);
      }
    } else if (level !== null) {
      // Get categories by level
      const allCategories = await categoryService.getCategories();
      categories = allCategories.filter(cat => cat.level === parseInt(level));
    } else {
      categories = await categoryService.getCategories();
    }

    // Filter out inactive categories if not requested
    if (!includeInactive) {
      categories = categories.filter(cat => cat.isActive);
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch categories'
      },
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
    const categoryService = new CategoryService();

    const category = await categoryService.createCategory(body, session.user.id);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create category'
      },
      { status: 500 }
    );
  }
}
