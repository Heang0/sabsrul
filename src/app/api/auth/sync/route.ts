import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

// POST /api/auth/sync - Sync Firebase user with MongoDB
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { uid, email, displayName, photoURL } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, message: 'UID and email are required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });

      if (user) {
        // Link Firebase UID to existing user
        user.firebaseUid = uid;
        if (photoURL && !user.avatar) {
          user.avatar = photoURL;
        }
        await user.save();
      } else {
        // Create new user
        // Extract username from email or use display name
        let username = displayName || email.split('@')[0];
        username = username.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        user = await User.create({
          firebaseUid: uid,
          email: email.toLowerCase(),
          username,
          avatar: photoURL || null,
          role: 'user',
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        uid: user.firebaseUid,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during auth sync' },
      { status: 500 }
    );
  }
}

// GET /api/auth/me - Get current user from token
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // For now, we'll get user by UID from Firebase
    // In a real implementation, you'd verify the JWT token
    const uid = token; // This would be extracted from verified token

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
        bio: user.bio,
        role: user.role,
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
