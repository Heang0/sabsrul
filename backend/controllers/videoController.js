const Video = require('../models/Video');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const fs = require('fs');
const path = require('path');

// Configure Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

// Video compression function
const compressVideo = (inputBuffer, outputPath) => {
  return new Promise((resolve, reject) => {
    // Save buffer to temp file first
    const tempInputPath = `./temp_thumbs/input_${Date.now()}.mp4`;
    fs.writeFileSync(tempInputPath, inputBuffer);

    console.log('🎬 Starting video compression...');
    
    ffmpeg(tempInputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-crf 23', // Constant Rate Factor (23 is good balance)
        '-preset medium', // Encoding speed vs compression
        '-movflags +faststart', // Enable streaming
        '-maxrate 1000k', // Maximum bitrate
        '-bufsize 2000k' // Buffer size
      ])
      .on('start', (commandLine) => {
        console.log('🚀 FFmpeg compression started');
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`📊 Compression progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('✅ Video compression completed');
        // Read compressed video
        const compressedBuffer = fs.readFileSync(outputPath);
        
        // Cleanup temp files
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(outputPath);
        
        resolve(compressedBuffer);
      })
      .on('error', (error) => {
        console.error('❌ Compression error:', error);
        
        // Cleanup on error
        try {
          if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        
        reject(error);
      })
      .save(outputPath);
  });
};

// Get all videos - FIXED WITH CATEGORY FILTER
exports.getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    // Build filter object - ADD CATEGORY FILTERING
    let filter = { status: 'published' };
    
    // Only add category filter if provided and not 'all'
    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
      console.log(`🔍 Filtering videos by category: ${category}`);
    }

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments(filter);

    console.log(`📊 API Response: ${videos.length} videos for category: ${category || 'all'}`);

    res.json({
      videos,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalVideos: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos: ' + error.message });
  }
};

exports.getVideo = async (req, res) => {
    try {
        const { id } = req.params;
        
        let video;
        
        // Check if it's a valid MongoDB ObjectId (24 character hex string)
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            video = await Video.findById(id);
        } else {
            // If not ObjectId, search by shortId
            video = await Video.findOne({ shortId: id });
        }
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json(video);
    } catch (error) {
        console.error('Error fetching video:', error);
        res.status(500).json({ error: 'Server error fetching video' });
    }
};

// Search videos - IMPROVED
exports.searchVideos = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'published' };
    
    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    // Category filter - FIXED: Only apply if category is provided
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    console.log(`🔍 Search query:`, query);

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Video.countDocuments(query);
    
    res.json({
      videos,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalVideos: total,
      query: q || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching videos: ' + error.message });
  }
};

exports.getRelatedVideos = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First, find the current video to get its category
        let currentVideo;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            currentVideo = await Video.findById(id);
        } else {
            currentVideo = await Video.findOne({ shortId: id });
        }
        
        if (!currentVideo) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        // Find related videos (same category, exclude current video)
        const relatedVideos = await Video.find({
            category: currentVideo.category,
            _id: { $ne: currentVideo._id }, // Exclude current video
            status: 'published'
        }).limit(10).sort({ createdAt: -1 });
        
        res.json(relatedVideos);
    } catch (error) {
        console.error('Error fetching related videos:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Temporary function to add shortId to existing videos
exports.addShortIdsToExistingVideos = async (req, res) => {
    try {
        const videos = await Video.find({ shortId: { $exists: false } });
        console.log(`Found ${videos.length} videos without shortId`);
        
        for (let video of videos) {
            // Generate a short ID (you can use any method)
            const shortId = Math.random().toString(36).substr(2, 9);
            video.shortId = shortId;
            await video.save();
            console.log(`Added shortId ${shortId} to video: ${video.title}`);
        }
        
        res.json({ message: `Added shortIds to ${videos.length} videos` });
    } catch (error) {
        console.error('Error adding shortIds:', error);
        res.status(500).json({ error: 'Failed to add shortIds' });
    }
};
exports.incrementViews = async (req, res) => {
    try {
        const { id } = req.params;
        
        let video;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            video = await Video.findById(id);
        } else {
            video = await Video.findOne({ shortId: id });
        }
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        video.views += 1;
        await video.save();
        
        res.json({ views: video.views });
    } catch (error) {
        console.error('Error incrementing views:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.likeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        
        let video;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            video = await Video.findById(id);
        } else {
            video = await Video.findOne({ shortId: id });
        }
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        video.likes += 1;
        await video.save();
        
        res.json({ likes: video.likes });
    } catch (error) {
        console.error('Error liking video:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// UPLOAD VIDEO WITH COMPRESSION AND AUTO-THUMBNAILS
exports.uploadVideo = async (req, res) => {
  try {
    console.log('📤 Uploading video to Cloudflare R2...');
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const { title, description, category, tags, selectedThumbnail } = req.body;
    const videoFile = req.files.video[0];

    console.log('🖼️ Starting video processing...');
    console.log('📁 Original video size:', (videoFile.buffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Ensure temp directory exists
    const tempDir = './temp_thumbs';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // COMPRESS VIDEO BEFORE UPLOAD
    let finalVideoBuffer = videoFile.buffer;
    const compressedVideoPath = `./temp_thumbs/compressed_${Date.now()}.mp4`;
    
    try {
      console.log('🎬 Compressing video (10-20% size reduction)...');
      finalVideoBuffer = await compressVideo(videoFile.buffer, compressedVideoPath);
      console.log('✅ Video compressed. New size:', (finalVideoBuffer.length / 1024 / 1024).toFixed(2), 'MB');
      
      const sizeReduction = ((videoFile.buffer.length - finalVideoBuffer.length) / videoFile.buffer.length * 100).toFixed(1);
      console.log(`📉 Size reduced by: ${sizeReduction}%`);
      
    } catch (compressionError) {
      console.log('⚠️ Compression failed, using original video:', compressionError.message);
      // Continue with original video if compression fails
      finalVideoBuffer = videoFile.buffer;
    }

    // Upload COMPRESSED video to R2
    const videoKey = `videos/${Date.now()}_${videoFile.originalname.replace(/\.[^/.]+$/, '')}_compressed.mp4`;
    const videoUploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: videoKey,
      Body: finalVideoBuffer,
      ContentType: videoFile.mimetype,
      ACL: 'public-read'
    };

    console.log('☁️ Uploading compressed video to R2...');
    await r2Client.send(new PutObjectCommand(videoUploadParams));
    const videoUrl = `${process.env.R2_PUBLIC_URL}/${videoKey}`;
    console.log('✅ Compressed video uploaded to R2:', videoUrl);

    // GENERATE 6 THUMBNAILS AT DIFFERENT TIMESTAMPS
    let thumbnails = [];
    let selectedThumbnailUrl = `${process.env.R2_PUBLIC_URL}/default-thumbnail.jpg`;

    try {
      console.log('🖼️ Generating 6 thumbnails from compressed video...');
      
      // Use compressed video for thumbnails (smaller = faster processing)
      const tempVideoPath = `./temp_thumbs/video_${Date.now()}.mp4`;
      fs.writeFileSync(tempVideoPath, finalVideoBuffer);
      console.log('📁 Temporary compressed video file created for thumbnails');

      // Generate 6 thumbnails at different timestamps
      const thumbBuffers = await new Promise((resolve, reject) => {
        console.log('🎬 Starting ffmpeg thumbnail generation...');
        
        ffmpeg(tempVideoPath)
          .screenshots({
            count: 6,
            timestamps: ['10%', '25%', '40%', '55%', '70%', '85%'],
            filename: 'thumb_%i.jpg',
            folder: tempDir,
            size: '800x450'
          })
          .on('start', (commandLine) => {
            console.log('🚀 FFmpeg thumbnail process started');
          })
          .on('end', () => {
            console.log('✅ Thumbnails generated successfully');
            const buffers = [];
            try {
              // Read generated thumbnails
              for (let i = 1; i <= 6; i++) {
                const thumbPath = `./temp_thumbs/thumb_${i}.jpg`;
                if (fs.existsSync(thumbPath)) {
                  const buffer = fs.readFileSync(thumbPath);
                  buffers.push(buffer);
                  // Clean up individual thumbnail file
                  fs.unlinkSync(thumbPath);
                }
              }
              
              // Clean up temp video file
              fs.unlinkSync(tempVideoPath);
              
              if (buffers.length > 0) {
                resolve(buffers);
              } else {
                reject(new Error('No thumbnails were generated'));
              }
            } catch (fileError) {
              reject(fileError);
            }
          })
          .on('error', (error) => {
            console.error('❌ FFmpeg thumbnail error:', error.message);
            // Clean up on error
            try {
              if (fs.existsSync(tempVideoPath)) {
                fs.unlinkSync(tempVideoPath);
              }
            } catch (cleanupError) {
              console.error('Cleanup error:', cleanupError);
            }
            reject(error);
          });
      });

      console.log('✅ Thumbnail buffers created:', thumbBuffers.length);

      // Upload all 6 thumbnails to R2
      console.log('☁️ Uploading thumbnails to R2...');
      for (let i = 0; i < thumbBuffers.length; i++) {
        const thumbKey = `thumbnails/${Date.now()}_thumb_${i + 1}.jpg`;
        const thumbUploadParams = {
          Bucket: process.env.R2_BUCKET_NAME,
          Key: thumbKey,
          Body: thumbBuffers[i],
          ContentType: 'image/jpeg',
          ACL: 'public-read'
        };

        await r2Client.send(new PutObjectCommand(thumbUploadParams));
        const thumbUrl = `${process.env.R2_PUBLIC_URL}/${thumbKey}`;
        thumbnails.push(thumbUrl);
        
        console.log(`✅ Thumbnail ${i + 1} uploaded:`, thumbUrl);
        
        // Use first thumbnail as default selected
        if (i === 0) {
          selectedThumbnailUrl = thumbUrl;
        }
      }

      console.log('✅ All 6 thumbnails generated and uploaded');

    } catch (thumbError) {
      console.log('⚠️ Thumbnail generation failed:', thumbError.message);
      
      // SIMPLE FALLBACK - No category colors needed
      for (let i = 0; i < 6; i++) {
        thumbnails.push(`https://via.placeholder.com/800x450/1a1a1a/6b7280?text=${encodeURIComponent(title)}+${i + 1}`);
      }
      selectedThumbnailUrl = thumbnails[0];
      
      console.log('🔄 Using fallback thumbnails');
    }

    // Use selected thumbnail if provided, otherwise use first one
    const finalThumbnail = selectedThumbnail || selectedThumbnailUrl;

    // EXTRACT VIDEO DURATION from compressed video
    let videoDuration = 0;
    let durationTempPath = '';
    
    try {
        console.log('⏱️ Extracting video duration from compressed video...');
        
        // Create a new temporary file for duration extraction
        durationTempPath = `./temp_thumbs/duration_${Date.now()}.mp4`;
        fs.writeFileSync(durationTempPath, finalVideoBuffer);
        console.log('📁 Duration temp file created:', fs.existsSync(durationTempPath));

        // Get duration using ffprobe
        const durationInfo = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(durationTempPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
            });
        });
        
        videoDuration = Math.round(durationInfo.format.duration); // Duration in seconds
        console.log('⏱️ Video duration extracted:', videoDuration, 'seconds');
        
        // Clean up duration temp file
        if (fs.existsSync(durationTempPath)) {
            fs.unlinkSync(durationTempPath);
            console.log('✅ Duration temp file cleaned up');
        }
        
    } catch (durationError) {
        console.log('⚠️ Could not extract duration:', durationError.message);
        
        // Estimate duration based on file size (fallback)
        const fileSizeMB = finalVideoBuffer.length / (1024 * 1024);
        const estimatedMinutes = Math.max(1, Math.round(fileSizeMB / 2)); // ~2MB per minute
        videoDuration = estimatedMinutes * 60;
        console.log('⏱️ Using estimated duration:', videoDuration, 'seconds');
        
        // Clean up on error
        if (durationTempPath && fs.existsSync(durationTempPath)) {
            try {
                fs.unlinkSync(durationTempPath);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
    }

    // Create video in database
    const video = new Video({
        title,
        description: description || '',
        videoUrl: videoUrl,
        thumbnail: finalThumbnail,
        thumbnails: thumbnails,
        duration: videoDuration,
        category: category.toLowerCase(),
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        views: 0,
        likes: 0,
        status: 'published',
        fileSize: finalVideoBuffer.length, // Store compressed file size
        originalFileSize: videoFile.buffer.length // Store original size for comparison
    });

    await video.save();
    console.log('✅ Video saved to database:', video._id);
    
    res.status(201).json({
      success: true,
      message: 'Video compressed and uploaded with 6 auto-thumbnails!',
      video: {
        id: video._id,
        title: video.title,
        url: video.videoUrl,
        thumbnail: finalThumbnail,
        allThumbnails: thumbnails,
        originalSize: (videoFile.buffer.length / 1024 / 1024).toFixed(2),
        compressedSize: (finalVideoBuffer.length / 1024 / 1024).toFixed(2),
        sizeReduction: ((videoFile.buffer.length - finalVideoBuffer.length) / videoFile.buffer.length * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Upload failed: ' + error.message 
    });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const { title, description, category, tags, status, thumbnail } = req.body;
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category: category?.toLowerCase(),
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
        status,
        thumbnail: thumbnail || undefined
      },
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json({ message: 'Video updated successfully', video });
  } catch (error) {
    res.status(500).json({ message: 'Error updating video: ' + error.message });
  }
};

// Get videos for admin (including drafts)
exports.getAdminVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const status = req.query.status; // NEW: Add status filter
    const search = req.query.q;
    const skip = (page - 1) * limit;

    // Build filter object for admin
    let filter = {};
    
    // Status filter
    if (status && status !== '') {
      filter.status = status;
    }
    
    // Category filter
    if (category && category !== '') {
      filter.category = category.toLowerCase();
    }
    
    // Search filter
    if (search && search !== '') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log(`🔍 Admin fetching videos with filter:`, filter);

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments(filter);

    res.json({
      videos,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalVideos: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin videos: ' + error.message });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting video: ' + error.message });
  }
};

// Extract frames
exports.extractFrames = async (req, res) => {
  try {
    res.json({ message: 'Frame extraction feature coming soon' });
  } catch (error) {
    res.status(500).json({ message: 'Error extracting frames: ' + error.message });
  }
  };

  