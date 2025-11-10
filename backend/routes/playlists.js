const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');

// @route   GET /api/playlists/user
// @desc    Get user's playlists
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        console.log('📂 Fetching playlists for user:', req.user.id);
        
        const playlists = await Playlist.find({ user: req.user.id })
            .populate('videos')
            .sort({ updatedAt: -1 });
            
        console.log(`✅ Found ${playlists.length} playlists for user ${req.user.id}`);
        
        res.json({ 
            success: true,
            playlists: playlists || []
        });
    } catch (error) {
        console.error('❌ Get user playlists error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
});
// @route   POST /api/playlists/:playlistId/videos/:videoId
// @desc    Add video to playlist
// @access  Private
router.post('/:playlistId/videos/:videoId', auth, async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;
        
        console.log(`🎯 Adding video ${videoId} to playlist ${playlistId}`);
        
        const playlist = await Playlist.findOne({ _id: playlistId, user: req.user.id });
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
        }
        
        // Check if video exists
        const Video = require('../models/Video');
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }
        
        // Check if video is already in playlist
        if (playlist.videos.includes(videoId)) {
            return res.status(400).json({
                success: false,
                message: 'Video is already in this playlist'
            });
        }
        
        // Add video to playlist
        playlist.videos.push(videoId);
        playlist.updatedAt = new Date();
        
        await playlist.save();
        
        // Populate the video details
        await playlist.populate('videos');
        
        console.log('✅ Video added to playlist successfully');
        
        res.json({
            success: true,
            message: 'Video added to playlist successfully',
            playlist
        });
    } catch (error) {
        console.error('❌ Add video to playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});
// @route   POST /api/playlists
// @desc    Create a new playlist
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Playlist name is required'
            });
        }
        
        const playlist = new Playlist({
            name: name.trim(),
            description: description || '',
            isPublic: isPublic || false,
            user: req.user.id,
            videos: []
        });
        
        await playlist.save();
        
        // Populate the created playlist
        await playlist.populate('videos');
        
        console.log('✅ Playlist created:', playlist._id);
        
        res.status(201).json({
            success: true,
            message: 'Playlist created successfully',
            playlist
        });
    } catch (error) {
        console.error('❌ Create playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
});

module.exports = router;