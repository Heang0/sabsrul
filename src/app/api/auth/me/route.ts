import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// GET /api/auth/me - Get current authenticated user info
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get Firebase UID from query params or cookies
    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'UID is required' },
        { status: 400 }
      );
    }

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUid: uid }).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        uid: user.firebaseUid,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
