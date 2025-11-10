const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const User = require('../models/User');

// @route   POST /api/interactions/like/:videoId
// @desc    Like/unlike a video
// @access  Private
router.post('/like/:videoId', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const user = await User.findById(req.user.id);
        const likedIndex = user.likedVideos.indexOf(video._id);

        let liked = false;
        
        if (likedIndex > -1) {
            // Unlike
            user.likedVideos.splice(likedIndex, 1);
            video.likes = Math.max(0, (video.likes || 0) - 1);
        } else {
            // Like
            user.likedVideos.push(video._id);
            video.likes = (video.likes || 0) + 1;
            liked = true;
        }

        await user.save();
        
        // Save video without validation to avoid uploadedBy requirement
        await Video.findByIdAndUpdate(
            video._id,
            { 
                likes: video.likes,
                likedBy: liked ? [...(video.likedBy || []), user._id] : video.likedBy?.filter(id => id.toString() !== user._id.toString())
            },
            { runValidators: false } // Skip validation for this update
        );

        res.json({ 
            liked, 
            likes: video.likes,
            message: liked ? 'Video liked' : 'Video unliked'
        });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   POST /api/interactions/watch-later/:videoId
// @desc    Add/remove video from watch later
// @access  Private
router.post('/watch-later/:videoId', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const user = await User.findById(req.user.id);
        const watchLaterIndex = user.watchLater.indexOf(video._id);

        let watchLater = false;
        
        if (watchLaterIndex > -1) {
            // Remove from watch later
            user.watchLater.splice(watchLaterIndex, 1);
        } else {
            // Add to watch later
            user.watchLater.push(video._id);
            watchLater = true;
        }

        await user.save();

        res.json({ 
            watchLater,
            message: watchLater ? 'Added to watch later' : 'Removed from watch later'
        });
    } catch (error) {
        console.error('Watch later error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// @route   GET /api/interactions/user/likes
// @desc    Get user's liked videos
// @access  Private
router.get('/user/likes', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('likedVideos');
        res.json({ videos: user.likedVideos });
    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   GET /api/interactions/user/interactions
// @desc    Get user's interactions (likes, watch later)
// @access  Private
router.get('/user/interactions', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('likedVideos watchLater');
        res.json({
            likedVideos: user.likedVideos,
            watchLater: user.watchLater
        });
    } catch (error) {
        console.error('Get user interactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   GET /api/interactions/user/watch-later
// @desc    Get user's watch later videos
// @access  Private
router.get('/user/watch-later', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('watchLater');
        res.json({ videos: user.watchLater });
    } catch (error) {
        console.error('Get watch later error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;