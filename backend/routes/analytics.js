const express = require('express');
const { 
  getDashboardStats, 
  getAnalyticsCharts, 
  getTopVideos,
  getRecentActivity 
} = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

const router = express.Router();

// Admin routes only
router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/dashboard/activity', auth, getRecentActivity);
router.get('/dashboard/popular', auth, getTopVideos);
router.get('/analytics/charts', auth, getAnalyticsCharts);
router.get('/analytics/stats', auth, getDashboardStats);
router.get('/analytics/top-videos', auth, getTopVideos);

module.exports = router;