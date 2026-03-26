import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Playlist from '@/models/Playlist';
import User from '@/models/User';

// GET /api/playlists - Get user's playlists
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

    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const playlists = await Playlist.find({ user: user._id })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      playlists,
    });
  } catch (error) {
    console.error('Get playlists error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// POST /api/playlists - Create new playlist
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, description, isPublic, uid } = await request.json();

    if (!uid || !name) {
      return NextResponse.json(
        { success: false, message: 'User ID and playlist name are required' },
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

    const playlist = await Playlist.create({
      name,
      description: description || '',
      isPublic: isPublic !== undefined ? isPublic : false,
      user: user._id,
      videos: [],
    });

    return NextResponse.json({
      success: true,
      playlist: {
        _id: playlist._id,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.isPublic,
        videos: playlist.videos,
      },
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/playlists - Delete playlist
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    await Playlist.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Playlist deleted',
    });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
