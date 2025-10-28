const Video = require('../models/Video');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');

const getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const category = req.query.category;
    const skip = (page - 1) * limit;

    let query = {};
    if (category && category !== 'all') {
      query.category = category;
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Video.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      videos,
      currentPage: page,
      totalPages,
      totalVideos: total,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const searchVideos = async (req, res) => {
  try {
    const query = req.query.q;
    const videos = await Video.find({
      $text: { $search: query }
    }).limit(20);

    res.json({ videos });
  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRelatedVideos = async (req, res) => {
  try {
    const currentVideo = await Video.findById(req.params.id);
    if (!currentVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const relatedVideos = await Video.find({
      _id: { $ne: currentVideo._id },
      category: currentVideo.category
    }).limit(6);

    res.json(relatedVideos);
  } catch (error) {
    console.error('Get related videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const incrementViews = async (req, res) => {
  try {
    await Video.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 }
    });
    res.json({ message: 'View count updated' });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const likeVideo = async (req, res) => {
  try {
    await Video.findByIdAndUpdate(req.params.id, {
      $inc: { likes: 1 }
    });
    res.json({ message: 'Like added' });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// SIMPLE UPLOAD - Auto thumbnail from Cloudinary
const uploadVideo = async (req, res) => {
    try {
        console.log('📤 Uploading video...');
        
        if (!req.files || !req.files.video) {
            return res.status(400).json({ message: 'Video file is required' });
        }

        const { title, description, category, tags } = req.body;
        
        if (!title || !category) {
            return res.status(400).json({ message: 'Title and category are required' });
        }

        console.log('📝 Video details:', { title, category });

        console.log('☁️ Uploading video to Cloudinary...');
        
        // Upload video to Cloudinary
        const videoUpload = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'video',
                    folder: 'sabsrul/videos',
                    quality: 'auto',
                    fetch_format: 'auto'
                },
                (error, result) => {
                    if (error) {
                        console.error('❌ Cloudinary video upload error:', error);
                        reject(error);
                    } else {
                        console.log('✅ Video uploaded to Cloudinary');
                        resolve(result);
                    }
                }
            );
            
            const bufferStream = new stream.PassThrough();
            bufferStream.end(req.files.video[0].buffer);
            bufferStream.pipe(uploadStream);
        });

        console.log('✅ Video uploaded, duration:', videoUpload.duration);

        // AUTO-GENERATED THUMBNAIL: Cloudinary automatically creates a thumbnail
        // Just use the video URL with jpg extension - Cloudinary handles it
        const thumbnailUrl = videoUpload.secure_url.replace(/\.(mp4|mov|avi|mkv|webm)$/, '.jpg');

        console.log('✅ Auto-generated thumbnail:', thumbnailUrl);

        // Get video duration from Cloudinary
        const duration = Math.round(videoUpload.duration) || 0;

        // Create video in database
        const video = new Video({
            title,
            description,
            videoUrl: videoUpload.secure_url,
            thumbnail: thumbnailUrl,
            duration,
            category: category.toLowerCase(),
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            views: 0,
            likes: 0,
            status: 'published',
            cloudinaryPublicId: videoUpload.public_id
        });

        await video.save();

        console.log('✅ Video saved to database:', video._id);
        
        res.status(201).json({
            message: 'Video uploaded successfully',
            video: {
                id: video._id,
                title: video.title,
                url: video.videoUrl,
                thumbnail: video.thumbnail,
                duration: video.duration
            }
        });

    } catch (error) {
        console.error('❌ Video upload error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
};

const updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(video);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteVideo = async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove frame extraction completely
const extractFrames = async (req, res) => {
    console.log('⏩ Frame extraction skipped - using auto-thumbnails');
    res.json({
        message: 'Auto-thumbnail mode enabled',
        frames: [] // Return empty frames array
    });
};

module.exports = {
  getVideos,
  getVideo,
  uploadVideo,
  updateVideo,
  deleteVideo,
  incrementViews,
  likeVideo,
  searchVideos,
  getRelatedVideos,
  extractFrames
};