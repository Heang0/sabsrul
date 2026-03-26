import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Video from '@/models/Video';

// Comment schema inline (you can create a separate model file)
const CommentSchema = {
  user: { type: String, required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
};

// GET /api/comments - Get comments for a video
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { success: false, message: 'Video ID is required' },
        { status: 400 }
      );
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Get comments from video document (stored as array)
    const comments = video.comments || [];

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Add comment to video
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { videoId, uid, text } = await request.json();

    if (!videoId || !uid || !text) {
      return NextResponse.json(
        { success: false, message: 'Video ID, user ID, and comment text are required' },
        { status: 400 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, message: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Create comment
    const comment = {
      user: user._id,
      username: user.username || user.email.split('@')[0],
      avatar: user.avatar,
      text: text.trim(),
      createdAt: new Date(),
    };

    // Add comment to video
    if (!video.comments) {
      video.comments = [];
    }
    video.comments.push(comment);
    await video.save();

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments - Delete comment
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const commentId = searchParams.get('commentId');

    if (!videoId || !commentId) {
      return NextResponse.json(
        { success: false, message: 'Video ID and comment ID are required' },
        { status: 400 }
      );
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Remove comment from array
    if (video.comments && video.comments.id(commentId)) {
      video.comments.id(commentId).remove();
      await video.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
