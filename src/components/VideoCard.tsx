import Link from 'next/link';
import Image from 'next/image';

interface VideoCardProps {
  video: {
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
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/video/${video.shortId}`} className="group">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover group-hover:opacity-80 transition-opacity"
            unoptimized
          />
          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>

        {/* Video Info */}
        <div className="p-2 sm:p-3">
          <h3 className="text-gray-900 text-sm sm:text-base font-medium line-clamp-2 mb-1 sm:mb-2 group-hover:text-gray-600 transition-colors">
            {video.title}
          </h3>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {video.uploadedBy?.avatar ? (
              <Image
                src={video.uploadedBy.avatar}
                alt={video.uploadedBy.username}
                width={20}
                height={20}
                className="rounded-full"
                unoptimized
              />
            ) : (
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs">
                {video.uploadedBy?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-gray-600 text-xs sm:text-sm truncate">
              {video.uploadedBy?.username || 'Unknown'}
            </span>
          </div>

          <div className="mt-1 sm:mt-2 flex items-center text-gray-500 text-xs sm:text-sm">
            <span>{formatViews(video.views)}</span>
            <span className="mx-1 sm:mx-2">•</span>
            <span>{formatDate(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
