import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Video from '@/models/Video';

// GET /api/videos/[id] - Get single video by ID or shortId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    // Find video by ObjectId or shortId
    let video;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      video = await Video.findById(id);
    } else {
      video = await Video.findOne({ shortId: id });
    }

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Get video error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching video' },
      { status: 500 }
    );
  }
}

// PUT /api/videos/[id] - Update video (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // TODO: Add admin authentication check

    const video = await Video.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating video' },
      { status: 500 }
    );
  }
}

// DELETE /api/videos/[id] - Delete video (Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const { deleteFromR2 } = await import('@/lib/r2');

    // TODO: Add admin authentication check

    const video = await Video.findById(id);

    if (!video) {
      return NextResponse.json(
        { success: false, message: 'Video not found' },
        { status: 404 }
      );
    }

    // Extract R2 key from URL
    const extractR2Key = (url: string) => {
      try {
        const urlObj = new URL(url);
        const r2PublicUrl = process.env.R2_PUBLIC_URL;
        if (r2PublicUrl && url.includes(r2PublicUrl)) {
          return url.replace(`${r2PublicUrl}/`, '');
        }
        if (url.includes('.r2.dev/')) {
          return url.split('.r2.dev/')[1];
        }
      } catch {
        // Invalid URL
      }
      return null;
    };

    // Delete video file from R2
    if (video.videoUrl) {
      const videoKey = extractR2Key(video.videoUrl);
      if (videoKey) {
        await deleteFromR2(videoKey);
      }
    }

    // Delete thumbnail from R2
    if (video.thumbnail) {
      const thumbnailKey = extractR2Key(video.thumbnail);
      if (thumbnailKey) {
        await deleteFromR2(thumbnailKey);
      }
    }

    // Delete additional thumbnails
    if (video.thumbnails && video.thumbnails.length > 0) {
      for (const thumbUrl of video.thumbnails) {
        const thumbKey = extractR2Key(thumbUrl);
        if (thumbKey) {
          await deleteFromR2(thumbKey);
        }
      }
    }

    // Delete from database
    await Video.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting video' },
      { status: 500 }
    );
  }
}
