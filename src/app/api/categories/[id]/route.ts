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

    // Handle parent category changes
    let level = existingCategory.level;
    let path = existingCategory.path || [];
    
    if (body.parentId !== undefined && body.parentId !== (existingCategory.parentId || existingCategory.parentCategoryId)) {
      // Prevent self-parenting
      if (body.parentId === categoryId) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        );
      }

      // Check if new parent exists
      if (body.parentId) {
        const newParent = await FirebaseAdminService.getDocument(
          Collections.PRODUCT_CATEGORIES,
          body.parentId
        );
        
        if (!newParent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 400 }
          );
        }

        // Check for circular reference
        if (newParent.path && newParent.path.includes(existingCategory.name || existingCategory.categoryName)) {
          return NextResponse.json(
            { error: 'Cannot create circular category reference' },
            { status: 400 }
          );
        }

        level = newParent.level + 1;
        path = [...(newParent.path || []), body.name || existingCategory.name || existingCategory.categoryName];
        
        // Prevent too deep nesting
        if (level > 5) {
          return NextResponse.json(
            { error: 'Maximum category depth exceeded (5 levels max)' },
            { status: 400 }
          );
        }
      } else {
        // Moving to root level
        level = 0;
        path = [body.name || existingCategory.name || existingCategory.categoryName];
      }
    }

    // Prepare update data - transform to old field format for database compatibility
    const updateData = {
      ...(body.name && { categoryName: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.slug && { slug: body.slug }),
      ...(body.parentId !== undefined && { parentCategoryId: body.parentId }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      level,
      path,
      updatedAt: new Date()
    };

    // Remove id from update data if it exists
    delete updateData.id;

    const updatedCategory = await FirebaseAdminService.updateDocument(
      Collections.PRODUCT_CATEGORIES,
      categoryId,
      updateData
    );

    // Log activity
    try {
      const changedFields = Object.keys(updateData).filter(key => key !== 'updatedAt');
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'category_updated',
        title: 'Category Updated',
        description: `Category "${existingCategory.name || existingCategory.categoryName}" has been updated`,
        priority: 'low',
        status: 'active',
        actorId: session.user.id,
        targetId: categoryId,
        targetType: 'category',
        targetName: existingCategory.name || existingCategory.categoryName,
        metadata: {
          categoryName: existingCategory.name || existingCategory.categoryName,
          changedFields: changedFields,
          updatedBy: session.user.role,
          updatedAt: new Date().toISOString(),
          previousValues: Object.fromEntries(
            changedFields
              .map(field => [field, existingCategory[field as keyof typeof existingCategory]])
              .filter(([_, value]) => value !== undefined)
          ),
          newValues: Object.fromEntries(
            changedFields
              .map(field => [field, updateData[field as keyof typeof updateData]])
              .filter(([_, value]) => value !== undefined)
          )
        }
      });
    } catch (activityError) {
      console.error('Error logging category update activity:', activityError);
      // Don't fail the update if activity logging fails
    }

    // If parent changed, update all children's paths
    if (body.parentCategoryId !== undefined && body.parentCategoryId !== existingCategory.parentCategoryId) {
      await updateChildrenPaths(categoryId, path);
    }

    return NextResponse.json({ category: updatedCategory });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update children paths recursively
async function updateChildrenPaths(parentId: string, parentPath: string[]) {
  const children = await FirebaseAdminService.queryDocuments(
    Collections.PRODUCT_CATEGORIES,
    [{ field: 'parentCategoryId', operator: '==' as const, value: parentId }]
  );

  for (const child of children) {
    const newPath = [...parentPath, child.name || child.categoryName];
    await FirebaseAdminService.updateDocument(
      Collections.PRODUCT_CATEGORIES,
      child.id,
      { 
        path: newPath,
        level: newPath.length - 1,
        updatedAt: new Date()
      }
    );

    // Recursively update grandchildren
    await updateChildrenPaths(child.id, newPath);
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
      [{ field: 'parentCategoryId', operator: '==' as const, value: categoryId }]
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

    // Log activity
    try {
      // Helper function to filter out undefined values
      const filterUndefined = (obj: any) => {
        const filtered: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            filtered[key] = value;
          }
        }
        return filtered;
      };

      const metadata = filterUndefined({
        categoryName: existingCategory.name || existingCategory.categoryName,
        slug: existingCategory.slug,
        parentId: existingCategory.parentCategoryId,
        level: existingCategory.level,
        path: existingCategory.path,
        deletedBy: session.user.role,
        deletedAt: new Date().toISOString()
      });

      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'category_deleted',
        title: 'Category Deleted',
        description: `Category "${existingCategory.name || existingCategory.categoryName}" has been deleted`,
        priority: 'high',
        status: 'active',
        actorId: session.user.id,
        targetId: categoryId,
        targetType: 'category',
        targetName: existingCategory.name || existingCategory.categoryName,
        metadata
      });
    } catch (activityError) {
      console.error('Error logging category deletion activity:', activityError);
      // Don't fail the deletion if activity logging fails
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

