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

// GET /api/categories - List all categories with hierarchical support
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const parentId = searchParams.get('parentId');
    const level = searchParams.get('level');
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const format = searchParams.get('format') || 'flat'; // 'flat' or 'tree'

    // Build query constraints
    const constraints = [];
    
    // Temporarily remove isActive filter to avoid index requirement
    // TODO: Create Firestore index for isActive + sortOrder
    // if (!includeInactive) {
    //   constraints.push({ field: 'isActive', operator: '==' as const, value: true });
    // }
    
    if (parentId !== null) {
      if (parentId === '') {
        // Get only root categories (no parent)
        constraints.push({ field: 'parentCategoryId', operator: '==' as const, value: null });
      } else {
        constraints.push({ field: 'parentCategoryId', operator: '==' as const, value: parentId });
      }
    }
    
    if (level !== null) {
      constraints.push({ field: 'level', operator: '==' as const, value: parseInt(level) });
    }

    const categories = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_CATEGORIES,
      constraints,
      { field: 'sortOrder', direction: 'asc' }
    );

    // Transform categories from old format to new format
    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name || cat.categoryName, // Handle both old and new formats
      description: cat.description,
      slug: cat.slug,
      parentId: cat.parentId || cat.parentCategoryId, // Handle both old and new formats
      isActive: cat.isActive !== false,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      // Keep additional fields for backward compatibility
      ...(cat.level !== undefined && { level: cat.level }),
      ...(cat.path && { path: cat.path }),
      ...(cat.sortOrder !== undefined && { sortOrder: cat.sortOrder }),
      ...(cat.iconUrl && { iconUrl: cat.iconUrl })
    }));

    // Filter by isActive in memory to avoid index requirement
    const filteredCategories = !includeInactive 
      ? transformedCategories.filter(cat => cat.isActive !== false)
      : transformedCategories;

    if (format === 'tree' || includeChildren) {
      // Build hierarchical tree structure
      const categoryTree = await buildCategoryTree(filteredCategories, includeChildren);
      return NextResponse.json({ categories: categoryTree });
    }

    return NextResponse.json({ categories: filteredCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to build category tree
async function buildCategoryTree(categories: any[], includeChildren: boolean = false) {
  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: []
    });
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category.id);
    
    if (category.parentCategoryId) {
      const parent = categoryMap.get(category.parentCategoryId);
      if (parent) {
        parent.children.push(categoryNode);
      }
    } else {
      rootCategories.push(categoryNode);
    }
  });

  // If includeChildren is false, remove children from non-root categories
  if (!includeChildren) {
    const removeChildren = (node: any) => {
      if (node.children && node.children.length > 0) {
        node.children = node.children.map((child: any) => {
          const { children, ...childWithoutChildren } = child;
          return childWithoutChildren;
        });
      }
    };
    
    rootCategories.forEach(removeChildren);
  }

  return rootCategories;
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

    // Calculate level and path based on parent
    let level = 0;
    let path: string[] = [body.name];
    
    if (body.parentId) {
      const parentCategory = await FirebaseAdminService.getDocument(
        Collections.PRODUCT_CATEGORIES,
        body.parentId
      );
      
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }
      
      level = parentCategory.level + 1;
      path = [...parentCategory.path, body.name];
      
      // Prevent too deep nesting (max 5 levels)
      if (level > 5) {
        return NextResponse.json(
          { error: 'Maximum category depth exceeded (5 levels max)' },
          { status: 400 }
        );
      }
    }

    // Get next sort order
    const siblings = await FirebaseAdminService.queryDocuments(
      Collections.PRODUCT_CATEGORIES,
      [{ field: 'parentCategoryId', operator: '==' as const, value: body.parentId || null }]
    );
    const sortOrder = siblings.length;

    const categoryData = {
      categoryName: body.name, // Store as categoryName for backward compatibility
      description: body.description,
      slug: body.slug,
      ...(body.parentId && { parentCategoryId: body.parentId }), // Store as parentCategoryId
      isActive: body.isActive !== false, // Default to true
      sortOrder: sortOrder, // Add sortOrder for backward compatibility
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

