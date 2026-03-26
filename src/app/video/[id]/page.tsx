'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Video {
  _id: string;
  shortId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
  views: number;
  likes: number;
  category: string;
  tags: string[];
  uploadedBy?: string;
  createdAt: string;
}

export default function VideoPage() {
  const params = useParams();
  const shortId = params?.id as string;
  const { user } = useAuth();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!shortId) return;

    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${shortId}`);
        const data = await res.json();

        if (data.success) {
          setVideo(data.video);
          setComments(data.video.comments || []);

          // Fetch related videos
          const relatedRes = await fetch(`/api/videos?category=${data.video.category}&limit=5`);
          const relatedData = await relatedRes.json();
          if (relatedData.success) {
            setRelatedVideos(relatedData.videos.filter((v: any) => v._id !== data.video._id));
          }
        }
      } catch (error) {
        console.error('Error fetching video:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [shortId]);

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

  const handleInteraction = async (action: 'like' | 'watch-later' | 'favorite') => {
    if (!user || !video) return;

    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          videoId: video._id,
          action,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'like') {
          setIsLiked(data.interaction.liked);
          setVideo({ ...video, likes: data.interaction.liked ? video.likes + 1 : video.likes - 1 });
        } else if (action === 'watch-later') {
          setIsWatchLater(data.interaction.watchLater);
        } else if (action === 'favorite') {
          setIsSaved(data.interaction.favorite);
        }
        alert(action === 'like' ? (data.interaction.liked ? 'Video liked!' : 'Video unliked') : 
              action === 'watch-later' ? (data.interaction.watchLater ? 'Added to Watch Later!' : 'Removed from Watch Later') :
              (data.interaction.favorite ? 'Saved to favorites!' : 'Removed from favorites'));
      }
    } catch (error) {
      console.error('Interaction error:', error);
    }
  };

  const fetchComments = async () => {
    if (!video) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?videoId=${video._id}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !video || !newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video._id,
          uid: user.uid,
          text: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setNewComment('');
        alert('Comment added!');
      } else {
        alert(data.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      alert('Error adding comment');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded-full w-24 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-full w-24 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-full w-24 animate-pulse" />
            </div>
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="aspect-video w-40 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl text-gray-900 mb-4">Video not found</h1>
        <Link href="/" className="text-gray-900 font-medium hover:underline">
          Go back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden w-full">
            <video
              src={video.videoUrl}
              controls
              controlsList="nodownload"
              className="w-full h-full"
              poster={video.thumbnail}
              playsInline
              webkit-playsinline="true"
              x5-video-player-type="h5"
              x5-video-player-fullscreen="true"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>

          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{video.title}</h1>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleInteraction('like')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors ${
                    isLiked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span className="text-sm font-medium">{video.likes}</span>
                </button>
                <button
                  onClick={() => handleInteraction('favorite')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors ${
                    isSaved ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="text-sm font-medium hidden sm:inline">Save</span>
                </button>
                <button
                  onClick={() => handleInteraction('watch-later')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-colors ${
                    isWatchLater ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isWatchLater ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium hidden sm:inline">Watch later</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: video.title,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 py-3 text-sm text-gray-500 border-b border-gray-200">
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatDate(video.createdAt)}</span>
              <span>•</span>
              <span className="capitalize">{video.category}</span>
            </div>

            {/* Description */}
            <div className="mt-4 bg-gray-50 rounded-lg p-3 sm:p-4">
              <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap">{video.description}</p>
            </div>

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/videos?tag=${tag}`}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs sm:text-sm transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Comments <span className="text-gray-500 font-normal">({comments.length})</span>
              </h3>

              {/* Comment Input */}
              {user ? (
                <div className="flex gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-center">
                  <p className="text-gray-700 mb-2">Log in to leave a comment</p>
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Log In
                  </button>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No comments yet</p>
                  <p className="text-gray-400 text-xs mt-1">Be the first to share what you think!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment: any, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {comment.avatar ? (
                          <img src={comment.avatar} alt={comment.username} className="w-10 h-10 rounded-full" />
                        ) : (
                          comment.username?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-900">{comment.username}</p>
                          <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Videos */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Videos</h2>
          {relatedVideos.length === 0 ? (
            <p className="text-gray-500">No related videos found</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
              {relatedVideos.map((relatedVideo) => (
                <VideoCard key={relatedVideo._id} video={relatedVideo} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
