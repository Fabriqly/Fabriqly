import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = params.id;
    
    // Users can only access their own data unless they're admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const user = await adminDb.collection('users').doc(userId).get();
    
    if (!user.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: { id: user.id, ...user.data() } });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    
    // Users can only update their own data unless they're admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // If updating role, only admin can do it
    if (body.role && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update user roles' },
        { status: 403 }
      );
    }

    // Add updatedAt timestamp
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    await adminDb.collection('users').doc(userId).update(updateData);
    
    // If role was updated, use admin service to update custom claims
    if (body.role && session.user.role === 'admin') {
      await FirebaseAdminService.updateUserRole(userId, body.role);
    }

    // Get the updated user data
    const updatedUser = await adminDb.collection('users').doc(userId).get();
    
    return NextResponse.json({ user: { id: updatedUser.id, ...updatedUser.data() } });
  } catch (error) {
    console.error('Error updating user:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: params.id,
      requestBody: 'Request body not available in error context'
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = params.id;
    
    await FirebaseAdminService.deleteUser(userId);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
