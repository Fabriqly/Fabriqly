import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserService } from '@/services/UserService';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/[id] - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const userService = new UserService();
    const user = await userService.getUser(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch user'
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Users can only update their own profile unless they're admin
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Can only update your own profile' },
        { status: 403 }
      );
    }

    const userService = new UserService();
    const updatedUser = await userService.updateUser(id, body, session.user.id);

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update user'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = params;

    const userService = new UserService();
    await userService.deleteUser(id, session.user.id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete user'
      },
      { status: 500 }
    );
  }
}
