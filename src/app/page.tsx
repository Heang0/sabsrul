'use client';

import { useEffect, useState } from 'react';
import VideoCard from '@/components/VideoCard';

interface Video {
  _id: string;
  shortId: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  uploadedBy?: {
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, categoriesRes] = await Promise.all([
          fetch(`/api/videos?limit=12&category=${selectedCategory}`),
          fetch('/api/categories'),
        ]);

        const videosData = await videosRes.json();
        const categoriesData = await categoriesRes.json();

        if (videosData.success) {
          setVideos(videosData.videos);
        }

        if (categoriesData.success) {
          setCategories(categoriesData.categories);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => setSelectedCategory(category.slug)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === category.slug
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-2 sm:p-3 space-y-2">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No videos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
