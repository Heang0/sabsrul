'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  categoryStats: any[];
}

export default function DashboardPage() {
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
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} />
      <div
        className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your video platform</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Videos */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Videos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics?.overview.totalVideos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Views */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Views</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics?.overview.totalViews?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Likes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Likes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics?.overview.totalLikes?.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Published */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Published</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {analytics?.overview.publishedVideos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Drafts */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Drafts</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {analytics?.overview.draftVideos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Users</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {analytics?.overview.totalUsers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Recent Videos</h2>
          {analytics?.recentVideos && analytics.recentVideos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Views</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Likes</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentVideos.map((video) => (
                    <tr key={video._id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">
                        <Link
                          href={`/video/${video.shortId}`}
                          className="text-gray-900 hover:text-blue-600 font-medium text-sm truncate block"
                        >
                          {video.title}
                        </Link>
                        <div className="sm:hidden text-gray-500 text-xs mt-1">
                          {video.views?.toLocaleString()} views • {video.likes?.toLocaleString()} likes
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 text-sm hidden sm:table-cell">{video.views?.toLocaleString() || 0}</td>
                      <td className="py-3 text-gray-600 text-sm hidden sm:table-cell">{video.likes?.toLocaleString() || 0}</td>
                      <td className="py-3 text-gray-500 text-sm">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No videos yet</p>
            </div>
          )}
        </div>

        {/* Top Videos */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Top Videos by Views</h2>
          {analytics?.topVideos && analytics.topVideos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Views</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Likes</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topVideos.map((video, index) => (
                    <tr key={video._id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3">
                        <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded-full text-xs font-bold inline-flex items-center justify-center">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/video/${video.shortId}`}
                          className="text-gray-900 hover:text-blue-600 font-medium text-sm truncate block"
                        >
                          {video.title}
                        </Link>
                        <div className="sm:hidden text-gray-500 text-xs mt-1">
                          {video.views?.toLocaleString()} views • {video.likes?.toLocaleString()} likes
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 text-sm hidden sm:table-cell">{video.views?.toLocaleString() || 0}</td>
                      <td className="py-3 text-gray-600 text-sm hidden sm:table-cell">{video.likes?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-sm">No videos yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
