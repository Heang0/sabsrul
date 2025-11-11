const Video = require('../models/Video');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { deleteFromR2 } = require('../utils/r2Upload'); // ✅ KEEP ONLY THIS ONE
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const fs = require('fs');
const path = require('path');

// R2 Client configuration
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
// Generate thumbnails from specific video
exports.generateThumbnailsFromVideo = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🎬 Starting thumbnail generation for video:', id);
        
        // Find the video
        let video;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            video = await Video.findById(id);
        } else {
            video = await Video.findOne({ shortId: id });
        }
        
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }
        
        if (!video.videoUrl) {
            return res.status(400).json({ message: 'Video URL not found' });
        }
        
        console.log('📹 Video found:', video.title);
        console.log('🔗 Video URL:', video.videoUrl);
        
        // Download video from R2 to temp file
        console.log('📥 Downloading video from R2...');
        const videoResponse = await fetch(video.videoUrl);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.status}`);
        }
        
        const videoBuffer = await videoResponse.arrayBuffer();
        const tempVideoPath = `./temp_thumbs/video_${Date.now()}.mp4`;
        fs.writeFileSync(tempVideoPath, Buffer.from(videoBuffer));
        
        console.log('✅ Video downloaded, generating frames...');
        
        // Generate 6 random frames from THIS video only
        const thumbBuffers = await new Promise((resolve, reject) => {
            // First get video duration to generate proper timestamps
            ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
                if (err) {
                    console.error('❌ FFprobe error:', err);
                    reject(err);
                    return;
                }
                
                const duration = metadata.format.duration;
                console.log('⏱️ Video duration:', duration, 'seconds');
                
                // Generate 6 random timestamps within the video
                const timestamps = [];
                for (let i = 0; i < 6; i++) {
                    const randomTime = Math.random() * duration * 0.8 + duration * 0.1; // Avoid first and last 10%
                    timestamps.push(randomTime);
                }
                
                console.log('🕒 Generating frames at timestamps:', timestamps.map(t => t.toFixed(1)));
                
                // Generate thumbnails at random timestamps
                ffmpeg(tempVideoPath)
                    .screenshots({
                        timestamps: timestamps,
                        filename: 'edit_thumb_%i.jpg',
                        folder: './temp_thumbs',
                        size: '800x450'
                    })
                    .on('start', (commandLine) => {
                        console.log('🚀 FFmpeg started:', commandLine);
                    })
                    .on('end', () => {
                        console.log('✅ Thumbnails generated from video');
                        const buffers = [];
                        try {
                            // Read generated thumbnails
                            for (let i = 0; i < timestamps.length; i++) {
                                const thumbPath = `./temp_thumbs/edit_thumb_${i + 1}.jpg`;
                                if (fs.existsSync(thumbPath)) {
                                    const buffer = fs.readFileSync(thumbPath);
                                    buffers.push(buffer);
                                    console.log(`📸 Thumbnail ${i + 1} size:`, buffer.length, 'bytes');
                                    // Clean up individual thumbnail file
                                    fs.unlinkSync(thumbPath);
                                }
                            }
                            
                            // Clean up temp video file
                            if (fs.existsSync(tempVideoPath)) {
                                fs.unlinkSync(tempVideoPath);
                            }
                            
                            console.log(`✅ Generated ${buffers.length} thumbnails`);
                            resolve(buffers);
                        } catch (fileError) {
                            console.error('❌ File processing error:', fileError);
                            reject(fileError);
                        }
                    })
                    .on('error', (error) => {
                        console.error('❌ Thumbnail generation error:', error);
                        // Clean up on error
                        try {
                            if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
                        } catch (cleanupError) {
                            console.error('Cleanup error:', cleanupError);
                        }
                        reject(error);
                    });
            });
        });
        
        // Upload thumbnails to R2 and return URLs
        const thumbnailUrls = [];
        console.log('☁️ Uploading thumbnails to R2...');
        
        for (let i = 0; i < thumbBuffers.length; i++) {
            const thumbKey = `thumbnails/edit_${Date.now()}_${i + 1}.jpg`;
            const thumbUploadParams = {
                Bucket: process.env.R2_BUCKET_NAME,
                Key: thumbKey,
                Body: thumbBuffers[i],
                ContentType: 'image/jpeg',
                ACL: 'public-read'
            };
            
            await r2Client.send(new PutObjectCommand(thumbUploadParams));
            const thumbUrl = `${process.env.R2_PUBLIC_URL}/${thumbKey}`;
            thumbnailUrls.push(thumbUrl);
            console.log(`✅ Thumbnail ${i + 1} uploaded:`, thumbUrl);
        }
        
        console.log('🎉 Successfully generated', thumbnailUrls.length, 'thumbnails from video');
        
        res.json({
            success: true,
            thumbnails: thumbnailUrls,
            message: `Generated ${thumbnailUrls.length} thumbnails from video`
        });
        
    } catch (error) {
        console.error('❌ Error generating thumbnails from video:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error generating thumbnails: ' + error.message 
        });
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

// UPLOAD VIDEO WITHOUT COMPRESSION BUT KEEP 6 THUMBNAILS
exports.uploadVideo = async (req, res) => {
  try {
    console.log('📤 Uploading video to Cloudflare R2 (No compression)...');
    
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const { title, description, category, tags } = req.body;
    const videoFile = req.files.video[0];

    console.log('📁 Video size:', (videoFile.buffer.length / 1024 / 1024).toFixed(2), 'MB');

    // 🚀 UPLOAD ORIGINAL VIDEO DIRECTLY (NO COMPRESSION)
    const videoKey = `videos/${Date.now()}_${videoFile.originalname}`;
    const videoUploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: videoKey,
      Body: videoFile.buffer, // Use original buffer
      ContentType: videoFile.mimetype,
      ACL: 'public-read'
    };

    console.log('☁️ Uploading original video to R2...');
    await r2Client.send(new PutObjectCommand(videoUploadParams));
    const videoUrl = `${process.env.R2_PUBLIC_URL}/${videoKey}`;
    console.log('✅ Video uploaded to R2:', videoUrl);

    // GENERATE 6 THUMBNAILS AT DIFFERENT TIMESTAMPS (KEEP ORIGINAL SETTINGS)
    let thumbnails = [];
    let selectedThumbnailUrl = `${process.env.R2_PUBLIC_URL}/default-thumbnail.jpg`;

    try {
      console.log('🖼️ Generating 6 thumbnails from original video...');
      
      // Use original video for thumbnails
      const tempVideoPath = `./temp_thumbs/video_${Date.now()}.mp4`;
      fs.writeFileSync(tempVideoPath, videoFile.buffer);
      console.log('📁 Temporary video file created for thumbnails');

      // Generate 6 thumbnails at different timestamps (ORIGINAL SETTINGS)
      const thumbBuffers = await new Promise((resolve, reject) => {
        console.log('🎬 Starting ffmpeg thumbnail generation...');
        
        ffmpeg(tempVideoPath)
          .screenshots({
            count: 6, // Keep 6 thumbnails
            timestamps: ['10%', '25%', '40%', '55%', '70%', '85%'], // Original timestamps
            filename: 'thumb_%i.jpg',
            folder: './temp_thumbs',
            size: '800x450' // Original size
          })
          .on('start', (commandLine) => {
            console.log('🚀 FFmpeg thumbnail process started');
          })
          .on('end', () => {
            console.log('✅ 6 thumbnails generated successfully');
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
      console.log('☁️ Uploading 6 thumbnails to R2...');
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
      
      // FALLBACK - Create 6 placeholder thumbnails
      for (let i = 0; i < 6; i++) {
        thumbnails.push(`https://via.placeholder.com/800x450/1a1a1a/6b7280?text=${encodeURIComponent(title)}+${i + 1}`);
      }
      selectedThumbnailUrl = thumbnails[0];
      
      console.log('🔄 Using fallback thumbnails');
    }

    // EXTRACT VIDEO DURATION from original video
    let videoDuration = 0;
    let durationTempPath = '';
    
    try {
        console.log('⏱️ Extracting video duration from original video...');
        
        // Create a temporary file for duration extraction
        durationTempPath = `./temp_thumbs/duration_${Date.now()}.mp4`;
        fs.writeFileSync(durationTempPath, videoFile.buffer);

        // Get duration using ffprobe
        const durationInfo = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(durationTempPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
            });
        });
        
        videoDuration = Math.round(durationInfo.format.duration);
        console.log('⏱️ Video duration extracted:', videoDuration, 'seconds');
        
        // Clean up duration temp file
        if (fs.existsSync(durationTempPath)) {
            fs.unlinkSync(durationTempPath);
        }
        
    } catch (durationError) {
        console.log('⚠️ Could not extract duration:', durationError.message);
        
        // Estimate duration based on file size (fallback)
        const fileSizeMB = videoFile.buffer.length / (1024 * 1024);
        const estimatedMinutes = Math.max(1, Math.round(fileSizeMB / 2));
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

  // In the uploadVideo function, when creating the video:
const video = new Video({
    title,
    description: description || '',
    videoUrl: videoUrl,
    thumbnail: selectedThumbnailUrl,
    thumbnails: thumbnails,
    duration: videoDuration,
    category: category.toLowerCase(),
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    views: 0,
    likes: 0,
    status: 'published',
    fileSize: videoFile.buffer.length,
    uploadedBy: req.user ? req.user._id : null // Add this line
});

    await video.save();
    console.log('✅ Video saved to database:', video._id);
    
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully with 6 thumbnails!',
      video: {
        id: video._id,
        title: video.title,
        url: video.videoUrl,
        thumbnail: selectedThumbnailUrl,
        allThumbnails: thumbnails
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



// Update the deleteVideo function with detailed logging
exports.deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log('🗑️ Starting video deletion process for:', videoId);
    
    const video = await Video.findById(videoId);
    if (!video) {
      console.log('❌ Video not found in database:', videoId);
      return res.status(404).json({ message: 'Video not found' });
    }

    console.log('📹 Video found:', {
      title: video.title,
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail,
      thumbnailsCount: video.thumbnails?.length || 0
    });

    // Extract R2 key from URL - IMPROVED VERSION
    const extractR2Key = (url) => {
      if (!url || typeof url !== 'string') {
        console.log('❌ Invalid URL provided:', url);
        return null;
      }
      
      try {
        // Handle both full URLs and relative paths
        if (url.includes(process.env.R2_PUBLIC_URL)) {
          // Full R2 URL
          const urlObj = new URL(url);
          return urlObj.pathname.substring(1); // Remove leading slash
        } else if (url.startsWith('videos/') || url.startsWith('thumbnails/')) {
          // Already a key
          return url;
        } else {
          // Try to extract from any URL format
          const parts = url.split('/');
          const keyIndex = parts.findIndex(part => part === 'videos' || part === 'thumbnails');
          if (keyIndex !== -1) {
            return parts.slice(keyIndex).join('/');
          }
          console.log('❌ Could not extract R2 key from URL:', url);
          return null;
        }
      } catch (error) {
        console.log('❌ URL parsing error:', error.message, 'URL:', url);
        return null;
      }
    };

    const deletionResults = {
      video: false,
      thumbnail: false,
      additionalThumbs: 0,
      errors: []
    };

    // Delete video file from R2
    if (video.videoUrl) {
      const videoKey = extractR2Key(video.videoUrl);
      console.log('🎬 Video key extracted:', videoKey);
      
      if (videoKey) {
        try {
          console.log('🚀 Attempting to delete video from R2...');
          const videoDeleteResult = await deleteFromR2(videoKey);
          if (videoDeleteResult.success) {
            console.log('✅ Video file deleted from R2');
            deletionResults.video = true;
          } else {
            console.log('❌ Failed to delete video from R2:', videoDeleteResult.error);
            deletionResults.errors.push(`Video: ${videoDeleteResult.error}`);
          }
        } catch (error) {
          console.log('❌ Exception deleting video:', error);
          deletionResults.errors.push(`Video exception: ${error.message}`);
        }
      } else {
        console.log('⚠️ No video key extracted, skipping R2 deletion');
      }
    }

    // Delete main thumbnail from R2
    if (video.thumbnail) {
      const thumbnailKey = extractR2Key(video.thumbnail);
      console.log('🖼️ Thumbnail key extracted:', thumbnailKey);
      
      if (thumbnailKey) {
        try {
          console.log('🚀 Attempting to delete thumbnail from R2...');
          const thumbDeleteResult = await deleteFromR2(thumbnailKey);
          if (thumbDeleteResult.success) {
            console.log('✅ Thumbnail deleted from R2');
            deletionResults.thumbnail = true;
          } else {
            console.log('❌ Failed to delete thumbnail from R2:', thumbDeleteResult.error);
            deletionResults.errors.push(`Thumbnail: ${thumbDeleteResult.error}`);
          }
        } catch (error) {
          console.log('❌ Exception deleting thumbnail:', error);
          deletionResults.errors.push(`Thumbnail exception: ${error.message}`);
        }
      } else {
        console.log('⚠️ No thumbnail key extracted, skipping R2 deletion');
      }
    }

    // Delete additional thumbnails from R2
    if (video.thumbnails && Array.isArray(video.thumbnails)) {
      console.log('📸 Processing additional thumbnails:', video.thumbnails.length);
      
      for (const thumbUrl of video.thumbnails) {
        const thumbKey = extractR2Key(thumbUrl);
        if (thumbKey && thumbKey !== extractR2Key(video.thumbnail)) {
          console.log('🖼️ Additional thumbnail key:', thumbKey);
          try {
            const thumbDeleteResult = await deleteFromR2(thumbKey);
            if (thumbDeleteResult.success) {
              console.log('✅ Additional thumbnail deleted from R2');
              deletionResults.additionalThumbs++;
            } else {
              console.log('❌ Failed to delete additional thumbnail:', thumbDeleteResult.error);
              deletionResults.errors.push(`Additional thumb: ${thumbDeleteResult.error}`);
            }
          } catch (error) {
            console.log('❌ Exception deleting additional thumbnail:', error);
            deletionResults.errors.push(`Additional thumb exception: ${error.message}`);
          }
        }
      }
    }

    // Finally, delete from database
    console.log('🗃️ Deleting video from database...');
    await Video.findByIdAndDelete(videoId);
    
    console.log('🎉 Deletion completed. Summary:', deletionResults);
    
    res.json({ 
      success: true,
      message: 'Video deleted successfully',
      r2Deletion: deletionResults
    });
    
  } catch (error) {
    console.error('❌ Error in deleteVideo:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting video: ' + error.message 
    });
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



// Extract frames
exports.extractFrames = async (req, res) => {
  try {
    res.json({ message: 'Frame extraction feature coming soon' });
  } catch (error) {
    res.status(500).json({ message: 'Error extracting frames: ' + error.message });
  }
  };

  