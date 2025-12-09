import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ServiceContainer } from '@/container/ServiceContainer';
import { CategoryService } from '@/services/CategoryService';
import { UpdateCategoryData } from '@/types/products';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/categories/[id] - Get a single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        ResponseBuilder.error(ErrorHandler.handle(new Error('Category ID is required'))),
        { status: 400 }
      );
    }

    const categoryService = ServiceContainer.getInstance().get<CategoryService>('categoryService');
    const category = await categoryService.getCategory(categoryId);

    if (!category) {
      return NextResponse.json(
        ResponseBuilder.error(ErrorHandler.handle(new Error('Category not found'))),
        { status: 404 }
      );
    }

    return NextResponse.json(ResponseBuilder.success(category));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

// PUT /api/categories/[id] - Update a category (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;
    const body: UpdateCategoryData = await request.json();

    if (!categoryId) {
      return NextResponse.json(
        ResponseBuilder.error(ErrorHandler.handle(new Error('Category ID is required'))),
        { status: 400 }
      );
    }

    const categoryService = ServiceContainer.getInstance().get<CategoryService>('categoryService');
    const updatedCategory = await categoryService.updateCategory(categoryId, body, session.user.id);

    return NextResponse.json(ResponseBuilder.success(updatedCategory));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        ResponseBuilder.error(ErrorHandler.handle(new Error('Category ID is required'))),
        { status: 400 }
      );
    }

    const categoryService = ServiceContainer.getInstance().get<CategoryService>('categoryService');
    await categoryService.deleteCategory(categoryId, session.user.id);

    return NextResponse.json(ResponseBuilder.success({ message: 'Category deleted successfully' }));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}
