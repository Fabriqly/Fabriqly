import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

// GET /api/categories/breadcrumbs/[id] - Get breadcrumb path for a category
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: categoryId } = await params;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const breadcrumbs = await getCategoryBreadcrumbs(categoryId);
    
    return NextResponse.json({ breadcrumbs });
  } catch (error) {
    console.error('Error fetching category breadcrumbs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to build breadcrumb path
async function getCategoryBreadcrumbs(categoryId: string): Promise<any[]> {
  const breadcrumbs: any[] = [];
  let currentId = categoryId;

  while (currentId) {
    const category = await FirebaseAdminService.getDocument(
      Collections.PRODUCT_CATEGORIES,
      currentId
    );

    if (!category) break;

    breadcrumbs.unshift({
      id: category.id,
      name: category.categoryName,
      slug: category.slug,
      level: category.level
    });

    currentId = category.parentCategoryId;
  }

  return breadcrumbs;
}
