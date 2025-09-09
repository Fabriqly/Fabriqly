import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { Category, UpdateCategoryData } from '@/types/products';

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

    const category = await FirebaseAdminService.getDocument(
      Collections.PRODUCT_CATEGORIES,
      categoryId
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Get the existing category
    const existingCategory = await FirebaseAdminService.getDocument(
      Collections.PRODUCT_CATEGORIES,
      categoryId
    );

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it already exists
    if (body.slug && body.slug !== existingCategory.slug) {
      const existingSlug = await FirebaseAdminService.queryDocuments(
        Collections.PRODUCT_CATEGORIES,
        [{ field: 'slug', operator: '==' as const, value: body.slug }]
      );

      if (existingSlug.length > 0) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove id from update data if it exists
    delete updateData.id;

    const updatedCategory = await FirebaseAdminService.updateDocument(
      Collections.PRODUCT_CATEGORIES,
      categoryId,
      updateData
    );

    return NextResponse.json({ category: updatedCategory });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

    // Check if category exists
    const existingCategory = await FirebaseAdminService.getDocument(
      Collections.PRODUCT_CATEGORIES,
      categoryId
    );

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if there are products using this category
    const productsInCategory = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCTS,
      [{ field: 'categoryId', operator: '==' as const, value: categoryId }]
    );

    if (productsInCategory.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has products. Please reassign or delete products first.' },
        { status: 400 }
      );
    }

    // Check if there are subcategories
    const subcategories = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_CATEGORIES,
      [{ field: 'parentId', operator: '==' as const, value: categoryId }]
    );

    if (subcategories.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has subcategories. Please delete subcategories first.' },
        { status: 400 }
      );
    }

    // Delete the category
    await FirebaseAdminService.deleteDocument(
      Collections.PRODUCT_CATEGORIES,
      categoryId
    );

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

