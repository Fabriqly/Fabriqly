import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';
import { CacheService } from '@/services/CacheService';

// GET /api/analytics - Get real analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    // Try to get cached data first
    const cacheKey = `analytics-${timeRange}`;
    const cached = await CacheService.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get data with limits to reduce quota usage
    const [users, products, categories, orders] = await Promise.all([
      FirebaseAdminService.queryDocuments(Collections.USERS, [], { field: 'createdAt', direction: 'desc' }, 1000),
      FirebaseAdminService.queryDocuments(Collections.PRODUCTS, [], { field: 'createdAt', direction: 'desc' }, 1000),
      FirebaseAdminService.queryDocuments(Collections.PRODUCT_CATEGORIES, [], { field: 'createdAt', direction: 'desc' }, 100),
      FirebaseAdminService.queryDocuments(Collections.ORDERS, [], { field: 'createdAt', direction: 'desc' }, 1000)
    ]);

    // Calculate user growth over time
    const userGrowth = await calculateUserGrowth(users, days);

    // Calculate product stats by category
    const productStats = await calculateProductStats(products, categories);

    // Calculate revenue over time
    const revenueData = await calculateRevenueData(orders, days);

    // Get top performing products
    const topProducts = await calculateTopProducts(products, orders);

    const response = {
      userGrowth,
      productStats,
      revenueData,
      topProducts
    };

    // Cache the response for 10 minutes
    await CacheService.set(cacheKey, response, 10 * 60 * 1000);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Calculate real user growth over time
async function calculateUserGrowth(users: any[], days: number) {
  const data = [];
  const now = new Date();
  
  // Group users by creation date
  const usersByDate = new Map();
  users.forEach(user => {
    if (user.createdAt) {
      const date = new Date(user.createdAt);
      const dateStr = date.toISOString().split('T')[0];
      usersByDate.set(dateStr, (usersByDate.get(dateStr) || 0) + 1);
    }
  });

  // Show daily new user registrations for each day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Get new users registered on this specific date
    const newUsers = usersByDate.get(dateStr) || 0;
    
    data.push({
      date: dateStr,
      users: newUsers, // Show daily registrations instead of cumulative
      cumulative: 0 // We'll calculate this if needed
    });
  }

  // Calculate cumulative totals for reference
  let cumulativeUsers = 0;
  const oldestDate = new Date(now);
  oldestDate.setDate(oldestDate.getDate() - days);
  
  // Count users created before our time range
  users.forEach(user => {
    if (user.createdAt) {
      const userDate = new Date(user.createdAt);
      if (userDate < oldestDate) {
        cumulativeUsers++;
      }
    }
  });

  // Add cumulative totals to each data point
  data.forEach(item => {
    item.cumulative = cumulativeUsers;
    cumulativeUsers += item.users;
  });

  return data;
}

// Calculate real product stats by category
async function calculateProductStats(products: any[], categories: any[]) {
  const categoryMap = new Map();
  categories.forEach(category => {
    categoryMap.set(category.id, category.name || category.categoryName);
  });

  const stats = new Map();
  
  products.forEach(product => {
    const categoryId = product.categoryId || product.parentCategoryId;
    const categoryName = categoryMap.get(categoryId) || 'Uncategorized';
    stats.set(categoryName, (stats.get(categoryName) || 0) + 1);
  });

  return Array.from(stats.entries()).map(([category, count]) => ({
    category,
    count
  }));
}

// Calculate real revenue data over time
async function calculateRevenueData(orders: any[], days: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueByMonth = new Map();
  
  // Group orders by month
  orders.forEach(order => {
    if (order.createdAt && order.totalAmount) {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + order.totalAmount);
    }
  });

  // Generate data for last 12 months
  const data = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const revenue = revenueByMonth.get(monthKey) || 0;
    
    data.push({
      month: months[date.getMonth()],
      revenue: Math.floor(revenue)
    });
  }

  return data;
}

// Calculate real top performing products
async function calculateTopProducts(products: any[], orders: any[]) {
  // Group orders by product
  const productStats = new Map();
  
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const productId = item.productId;
        if (productId) {
          if (!productStats.has(productId)) {
            productStats.set(productId, {
              orders: 0,
              revenue: 0,
              views: 0 // We don't have view tracking yet, so use orders as proxy
            });
          }
          
          const stats = productStats.get(productId);
          stats.orders += item.quantity || 1;
          stats.revenue += (item.price || 0) * (item.quantity || 1);
          stats.views += item.quantity || 1; // Use orders as proxy for views
        }
      });
    }
  });

  // Get top 5 products
  const topProducts = Array.from(productStats.entries())
    .map(([productId, stats]) => {
      const product = products.find(p => p.id === productId);
      return {
        id: productId,
        name: product?.name || product?.productName || 'Unknown Product',
        views: stats.views,
        orders: stats.orders,
        revenue: stats.revenue
      };
    })
    .filter(product => product.name !== 'Unknown Product')
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // If we don't have enough products with orders, fill with recent products
  if (topProducts.length < 5) {
    const recentProducts = products
      .filter(product => !topProducts.some(top => top.id === product.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5 - topProducts.length)
      .map(product => ({
        id: product.id,
        name: product.name || product.productName,
        views: 0,
        orders: 0,
        revenue: 0
      }));

    topProducts.push(...recentProducts);
  }

  return topProducts;
}
