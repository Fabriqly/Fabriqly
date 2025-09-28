// app/api/users/update-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();

    // Validate role
    const validRoles = ['customer', 'designer', 'business_owner'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    console.log('Updating role for user:', session.user.id, 'to role:', role);

    const userDocRef = adminDb.collection('users').doc(session.user.id);
    
    try {
      // Try to update first
      await userDocRef.update({
        role: role,
        hasExplicitlySelectedRole: true,
        profileCompleted: true,
        updatedAt: new Date()
      });
      console.log('Role updated successfully for existing user:', session.user.id);
    } catch (updateError) {
      console.log('User document does not exist, creating new one...');
      
      const userData = {
        email: session.user.email,
        displayName: session.user.name,
        role: role,
        hasExplicitlySelectedRole: true,
        profileCompleted: true,
        isVerified: true,
        profile: {
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          preferences: {
            notifications: {
              email: true,
              sms: false,
              push: true
            },
            theme: 'light'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await userDocRef.set(userData);
      console.log('User document created successfully for:', session.user.id, 'with role:', role);
    }

    // Return success with instructions for client-side session refresh
    return NextResponse.json({ 
      success: true, 
      role,
      message: 'Role updated successfully',
      // Tell client to refresh session
      refreshSession: true
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update role', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}