import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ServiceContainer } from '@/container/ServiceContainer';
import { CategoryService } from '@/services/CategoryService';
import { 
  Category, 
  CreateCategoryData, 
  UpdateCategoryData 
} from '@/types/products';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    console.log('Categories API called with URL:', request.url);
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const parentId = searchParams.get('parentId');
    const level = searchParams.get('level');
    const format = searchParams.get('format') || 'flat'; // 'flat' or 'tree'

    console.log('Categories API params:', { includeInactive, parentId, level, format });

    const categoryService = ServiceContainer.getInstance().get<CategoryService>('categoryService');

    let categories: Category[] = [];

    if (format === 'tree') {
      console.log('Getting category hierarchy...');
      const hierarchy = await categoryService.getCategoryHierarchy();
      console.log('Category hierarchy result:', hierarchy);
      // Return the full hierarchy structure, not just the categories
      return NextResponse.json(ResponseBuilder.success({ hierarchy }));
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

    console.log('Final categories to return:', categories);
    return NextResponse.json(ResponseBuilder.success({ categories }));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
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
    const categoryService = ServiceContainer.getInstance().get<CategoryService>('categoryService');

    const category = await categoryService.createCategory(body, session.user.id);

    return NextResponse.json(ResponseBuilder.created(category), { status: 201 });
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}
