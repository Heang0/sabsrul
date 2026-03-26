import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Video from '@/models/Video';
import { uploadToR2 } from '@/lib/r2';

// POST /api/videos/upload - Upload video (Admin)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // TODO: Add admin authentication check

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;

    if (!videoFile || !title || !category) {
      return NextResponse.json(
        { success: false, message: 'Video, title, and category are required' },
        { status: 400 }
      );
    }

    // Get video metadata
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const duration = await getVideoDurationFromBuffer(videoBuffer);

    // Upload video to R2
    const videoFileName = `videos/video_${Date.now()}_${videoFile.name}`;
    const videoUploadResult = await uploadToR2(
      videoBuffer,
      videoFileName,
      'videos',
      videoFile.type
    );

    if (!videoUploadResult.success || !videoUploadResult.url) {
      throw new Error('Failed to upload video to R2');
    }

    // Handle thumbnail
    let thumbnailUrl = `${process.env.R2_PUBLIC_URL}/default-thumbnail.jpg`;
    if (thumbnailFile) {
      const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      const thumbFileName = `thumbnails/thumb_${Date.now()}`;
      const thumbUploadResult = await uploadToR2(
        thumbnailBuffer,
        thumbFileName,
        'thumbnails',
        thumbnailFile.type
      );

      if (thumbUploadResult.success && thumbUploadResult.url) {
        thumbnailUrl = thumbUploadResult.url;
      }
    }

    // Generate shortId
    const shortId = Math.random().toString(36).substr(2, 9);

    // Create video document
    const video = await Video.create({
      title,
      description: description || '',
      shortId,
      videoUrl: videoUploadResult.url!,
      thumbnail: thumbnailUrl,
      duration: duration || 0,
      category: category.toLowerCase(),
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      uploadedBy: 'ADMIN_USER_ID', // TODO: Replace with actual user ID from auth
      status: 'published',
      fileSize: videoBuffer.length,
      originalQuality: '480', // TODO: Detect actual quality
    });

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Upload video error:', error);
    return NextResponse.json(
      { success: false, message: 'Error uploading video' },
      { status: 500 }
    );
  }
}

// Helper function to get video duration (simplified - returns 0 if can't determine)
async function getVideoDurationFromBuffer(buffer: Buffer): Promise<number> {
  // In a real implementation, you would use ffprobe or a similar tool
  // For now, we'll return 0 and update it later if needed
  // You can also process this in a background job
  return 0;
}
