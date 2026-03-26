'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

type Tab = 'videos' | 'watch-later' | 'liked' | 'playlists';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('videos');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Sync user with backend
      fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUserData(data.user);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || 'User'}
                width={80}
                height={80}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl font-bold">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.displayName || user?.email?.split('@')[0]}
              </h1>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('videos')}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'videos'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Videos
            </button>
            <button
              onClick={() => setActiveTab('watch-later')}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'watch-later'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Watch Later
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'liked'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Liked Videos
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'playlists'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Playlists
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {activeTab === 'videos' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No videos yet</p>
            </div>
          )}

          {activeTab === 'watch-later' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No videos in Watch Later</p>
              <p className="text-gray-400 text-xs mt-1">Save videos to watch them later</p>
            </div>
          )}

          {activeTab === 'liked' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No liked videos yet</p>
              <p className="text-gray-400 text-xs mt-1">Like videos to see them here</p>
            </div>
          )}

          {activeTab === 'playlists' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No Playlists Yet</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">Create your first playlist to get started</p>
              <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors">
                Create Playlist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
