import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ServiceContainer } from '@/container/ServiceContainer';
import { UserService } from '@/services/UserService';
import { ResponseBuilder } from '@/utils/ResponseBuilder';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { ConversationRepository } from '@/repositories/ConversationRepository';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/users/conversation/[id] - Get user info for conversation participants
// This endpoint allows users to fetch basic info about other users they have conversations with
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify that the requested user is in a conversation with the current user
    const conversationRepo = new ConversationRepository();
    const conversations = await conversationRepo.findByUserId(session.user.id);
    
    const hasConversation = conversations.some(conv => 
      conv.participants.includes(session.user.id) && conv.participants.includes(id)
    );

    if (!hasConversation) {
      return NextResponse.json(
        { error: 'Unauthorized - No conversation found with this user' },
        { status: 403 }
      );
    }

    // Fetch user info
    const userService = ServiceContainer.getInstance().get<UserService>('userService');
    const user = await userService.getUser(id);

    if (!user) {
      return NextResponse.json(
        ResponseBuilder.error(ErrorHandler.handle(new Error('User not found'))),
        { status: 404 }
      );
    }

    // Return only safe, public user info
    const publicUserInfo = {
      id: user.id,
      displayName: user.displayName || user.name || user.email || 'Unknown',
      name: user.name,
      email: user.email,
      photoURL: user.profile?.avatar || user.photoURL,
      role: user.role,
      profile: {
        avatar: user.profile?.avatar
      }
    };

    return NextResponse.json(ResponseBuilder.success(publicUserInfo));
  } catch (error) {
    const appError = ErrorHandler.handle(error);
    return NextResponse.json(
      ResponseBuilder.error(appError),
      { status: appError.statusCode }
    );
  }
}

