const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const auth = require('../middleware/auth'); // Admin authentication middleware
const upload = require('../middleware/upload'); // Multer middleware for file handling

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

module.exports = router;