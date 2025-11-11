const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// ⭐ ADD THESE MISSING IMPORTS:
const Video = require('../models/Video'); // Add this line
const User = require('../models/User');   // Add this line

// --- Public/Frontend Routes ---

// @route   GET /api/videos
// @desc    Get all videos (supports pagination/filtering for frontend)
// @access  Public
router.get('/', videoController.getVideos);

// @route   GET /api/videos/:id
// @desc    Get a single video by ID
// @access  Public
router.get('/:id', videoController.getVideo);

// @route   GET /api/videos/search/videos
// @desc    Search videos
// @access  Public
router.get('/search/videos', videoController.searchVideos);

// @route   GET /api/videos/related/:id
// @desc    Get related videos
// @access  Public
router.get('/related/:id', videoController.getRelatedVideos);

// @route   POST /api/videos/:id/view
// @desc    Increment video views
// @access  Public
router.post('/:id/view', videoController.incrementViews);

// @route   POST /api/videos/:id/like
// @desc    Like a video
// @access  Public
router.post('/:id/like', videoController.likeVideo);

// --- Admin Routes (Protected by auth middleware) ---

// @route   POST /api/videos/upload
// @desc    Upload a new video to Google Drive
// @access  Private (Admin)
router.post(
    '/upload', 
    auth, 
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]), 
    videoController.uploadVideo
);
// @route   GET /api/videos/admin/all
// @desc    Get all videos for admin (including drafts)
// @access  Private (Admin)
router.get('/admin/all', auth, videoController.getAdminVideos);
// @route   PUT /api/videos/:id
// @desc    Update video metadata
// @access  Private (Admin)
router.put('/:id', auth, videoController.updateVideo);

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private (Admin)
router.delete('/:id', auth, videoController.deleteVideo);

// @route   POST /api/videos/extract-frames/:id
// @desc    Extract frames from video (placeholder)
// @access  Private (Admin)
router.post('/extract-frames/:id', auth, videoController.extractFrames);
// @route   GET /api/videos/admin/all
// @desc    Get all videos for admin (including drafts)
// @access  Private/Admin
// Add this route for generating thumbnails from specific video
router.post('/:id/generate-thumbnails', auth, videoController.generateThumbnailsFromVideo);

// @route   POST /api/videos/:id/regenerate-thumbnails
// @desc    Create dynamic thumbnails from actual video data
// @access  Private/Admin
router.post('/:id/regenerate-thumbnails', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Check if user is admin
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        console.log('🎬 Creating dynamic thumbnails for:', video.title);

        // Get ALL videos to create truly dynamic thumbnails
        const allVideos = await Video.find().limit(50).lean();
        
        // Create 6 thumbnails from ACTUAL videos in your database
        const thumbnails = createDynamicThumbnails(video, allVideos);
        
        console.log('✅ Generated dynamic thumbnails from real videos');

        res.json({
            success: true,
            thumbnails: thumbnails,
            message: '6 thumbnails created from your video library'
        });

    } catch (error) {
        console.error('Thumbnail generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating thumbnails: ' + error.message
        });
    }
});

// Create thumbnails from ACTUAL videos in your database
function createDynamicThumbnails(currentVideo, allVideos) {
    const thumbnails = [];
    
    // Filter out the current video
    const otherVideos = allVideos.filter(v => v._id.toString() !== currentVideo._id.toString());
    
    // Method 1: Use thumbnails from other similar videos
    if (otherVideos.length >= 6) {
        // Get 6 random videos from your database
        const randomVideos = getRandomVideos(otherVideos, 6);
        thumbnails.push(...randomVideos.map(v => v.thumbnail));
    } 
    // Method 2: Use current video + variations if not enough other videos
    else if (otherVideos.length > 0) {
        // Add current video thumbnail
        thumbnails.push(currentVideo.thumbnail);
        
        // Add other available videos
        thumbnails.push(...otherVideos.map(v => v.thumbnail));
        
        // Fill remaining slots with variations
        const needed = 6 - thumbnails.length;
        for (let i = 0; i < needed; i++) {
            thumbnails.push(createThumbnailVariation(currentVideo.thumbnail, i));
        }
    }
    // Method 3: Create variations from current video only
    else {
        thumbnails.push(currentVideo.thumbnail);
        for (let i = 1; i < 6; i++) {
            thumbnails.push(createThumbnailVariation(currentVideo.thumbnail, i));
        }
    }
    
    return thumbnails.filter(thumb => thumb && thumb.trim() !== '');
}

