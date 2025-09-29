import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';

// POST /api/admin/create-snapshots - Create historical snapshots for testing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('📅 Creating historical snapshots...');
    
    // Get current data from collections
    const [users, products, orders, categories] = await Promise.all([
      FirebaseAdminService.queryDocuments('users', [], { field: 'createdAt', direction: 'desc' }, 100),
      FirebaseAdminService.queryDocuments('products', [], { field: 'createdAt', direction: 'desc' }, 100),
      FirebaseAdminService.queryDocuments('orders', [], { field: 'createdAt', direction: 'desc' }, 100),
      FirebaseAdminService.queryDocuments('productCategories', [], { field: 'createdAt', direction: 'desc' }, 100)
    ]);

    const currentUsers = users.length;
    const currentProducts = products.length;
    const currentOrders = orders.length;
    const currentCategories = categories.length;
    const currentRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const activeProducts = products.filter(p => p.status === 'active').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    console.log('📊 Current metrics:', {
      users: currentUsers,
      products: currentProducts,
      orders: currentOrders,
      categories: currentCategories,
      revenue: currentRevenue,
      activeProducts,
      pendingOrders
    });

    // Create snapshots for the past 7 days
    const today = new Date();
    const snapshots = [];
    
    for (let i = 7; i >= 0; i--) {
      const snapshotDate = new Date(today);
      snapshotDate.setDate(snapshotDate.getDate() - i);
      const dateString = snapshotDate.toISOString().split('T')[0];
      
      // Calculate realistic historical values (gradually increasing over time)
      const growthFactor = Math.max(0.1, (8 - i) / 8); // 0.125 to 1 (1 being today)
      
      // Ensure minimum values for better percentage calculations
      const snapshotData = {
        date: dateString,
        totalUsers: Math.max(2, Math.round(currentUsers * growthFactor)),
        totalProducts: i > 4 ? Math.max(0, Math.round(currentProducts * growthFactor)) : 0, // Products started 3 days ago
        totalCategories: Math.max(1, Math.round(currentCategories * growthFactor)),
        totalOrders: Math.max(0, Math.round(currentOrders * growthFactor)),
        totalRevenue: Math.max(0, Math.round(currentRevenue * growthFactor)),
        activeProducts: i > 4 ? Math.max(0, Math.round(activeProducts * growthFactor)) : 0,
        pendingOrders: Math.max(0, Math.round(pendingOrders * growthFactor)),
        createdAt: snapshotDate
      };
      
      await FirebaseAdminService.createDocument('dashboardSnapshots', snapshotData);
      snapshots.push(snapshotData);
      
      console.log(`📸 Created snapshot for ${dateString}:`);
      console.log(`   Users: ${snapshotData.totalUsers}, Products: ${snapshotData.totalProducts}, Categories: ${snapshotData.totalCategories}`);
    }

    // Calculate expected percentages
    const yesterdaySnapshot = snapshots[snapshots.length - 2];
    const todaySnapshot = snapshots[snapshots.length - 1];
    
    const userChange = yesterdaySnapshot.totalUsers > 0 ? 
      ((todaySnapshot.totalUsers - yesterdaySnapshot.totalUsers) / yesterdaySnapshot.totalUsers) * 100 : 0;
    
    const productChange = yesterdaySnapshot.totalProducts > 0 ? 
      ((todaySnapshot.totalProducts - yesterdaySnapshot.totalProducts) / yesterdaySnapshot.totalProducts) * 100 :
      todaySnapshot.totalProducts > 0 ? 100 : 0;

    console.log('🎯 Expected percentage changes:');
    console.log(`  - Users: ${Math.round(userChange)}%`);
    console.log(`  - Products: ${Math.round(productChange)}%`);
    
    return NextResponse.json({
      success: true,
      message: 'Historical snapshots created successfully',
      snapshotsCreated: snapshots.length,
      expectedChanges: {
        users: Math.round(userChange),
        products: Math.round(productChange),
        categories: Math.round(((todaySnapshot.totalCategories - yesterdaySnapshot.totalCategories) / yesterdaySnapshot.totalCategories) * 100)
      }
    });

  } catch (error) {
    console.error('Error creating snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshots' },
      { status: 500 }
    );
  }
}
