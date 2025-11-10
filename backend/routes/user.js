const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const uploadAvatar = require('../middleware/uploadAvatar');
const { uploadToR2, deleteFromR2 } = require('../utils/r2Upload');

// Try to import compression utilities, but provide fallback if not available
let compressionUtils;
try {
    compressionUtils = require('../utils/imageCompression');
    console.log('✅ Image compression utilities loaded');
} catch (error) {
    console.log('⚠️ Image compression not available, using direct upload');
    compressionUtils = {
        compressToWebP: async (buffer) => ({ success: true, buffer }),
        compressAndResizeImage: async (buffer) => ({ success: true, buffer })
    };
}

// @route   POST /api/users/avatar
// @desc    Upload user avatar to Cloudflare R2 (with compression)
// @access  Private
router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        console.log(`📸 Original file: ${(req.file.size / 1024).toFixed(1)}KB, ${req.file.mimetype}`);

        let compressedResult = {
            success: true,
            buffer: req.file.buffer,
            originalSize: req.file.size,
            compressedSize: req.file.size,
            savings: 0
        };

        // ALWAYS COMPRESS IMAGES FOR MAXIMUM STORAGE SAVINGS
        if (req.file.mimetype.startsWith('image/')) {
            console.log(`🔄 Compressing ${(req.file.size / 1024).toFixed(1)}KB image...`);
            
            // Use WebP for better compression (smaller files)
            if (req.file.mimetype !== 'image/gif') { // Don't compress GIFs
                compressedResult = await compressionUtils.compressToWebP(req.file.buffer, {
                    maxWidth: 400,
                    maxHeight: 400,
                    quality: 70  // Lower quality for even smaller files
                });
                
                // If WebP fails, fall back to JPEG compression
                if (!compressedResult.success) {
                    console.log('🔄 WebP compression failed, falling back to JPEG');
                    compressedResult = await compressionUtils.compressAndResizeImage(req.file.buffer, {
                        maxWidth: 400,
                        maxHeight: 400,
                        quality: 75  // Lower quality for smaller files
                    });
                }
            } else {
                // For GIFs, just resize without changing format
                compressedResult = await compressionUtils.compressAndResizeImage(req.file.buffer, {
                    maxWidth: 400,
                    maxHeight: 400,
                    quality: 80
                });
            }

            if (!compressedResult.success) {
                console.log('⚠️ Using original image (compression failed)');
                compressedResult = {
                    success: true,
                    buffer: req.file.buffer,
                    originalSize: req.file.size,
                    compressedSize: req.file.size,
                    savings: 0
                };
            }
        } else {
            console.log('📦 Not an image file, skipping compression');
            compressedResult = {
                success: true,
                buffer: req.file.buffer,
                originalSize: req.file.size,
                compressedSize: req.file.size,
                savings: 0
            };
        }

        // Update file buffer with compressed version
        req.file.buffer = compressedResult.buffer;
        req.file.size = compressedResult.compressedSize;

        console.log(`✅ Final file: ${(req.file.size / 1024).toFixed(1)}KB (${compressedResult.savings}% smaller)`);

        // Upload compressed image to R2
        const uploadResult = await uploadToR2(req.file, 'avatars');
        
        if (!uploadResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload avatar to cloud storage'
            });
        }

        const user = await User.findById(req.user.id);
        
        // Delete old avatar from R2 if exists
        if (user.avatar && user.avatar.includes('r2.dev')) {
            const oldKey = user.avatar.split('/').pop();
            await deleteFromR2(`avatars/${oldKey}`);
        }

        // Update user with new avatar URL
        user.avatar = uploadResult.url;
        await user.save();

        const responseData = { 
            success: true, 
            message: 'Avatar uploaded successfully',
            avatarUrl: uploadResult.url,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio
            }
        };

        // Add compression info if compression happened
        if (compressedResult.savings > 0) {
            responseData.message = `Avatar uploaded successfully! (${compressedResult.savings}% smaller)`;
            responseData.compression = {
                originalSize: compressedResult.originalSize,
                compressedSize: compressedResult.compressedSize,
                savings: compressedResult.savings
            };
        }

        res.json(responseData);
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during avatar upload' 
        });
    }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('watchLater')
            .populate('likedVideos');
        
        // Get user playlists count
        const Playlist = require('../models/Playlist');
        const playlistsCount = await Playlist.countDocuments({ user: req.user.id });

        const stats = {
            watchLaterCount: user.watchLater ? user.watchLater.length : 0,
            likedCount: user.likedVideos ? user.likedVideos.length : 0,
            playlistsCount: playlistsCount
        };

        res.json({ 
            success: true, 
            stats 
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, bio } = req.body;
        
        // Check if username already exists (excluding current user)
        if (username) {
            const existingUser = await User.findOne({ 
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                _id: { $ne: req.user.id } 
            });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username already exists' 
                });
            }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select('-password');

        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user 
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/users/avatar
// @desc    Delete user avatar from R2
// @access  Private
router.delete('/avatar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user.avatar) {
            return res.status(400).json({
                success: false,
                message: 'No avatar to delete'
            });
        }

        // Delete from R2 if it's an R2 URL
        if (user.avatar.includes('r2.dev')) {
            try {
                const key = user.avatar.split('/').pop();
                await deleteFromR2(`avatars/${key}`);
                console.log('✅ Old avatar deleted from R2');
            } catch (deleteError) {
                console.error('⚠️ Failed to delete old avatar from R2:', deleteError.message);
                // Continue anyway - don't fail the request if deletion fails
            }
        }

        // Clear avatar in database
        user.avatar = null;
        await user.save();

        res.json({
            success: true,
            message: 'Avatar deleted successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during avatar deletion'
        });
    }
});

// @route   GET /api/users/check-username/:username
// @desc    Check if username is available
// @access  Public
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username || username.length < 3) {
            return res.json({
                available: false,
                message: 'Username must be at least 3 characters'
            });
        }
        
        // Check username format
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.json({
                available: false,
                message: 'Username can only contain letters, numbers, and underscores'
            });
        }
        
        // Check if username exists (case-insensitive)
        const existingUser = await User.findOne({ 
            username: { $regex: new RegExp(`^${username}$`, 'i') } 
        });
        
        res.json({
            available: !existingUser,
            message: existingUser ? 'Username taken' : 'Username available'
        });
        
    } catch (error) {
        console.error('Username check error:', error);
        res.status(500).json({
            available: false,
            message: 'Server error'
        });
    }
});

module.exports = router;