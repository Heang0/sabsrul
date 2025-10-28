const Video = require('../models/Video');

const getDashboardStats = async (req, res) => {
  try {
    const totalVideos = await Video.countDocuments();
    const totalViews = await Video.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);
    const totalLikes = await Video.aggregate([
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]);

    // This month uploads
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyUploads = await Video.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    res.json({
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
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    // Placeholder data - implement real activity tracking later
    const activities = [
      {
        type: 'upload',
        title: 'New video uploaded',
        description: 'JavaScript Tutorial 2024',
        timestamp: new Date()
      },
      {
        type: 'view',
        title: 'Video trending',
        description: 'React Crash Course gained 5K views',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];

    res.json(activities);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTopVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .sort({ views: -1 })
      .limit(5);

    res.json(videos);
  } catch (error) {
    console.error('Get top videos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAnalyticsCharts = async (req, res) => {
  try {
    // Placeholder chart data
    const chartsData = {
      viewsOverTime: [
        { date: '2024-01-01', views: 1000 },
        { date: '2024-01-02', views: 1500 },
        { date: '2024-01-03', views: 1200 }
      ],
      engagementMetrics: {
        likes: 500,
        comments: 45,
        shares: 23,
        watchTime: 120000
      },
      categoryPerformance: [
        { category: 'education', views: 50000 },
        { category: 'gaming', views: 30000 },
        { category: 'music', views: 20000 }
      ]
    };

    res.json(chartsData);
  } catch (error) {
    console.error('Get analytics charts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getTopVideos,
  getAnalyticsCharts
};