'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function UploadPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<number>(-1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
        }
      })
      .catch(console.error);
  }, []);

  // Generate thumbnails when video is selected
  useEffect(() => {
    if (!videoFile) {
      setVideoThumbnail(null);
      setGeneratedThumbnails([]);
      setVideoDuration(0);
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      URL.revokeObjectURL(url);
    };

    video.onloadeddata = () => {
      // Generate thumbnail at 0% (beginning)
      generateThumbnail(video, 0);
      
      // Generate thumbnails at 25%, 50%, 75%
      const timestamps = [0.25, 0.5, 0.75];
      const thumbnails: string[] = [];
      
      timestamps.forEach((percentage, index) => {
        setTimeout(() => {
          const thumb = generateThumbnailAtTime(video, video.duration * percentage);
          if (thumb) thumbnails.push(thumb);
          if (index === timestamps.length - 1) {
            setGeneratedThumbnails(thumbnails);
          }
        }, 100 * (index + 1));
      });
    };

    return () => {
      video.src = '';
    };
  }, [videoFile]);

  const generateThumbnail = (video: HTMLVideoElement, time: number = 0) => {
    video.currentTime = time;
  };

  const generateThumbnailAtTime = (video: HTMLVideoElement, time: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      video.currentTime = time;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return '';
  };

  const handleSelectGeneratedThumbnail = (dataUrl: string, index: number) => {
    setSelectedThumbnail(index);
    setVideoThumbnail(dataUrl);
    
    // Convert data URL to File
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
        setThumbnailFile(file);
      });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('video', videoFile);
      if (thumbnailFile) {
        uploadFormData.append('thumbnail', thumbnailFile);
      }
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('tags', formData.tags);

      // Simulate progress (since we can't track actual upload progress easily)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();

      if (data.success) {
        setSuccess('Video uploaded successfully!');
        setTimeout(() => {
          router.push(`/video/${data.video.shortId}`);
        }, 1000);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div className="flex">
      <Sidebar isOpen={sidebarOpen} />
      <div
        className={`flex-1 transition-all duration-300 p-8 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Upload Video</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleUpload} className="bg-gray-800 rounded-lg p-6 space-y-6">
            {/* Video File Upload */}
            <div>
              <label className="block text-white font-medium mb-2">
                Video File <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="video-upload"
                  disabled={uploading}
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📹</div>
                  <p className="text-white">
                    {videoFile ? videoFile.name : 'Click to select video file'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">MP4, WebM, or AVI</p>
                </label>
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-white font-medium mb-2">Thumbnail</label>
              
              {/* Generated Thumbnails from Video */}
              {generatedThumbnails.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-white font-medium text-sm">
                      Select from Video
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowThumbnailSelector(!showThumbnailSelector)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {showThumbnailSelector ? 'Hide' : 'Show'} Options
                    </button>
                  </div>
                  
                  {showThumbnailSelector && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-gray-700 rounded-lg">
                      {generatedThumbnails.map((thumb, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectGeneratedThumbnail(thumb, index)}
                          className={`relative aspect-video rounded overflow-hidden border-2 transition-all ${
                            selectedThumbnail === index
                              ? 'border-blue-500 ring-2 ring-blue-500'
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={thumb}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {selectedThumbnail === index && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Upload Custom Thumbnail */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setThumbnailFile(e.target.files?.[0] || null);
                    setSelectedThumbnail(-1);
                  }}
                  className="hidden"
                  id="thumbnail-upload"
                  disabled={uploading}
                />
                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                  {thumbnailFile && selectedThumbnail === -1 ? (
                    <div>
                      <p className="text-white">{thumbnailFile.name}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {(thumbnailFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">🖼️</div>
                      <p className="text-white">Click to select thumbnail</p>
                      <p className="text-gray-400 text-sm mt-1">JPG, PNG, or GIF</p>
                      {generatedThumbnails.length > 0 && (
                        <p className="text-blue-400 text-xs mt-2">
                          Or select from video frames above
                        </p>
                      )}
                    </>
                  )}
                </label>
              </div>

              {/* Preview */}
              {videoThumbnail && (
                <div className="mt-4">
                  <p className="text-white text-sm mb-2">Preview:</p>
                  <img
                    src={videoThumbnail}
                    alt="Thumbnail preview"
                    className="w-full max-w-xs rounded-lg border border-gray-600"
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-white font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter video title"
                disabled={uploading}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your video..."
                rows={4}
                disabled={uploading}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-white font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white font-medium mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tag1, tag2, tag3 (comma separated)"
                disabled={uploading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-900 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white">Uploading...</span>
                  <span className="text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !videoFile}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
