import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Video from '@/models/Video';
import User from '@/models/User';
import UserInteraction from '@/models/UserInteraction';

// GET /api/analytics - Get analytics data (Admin)
export async function GET() {
  try {
    await connectDB();

    // Get total counts
    const totalVideos = await Video.countDocuments();
    const totalUsers = await User.countDocuments();
    const publishedVideos = await Video.countDocuments({ status: 'published' });
    const draftVideos = await Video.countDocuments({ status: 'draft' });

    // Get total views and likes
    const videos = await Video.find().select('views likes');
    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);

    // Get recent videos
    const recentVideos = await Video.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title views likes createdAt');

    // Get top videos by views
    const topVideos = await Video.find()
      .sort({ views: -1 })
      .limit(5)
      .select('title views likes');

    // Get category distribution
    const categoryStats = await Video.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalVideos,
          totalUsers,
          publishedVideos,
          draftVideos,
          totalViews,
          totalLikes,
        },
        recentVideos,
        topVideos,
        categoryStats,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching analytics' },
      { status: 500 }
    );
  }
}
