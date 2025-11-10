const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const User = require('../models/User');
const Category = require('../models/Category');

// Admin middleware - check if user is admin
const adminAuth = [auth, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
}];

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
        const totalVideos = await Video.countDocuments();
        const totalViews = await Video.aggregate([
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        const totalLikes = await Video.aggregate([
            { $group: { _id: null, total: { $sum: '$likes' } } }
        ]);
        
        // Get monthly uploads
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const monthlyUploads = await Video.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        res.json({
            success: true,
            totalVideos,
            totalViews: totalViews[0]?.total || 0,
            totalLikes: totalLikes[0]?.total || 0,
            monthlyUploads,
            videosGrowth: 12, // Placeholder
            viewsGrowth: 8,   // Placeholder
            likesGrowth: 15,  // Placeholder
            uploadsGrowth: 5  // Placeholder
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/dashboard/activity
// @desc    Get recent activity
// @access  Private/Admin
router.get('/dashboard/activity', adminAuth, async (req, res) => {
    try {
        // Get recent videos as activity
        const recentVideos = await Video.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title createdAt status')
            .lean();

        const activity = recentVideos.map(video => ({
            type: 'upload',
            title: video.title,
            description: `Video ${video.status === 'published' ? 'published' : 'saved as draft'}`,
            timestamp: video.createdAt
        }));

        res.json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/dashboard/popular
// @desc    Get popular videos
// @access  Private/Admin
router.get('/dashboard/popular', adminAuth, async (req, res) => {
    try {
        const popularVideos = await Video.find()
            .sort({ views: -1 })
            .limit(5)
            .select('title thumbnail views likes')
            .lean();

        res.json({
            success: true,
            videos: popularVideos
        });
    } catch (error) {
        console.error('Popular videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/analytics/stats
// @desc    Get analytics statistics
// @access  Private/Admin
router.get('/analytics/stats', adminAuth, async (req, res) => {
    try {
        const totalViews = await Video.aggregate([
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        
        const totalWatchTime = await Video.aggregate([
            { $group: { _id: null, total: { $sum: '$duration' } } }
        ]);

        res.json({
            success: true,
            totalViews: totalViews[0]?.total || 0,
            totalWatchTime: totalWatchTime[0]?.total || 0,
            avgViewDuration: 180, // Placeholder - 3 minutes
            engagementRate: 0.65, // Placeholder - 65%
            viewsGrowth: 8,
            watchTimeGrowth: 12,
            avgDurationGrowth: 5,
            engagementGrowth: 3
        });
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/analytics/charts
// @desc    Get charts data
// @access  Private/Admin
router.get('/analytics/charts', adminAuth, async (req, res) => {
    try {
        // Generate dummy data for last 7 days
        const viewsOverTime = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            viewsOverTime.push({
                date: date.toISOString(),
                views: Math.floor(Math.random() * 1000) + 500
            });
        }

        res.json({
            success: true,
            viewsOverTime,
            engagementMetrics: {
                likes: 1250,
                comments: 342,
                shares: 89,
                watchTime: 45600
            },
            categoryPerformance: [
                { category: 'music', views: 1500 },
                { category: 'gaming', views: 1200 },
                { category: 'education', views: 800 },
                { category: 'entertainment', views: 2000 }
            ]
        });
    } catch (error) {
        console.error('Charts error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/analytics/top-videos
// @desc    Get top videos
// @access  Private/Admin
router.get('/analytics/top-videos', adminAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const topVideos = await Video.find()
            .sort({ views: -1 })
            .limit(limit)
            .select('title thumbnail views likes duration')
            .lean();

        const videosWithEngagement = topVideos.map(video => ({
            ...video,
            engagementRate: (video.likes / Math.max(video.views, 1)).toFixed(2),
            avgViewDuration: Math.floor(video.duration * 0.6) // 60% of video duration
        }));

        res.json({
            success: true,
            videos: videosWithEngagement
        });
    } catch (error) {
        console.error('Top videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;