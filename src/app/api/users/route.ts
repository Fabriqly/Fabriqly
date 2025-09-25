import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseAdminService } from '@/services/firebase-admin';
import { Collections } from '@/services/firebase';

// GET /api/users - List all users (admin only)
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
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query constraints
    const constraints = [];
    
    if (role) {
      constraints.push({ field: 'role', operator: '==' as const, value: role });
    }

    const users = await FirebaseAdminService.queryDocuments(
      Collections.USERS,
      constraints,
      { field: 'createdAt', direction: 'desc' },
      limit
    );

    // Map user documents to the expected frontend structure
    const mappedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.displayName || 
            `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() ||
            'No name',
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile
    }));

    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = params;

    // Validate required fields
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role' },
        { status: 400 }
      );
    }

    // Get existing user data for activity logging
    const existingUser = await FirebaseAdminService.getDocument(Collections.USERS, id);
    
    // Update user document
    const updatedUser = await FirebaseAdminService.updateDocument(
      Collections.USERS,
      id,
      {
        name: body.name,
        email: body.email,
        role: body.role,
        isVerified: body.isVerified || false,
        updatedAt: new Date()
      }
    );

    // Update user role in Firebase Auth if needed
    if (body.role) {
      await FirebaseAdminService.updateUserRole(id, body.role);
    }

    // Log activity
    try {
      console.log('Logging user update activity...');
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'user_updated',
        title: 'User Updated',
        description: `User "${body.name}" has been updated`,
        priority: 'low',
        status: 'active',
        actorId: session.user.id,
        targetId: id,
        targetType: 'user',
        targetName: body.name,
        metadata: {
          userName: body.name,
          email: body.email,
          role: body.role,
          isVerified: body.isVerified,
          updatedBy: session.user.role,
          updatedAt: new Date().toISOString(),
          previousValues: {
            name: existingUser?.name,
            email: existingUser?.email,
            role: existingUser?.role,
            isVerified: existingUser?.isVerified
          }
        }
      });
      console.log('✅ User update activity logged successfully');
    } catch (activityError) {
      console.error('❌ Error logging user update activity:', activityError);
      // Don't fail the update if activity logging fails
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get existing user data for activity logging
    const existingUser = await FirebaseAdminService.getDocument(Collections.USERS, id);

    // Delete user
    await FirebaseAdminService.deleteUser(id);

    // Log activity
    try {
      console.log('Logging user deletion activity...');
      await FirebaseAdminService.createDocument(Collections.ACTIVITIES, {
        type: 'user_deleted',
        title: 'User Deleted',
        description: `User "${existingUser?.name || existingUser?.email || 'Unknown'}" has been deleted`,
        priority: 'high',
        status: 'active',
        actorId: session.user.id,
        targetId: id,
        targetType: 'user',
        targetName: existingUser?.name || existingUser?.email || 'Unknown',
        metadata: {
          userName: existingUser?.name,
          email: existingUser?.email,
          role: existingUser?.role,
          deletedBy: session.user.role,
          deletedAt: new Date().toISOString()
        }
      });
      console.log('✅ User deletion activity logged successfully');
    } catch (activityError) {
      console.error('❌ Error logging user deletion activity:', activityError);
      // Don't fail the deletion if activity logging fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}