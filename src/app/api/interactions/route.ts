import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Video from '@/models/Video';
import UserInteraction from '@/models/UserInteraction';

// POST /api/interactions - Like, Watch Later, or Favorite video
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { uid, videoId, action } = await request.json();

    if (!uid || !videoId || !action) {
      return NextResponse.json(
        { success: false, message: 'UID, video ID, and action are required' },
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

    let interaction = await UserInteraction.findOne({ 
      user: user._id, 
      video: videoId 
    });

    if (!interaction) {
      interaction = await UserInteraction.create({
        user: user._id,
        video: videoId,
        liked: false,
        watchLater: false,
        favorite: false,
        watched: false,
      });
    }

    // Update based on action
    if (action === 'like') {
      interaction.liked = !interaction.liked;
      // Update video likes count
      await Video.findByIdAndUpdate(videoId, {
        $inc: { likes: interaction.liked ? 1 : -1 },
        [interaction.liked ? '$addToSet' : '$pull']: { likedBy: user._id }
      });
    } else if (action === 'watch-later') {
      interaction.watchLater = !interaction.watchLater;
      await User.findByIdAndUpdate(user._id, {
        [interaction.watchLater ? '$addToSet' : '$pull']: { watchLater: videoId }
      });
    } else if (action === 'favorite') {
      interaction.favorite = !interaction.favorite;
      await User.findByIdAndUpdate(user._id, {
        [interaction.favorite ? '$addToSet' : '$pull']: { favorites: videoId }
      });
    }

    await interaction.save();

    return NextResponse.json({
      success: true,
      interaction: {
        liked: interaction.liked,
        watchLater: interaction.watchLater,
        favorite: interaction.favorite,
      },
    });
  } catch (error) {
    console.error('Interaction error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// GET /api/interactions - Get user's interactions
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const uid = request.nextUrl.searchParams.get('uid');
    const type = request.nextUrl.searchParams.get('type'); // 'watch-later', 'liked', 'favorites'

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

    let videoIds = [];
    if (type === 'watch-later') {
      videoIds = user.watchLater;
    } else if (type === 'liked') {
      videoIds = user.likedVideos;
    } else if (type === 'favorites') {
      videoIds = user.favorites;
    }

    const videos = await Video.find({ _id: { $in: videoIds } });

    return NextResponse.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error('Get interactions error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
