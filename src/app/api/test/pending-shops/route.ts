import { NextRequest, NextResponse } from 'next/server';
import { ShopProfileRepository } from '@/repositories/ShopProfileRepository';

// Initialize repository
const shopProfileRepository = new ShopProfileRepository();

// DEBUG ENDPOINT - Test pending shops fetch
export async function GET(request: NextRequest) {
  try {
    console.log('Testing pending shops fetch...');
    
    // Try to get all shops first
    const allShops = await shopProfileRepository.findAll();
    console.log('Total shops in database:', allShops.length);
    
    // Try to get pending shops
    const pendingShops = await shopProfileRepository.findPendingApproval();
    console.log('Pending shops found:', pendingShops.length);
    
    return NextResponse.json({
      success: true,
      total: allShops.length,
      pending: pendingShops.length,
      allShops: allShops.map(s => ({
        id: s.id,
        shopName: s.shopName,
        username: s.username,
        approvalStatus: s.approvalStatus,
        isActive: s.isActive
      })),
      pendingShops: pendingShops.map(s => ({
        id: s.id,
        shopName: s.shopName,
        username: s.username,
        approvalStatus: s.approvalStatus,
        isActive: s.isActive
      }))
    });
  } catch (error: any) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

