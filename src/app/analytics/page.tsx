'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Analytics {
  overview: {
    totalVideos: number;
    totalUsers: number;
    publishedVideos: number;
    draftVideos: number;
    totalViews: number;
    totalLikes: number;
  };
  recentVideos: any[];
  topVideos: any[];
  categoryStats: { _id: string; count: number; totalViews: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();

        if (data.success) {
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 ml-64 transition-all duration-300 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded w-1/4" />
            <div className="h-64 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const maxCategoryCount = Math.max(
    ...analytics?.categoryStats.map((c) => c.count) || [1]
  );

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} />
      <div
        className={`flex-1 transition-all duration-300 p-8 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Avg. Views per Video</p>
            <p className="text-2xl font-bold text-white">
              {analytics?.overview.totalVideos
                ? Math.round(
                    (analytics.overview.totalViews || 0) / analytics.overview.totalVideos
                  ).toLocaleString()
                : 0}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Avg. Likes per Video</p>
            <p className="text-2xl font-bold text-white">
              {analytics?.overview.totalVideos
                ? Math.round(
                    (analytics.overview.totalLikes || 0) / analytics.overview.totalVideos
                  ).toLocaleString()
                : 0}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Publish Rate</p>
            <p className="text-2xl font-bold text-white">
              {analytics?.overview.totalVideos
                ? Math.round(
                    ((analytics.overview.publishedVideos || 0) / analytics.overview.totalVideos) *
                      100
                  )
                : 0}
              %
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Videos per User</p>
            <p className="text-2xl font-bold text-white">
              {analytics?.overview.totalUsers && analytics.overview.totalUsers > 0
                ? (
                    (analytics.overview.totalVideos || 0) / analytics.overview.totalUsers
                  ).toFixed(1)
                : 0}
            </p>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Category Distribution</h2>
          {analytics?.categoryStats && analytics.categoryStats.length > 0 ? (
            <div className="space-y-4">
              {analytics.categoryStats.map((category) => (
                <div key={category._id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white capitalize">{category._id}</span>
                    <span className="text-gray-400 text-sm">
                      {category.count} videos • {category.totalViews.toLocaleString()} views
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(category.count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No category data available</p>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Top Performing Videos</h3>
              {analytics?.topVideos && analytics.topVideos.length > 0 ? (
                <ul className="space-y-3">
                  {analytics.topVideos.slice(0, 5).map((video, index) => (
                    <li key={video._id} className="flex items-center gap-3">
                      <span className="text-gray-500 font-bold w-6">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{video.title}</p>
                        <p className="text-gray-400 text-sm">
                          {video.views?.toLocaleString()} views
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No videos yet</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Engagement Rate</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Like Rate</span>
                    <span className="text-white">
                      {analytics?.overview.totalViews && analytics.overview.totalViews > 0
                        ? (
                            (analytics.overview.totalLikes / analytics.overview.totalViews) *
                            100
                          ).toFixed(2)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (analytics?.overview.totalViews && analytics.overview.totalViews > 0
                            ? (analytics.overview.totalLikes / analytics.overview.totalViews) *
                              100
                            : 0)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