// Get random videos from array
function getRandomVideos(videos, count) {
    const shuffled = [...videos].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Create variation of a thumbnail
function createThumbnailVariation(thumbnail, index) {
    if (!thumbnail) return 'https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=300&h=169&fit=crop';
    
    // Add parameters to create visual variations
    const variations = [
        `${thumbnail}?mod=brightness&v=1`,
        `${thumbnail}?mod=contrast&v=2`, 
        `${thumbnail}?mod=saturation&v=3`,
        `${thumbnail}?mod=blur&v=4`,
        `${thumbnail}?mod=grayscale&v=5`
    ];
    
    return variations[index] || thumbnail;
}

// Create 6 different-looking thumbnail variations
function createThumbnailVariations(baseThumbnail, videoId) {
    const variations = [];
    
    // Method 1: Use different image services for variety
    const imageServices = [
        // Picsum - always different random images
        `https://picsum.photos/300/169?random=${videoId}-1-${Date.now()}`,
        `https://picsum.photos/300/169?random=${videoId}-2-${Date.now()}`,
        
        // Unsplash - different categories
        'https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=300&h=169&fit=crop&1',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=169&fit=crop&2',
        
        // Placeholder with different colors
        'https://via.placeholder.com/300x169/FF6B6B/FFFFFF?text=Thumbnail+5',
        'https://via.placeholder.com/300x169/4ECDC4/FFFFFF?text=Thumbnail+6'
    ];
    
    // If base thumbnail exists, create variations from it
    if (baseThumbnail && !baseThumbnail.includes('unsplash') && !baseThumbnail.includes('picsum')) {
        // Method 2: Create variations from the actual video thumbnail
        variations.push(
            baseThumbnail, // Original
            `${baseThumbnail}?mod=1&brightness=120`, // Brighter
            `${baseThumbnail}?mod=2&contrast=150`,   // Higher contrast
            `${baseThumbnail}?mod=3&saturation=200`, // More saturated
            `${baseThumbnail}?mod=4&blur=1`,         // Slightly blurred
            `${baseThumbnail}?mod=5&grayscale=50`    // Partial grayscale
        );
    } else {
        // Use completely different images
        variations.push(...imageServices);
    }
    
    return variations;
}

// Helper function to generate thumbnails from video
async function generateThumbnailsFromVideo(videoPath) {
    return new Promise((resolve, reject) => {
        // This is a SIMPLIFIED version - you'll need a proper video processing library
        // For now, we'll return placeholder URLs that you can replace later
        
        const thumbnails = [];
        const videoId = path.basename(videoPath, path.extname(videoPath));
        
        // Generate 6 placeholder URLs (replace this with actual thumbnail generation)
        for (let i = 1; i <= 6; i++) {
            // In a real implementation, you would:
            // 1. Use ffmpeg or similar to extract frames from the video
            // 2. Save them as images
            // 3. Return the image URLs
            
            // For now, we'll use the existing video thumbnail with different parameters
            thumbnails.push(`/uploads/thumbnails/thumbnail-${videoId}-${i}.jpg`);
        }
        
        resolve(thumbnails);
    });
}
// Temporary test route for R2 deletion
router.delete('/test-r2-delete/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    console.log('🧪 Testing R2 deletion for key:', key);
    
    const result = await deleteFromR2(key);
    
    res.json({
      success: result.success,
      message: result.success ? 'File deleted from R2' : 'Failed to delete from R2',
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test deletion failed',
      error: error.message
    });
  }
});

// Add this temporary debug route
router.delete('/debug/r2-test/:videoId', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    console.log('🔍 DEBUG - Video details:', {
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail,
      thumbnails: video.thumbnails
    });

    // Test R2 deletion with a simple file
    const testResult = await deleteFromR2('test-file.txt');
    console.log('🔍 DEBUG - R2 connection test:', testResult);

    res.json({
      video: {
        videoUrl: video.videoUrl,
        thumbnail: video.thumbnail,
        thumbnails: video.thumbnails
      },
      r2Test: testResult
    });
  } catch (error) {
    console.error('🔍 DEBUG - Error:', error);
    res.status(500).json({ error: error.message });
  }
});
router.get('/admin/all', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query for admin (can see all videos including drafts)
        let query = {};
        
        // Search
        if (req.query.q) {
            query.$or = [
                { title: { $regex: req.query.q, $options: 'i' } },
                { description: { $regex: req.query.q, $options: 'i' } },
                { tags: { $in: [new RegExp(req.query.q, 'i')] } }
            ];
        }

        // Category filter
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        const videos = await Video.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalVideos = await Video.countDocuments(query);
        const totalPages = Math.ceil(totalVideos / limit);

        res.json({
            success: true,
            videos,
            currentPage: page,
            totalPages,
            totalVideos
        });

    } catch (error) {
        console.error('Admin videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
module.exports = router;