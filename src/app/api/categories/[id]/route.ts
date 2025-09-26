import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CategoryService } from '@/services/CategoryService';
import { UpdateCategoryData } from '@/types/products';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/categories/[id] - Get a single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const categoryId = params.id;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const categoryService = new CategoryService();
    const category = await categoryService.getCategory(categoryId);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
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

    const categoryId = params.id;
    const body: UpdateCategoryData = await request.json();

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const categoryService = new CategoryService();
    const updatedCategory = await categoryService.updateCategory(categoryId, body, session.user.id);

    return NextResponse.json({ category: updatedCategory });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
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

    const categoryId = params.id;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const categoryService = new CategoryService();
    await categoryService.deleteCategory(categoryId, session.user.id);

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}
