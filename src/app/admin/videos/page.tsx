'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function ManageVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', description: '', category: '' });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos?limit=100');
      const data = await res.json();
      if (data.success) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video: any) => {
    setEditingVideo(video._id);
    setEditData({
      title: video.title,
      description: video.description || '',
      category: video.category,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    try {
      const res = await fetch(`/api/videos/${editingVideo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.success) {
        alert('Video updated successfully');
        setEditingVideo(null);
        fetchVideos();
      } else {
        alert('Failed to update video');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating video');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('Video deleted successfully');
        fetchVideos();
      } else {
        alert('Failed to delete video');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting video');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentStatus === 'published' ? 'draft' : 'published',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Video ${currentStatus === 'published' ? 'moved to drafts' : 'published'}`);
        fetchVideos();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`flex-1 transition-all duration-300 p-8 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Videos</h1>
            <p className="text-gray-500 text-sm mt-1">Edit, delete, and manage your videos</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm">Total Videos</p>
            <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm">Published</p>
            <p className="text-2xl font-bold text-green-600">
              {videos.filter(v => v.status === 'published').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm">Drafts</p>
            <p className="text-2xl font-bold text-yellow-600">
              {videos.filter(v => v.status === 'draft').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm">Total Views</p>
            <p className="text-2xl font-bold text-blue-600">
              {videos.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Videos Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Views</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {videos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p>No videos yet</p>
                      <Link href="/upload" className="text-blue-600 hover:underline mt-2 inline-block">
                        Upload your first video
                      </Link>
                    </td>
                  </tr>
                ) : (
                  videos.map((video: any) => (
                    <tr key={video._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-10 sm:w-20 sm:h-12 flex-shrink-0">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-xs">
                              {video.title}
                            </p>
                            <p className="text-xs text-gray-500">{video.duration}s</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize hidden sm:table-cell">
                        {video.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {video.views?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          video.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {video.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/video/${video.shortId}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleEdit(video)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(video._id, video.status)}
                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                          >
                            {video.status === 'published' ? 'Draft' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(video._id, video.title)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Video</h2>
              <button
                onClick={() => setEditingVideo(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value.toLowerCase() })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., technology"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Use lowercase, no spaces (use hyphens)</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
