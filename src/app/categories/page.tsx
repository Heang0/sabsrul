'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoCounts, setVideoCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();

        if (data.success) {
          setCategories(data.categories);

          // Fetch video counts for each category
          const counts: { [key: string]: number } = {};
          await Promise.all(
            data.categories.map(async (cat: Category) => {
              const videosRes = await fetch(`/api/videos?category=${cat.slug}&limit=1`);
              const videosData = await videosRes.json();
              if (videosData.success) {
                counts[cat.slug] = videosData.totalVideos;
              }
            })
          );
          setVideoCounts(counts);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Categories</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Categories</h1>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/videos?category=${category.slug}`}
              className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-white">{category.name}</h2>
                <span className="text-blue-500 text-sm">
                  {videoCounts[category.slug] || 0} videos
                </span>
              </div>
              {category.description && (
                <p className="text-gray-400 text-sm line-clamp-2">
                  {category.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
