import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { uploadToR2 } from '@/lib/r2';

// PUT /api/users/update-profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { uid, username } = await request.json();

    if (!uid || !username) {
      return NextResponse.json(
        { success: false, message: 'UID and username are required' },
        { status: 400 }
      );
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, message: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Check if username is taken
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      firebaseUid: { $ne: uid }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username already taken' },
        { status: 400 }
      );
    }

    // Update user
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { username: username.toLowerCase() } },
      { new: true }
    );

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
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// POST /api/users/upload-avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const avatar = formData.get('avatar') as File;
    const uid = formData.get('uid') as string;

    console.log('Avatar upload request:', {
      hasAvatar: !!avatar,
      hasUid: !!uid,
      uid,
      fileName: avatar?.name,
      fileSize: avatar?.size,
      fileType: avatar?.type,
    });

    if (!avatar || !uid) {
      console.error('Missing avatar or uid');
      return NextResponse.json(
        { success: false, message: 'Avatar and UID are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await avatar.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('Uploading to R2...');

    // Upload to R2
    const uploadResult = await uploadToR2(
      buffer,
      `${uid}_${Date.now()}`,
      'avatars',
      avatar.type
    );

    console.log('R2 upload result:', uploadResult);

    if (!uploadResult.success || !uploadResult.url) {
      console.error('R2 upload failed:', uploadResult.error);
      return NextResponse.json(
        { success: false, message: 'Failed to upload avatar: ' + uploadResult.error },
        { status: 500 }
      );
    }

    // Update user in database
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { avatar: uploadResult.url } },
      { new: true }
    );

    console.log('User updated:', user ? 'Yes' : 'No');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      avatarUrl: uploadResult.url,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/users/me - Get current user info
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'UID is required' },
        { status: 400 }
      );
    }

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
        username: user.username,
        email: user.email,
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
