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


// --- Admin Routes (Protected by auth middleware) ---

// @route   POST /api/videos/upload
// @desc    Upload a new video and thumbnail
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

// @route   PUT /api/videos/:id
// @desc    Update video metadata
// @access  Private (Admin)
router.put('/:id', auth, videoController.updateVideo);

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private (Admin)
router.delete('/:id', auth, videoController.deleteVideo);


// Optional: Placeholder for frame extraction if needed, though usually handled by Cloudinary
// router.post('/extract-frames/:id', auth, videoController.extractFrames); 

module.exports = router;
