import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

// GET /api/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Users can only view their own profile unless they're admin
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Can only view your own profile' },
        { status: 403 }
      );
    }

    const user = await FirebaseAdminService.getDocument(Collections.USERS, id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = params;

    // Users can only update their own profile unless they're admin
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Can only update your own profile' },
        { status: 403 }
      );
    }

    // Non-admin users cannot change their role
    if (session.user.role !== 'admin' && body.role) {
      delete body.role;
    }

    const updatedUser = await FirebaseAdminService.updateDocument(
      Collections.USERS,
      id,
      {
        ...body,
        updatedAt: new Date()
      }
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Users can only delete their own account unless they're admin
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Can only delete your own account' },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (id === session.user.id && session.user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await FirebaseAdminService.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}