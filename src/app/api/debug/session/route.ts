import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// DEBUG ENDPOINT - Remove in production!
// GET /api/debug/session - Check session structure
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'No session found',
        session: null
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Session found',
      session: {
        user: session.user,
        availableIdFields: {
          id: (session.user as any).id,
          uid: (session.user as any).uid,
          sub: (session.user as any).sub,
          email: (session.user as any).email,
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

