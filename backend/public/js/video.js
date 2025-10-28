console.log('✅ video.js loaded!');

// DOM Elements
const videoLoading = document.getElementById('videoLoading');
const videoContent = document.getElementById('videoContent');
const videoError = document.getElementById('videoError');
const videoTitle = document.getElementById('videoTitle');
const videoViews = document.getElementById('videoViews');
const videoDate = document.getElementById('videoDate');
const videoDescription = document.getElementById('videoDescription');
const videoCategory = document.getElementById('videoCategory');
const videoTags = document.getElementById('videoTags');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const shareBtn = document.getElementById('shareBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const relatedLoading = document.getElementById('relatedLoading');
const relatedVideos = document.getElementById('relatedVideos');
const noRelatedVideos = document.getElementById('noRelatedVideos');
const videoStats = document.getElementById('videoStats');
const statViews = document.getElementById('statViews');
const statLikes = document.getElementById('statLikes');
const desktopCategories = document.getElementById('desktopCategories');
const mobileCategories = document.getElementById('mobileCategories');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobileMenu');

// Global variables
let currentVideoId = null;
let categories = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Video page loaded');
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    
    console.log('Video ID:', videoId);
    
    if (videoId) {
        initializeVideoPage(videoId);
    } else {
        showVideoError();
    }
});

async function initializeVideoPage(videoId) {
    await loadCategories();
    setupEventListeners();
    loadVideo(videoId);
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }

    // Like button
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }

    // Share button
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }

    // Fullscreen button
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', handleFullscreen);
    }
}

// Load REAL categories from your admin panel
async function loadCategories() {
    try {
        console.log('📂 Loading categories for video page...');
        const response = await fetch(`/api/categories`);
        
        if (response.ok) {
            categories = await response.json();
            console.log('✅ Categories loaded for video page:', categories);
            displayCategories(categories);
        } else {
            console.warn('⚠️ No categories found for video page');
        }
    } catch (error) {
        console.error('❌ Error loading categories for video page:', error);
    }
}

// Display categories in video page
function displayCategories(categories) {
    // Desktop dropdown categories
    if (desktopCategories) {
        desktopCategories.innerHTML = `
            <a href="index.html" 
               class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition duration-200">
                All Categories
            </a>
            ${categories.map(category => `
                <a href="index.html?category=${category.slug}" 
                   class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition duration-200 capitalize">
                    ${category.name}
                </a>
            `).join('')}
        `;
    }

    // Mobile categories
    if (mobileCategories) {
        mobileCategories.innerHTML = `
            <a href="index.html" 
               class="w-full text-left px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200">
                All Categories
            </a>
            ${categories.map(category => `
                <a href="index.html?category=${category.slug}" 
                   class="w-full text-left px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200">
                    ${category.name}
                </a>
            `).join('')}
        `;
    }
}

// Load video data
async function loadVideo(videoId) {
    console.log('🔄 Loading video data for:', videoId);
    try {
        const response = await fetch(`/api/videos/${videoId}`);
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const video = await response.json();
        console.log('📹 Video data loaded:', video);
        
        if (video) {
            displayVideo(video);
            loadRelatedVideos(videoId, video.category);
        } else {
            showVideoError();
        }
    } catch (error) {
        console.error('Error loading video:', error);
        showVideoError();
    }
}

function displayVideo(video) {
    console.log('🎬 Displaying video:', video.title);
    videoLoading.classList.add('hidden');
    videoContent.classList.remove('hidden');
    
    // Set video info
    videoTitle.textContent = video.title;
    videoViews.textContent = `${formatViews(video.views)} views`;
    videoDate.textContent = formatTimeAgo(video.createdAt);
    videoDescription.textContent = video.description || 'No description available.';
    likeCount.textContent = formatLikes(video.likes);
    videoCategory.textContent = video.category;
    
    // Setup video player
    setupVideoPlayer(video);
    
    // Display tags if available
    if (video.tags && video.tags.length > 0) {
        videoTags.innerHTML = video.tags.map(tag => `
            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">#${tag}</span>
        `).join('');
        videoTags.classList.remove('hidden');
    }
    
    // Update stats
    statViews.textContent = formatViews(video.views);
    statLikes.textContent = formatLikes(video.likes);
    videoStats.classList.remove('hidden');
    
    // Update page title
    document.title = `${video.title} - SabSrul`;
    
    console.log('✅ Video displayed successfully');
}

// Setup video player
function setupVideoPlayer(video) {
    const videoPlayer = document.getElementById('videoPlayer');
    
    // Set video source if it's a real URL (not example.com)
    if (video.videoUrl && !video.videoUrl.includes('example.com')) {
        videoPlayer.innerHTML = `
            <source src="${video.videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
        `;
        videoPlayer.poster = video.thumbnail;
    } else {
        // Show placeholder for example videos
        videoPlayer.innerHTML = `
            <div class="w-full h-64 flex items-center justify-center text-white">
                <div class="text-center">
                    <i class="fas fa-play-circle text-6xl mb-4 opacity-50"></i>
                    <p class="text-lg">Video Player</p>
                    <p class="text-sm opacity-70 mt-2">Sample Video - No real video file</p>
                    <p class="text-xs opacity-50 mt-1">URL: ${video.videoUrl}</p>
                </div>
            </div>
        `;
        videoPlayer.controls = false;
    }
    
    // Auto-increment views when video starts playing
    videoPlayer.addEventListener('play', function() {
        incrementViews(video._id);
    });
}

// Handle like button
async function handleLike() {
    try {
        const response = await fetch(`/api/videos/${currentVideoId}/like`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            likeCount.textContent = formatLikes(parseInt(likeCount.textContent) + 1);
            statLikes.textContent = formatLikes(parseInt(statLikes.textContent) + 1);
            
            // Visual feedback
            likeBtn.innerHTML = '<i class="fas fa-heart text-red-500"></i>';
            setTimeout(() => {
                likeBtn.innerHTML = '<i class="far fa-heart"></i>';
            }, 1000);
        }
    } catch (error) {
        console.error('Error liking video:', error);
    }
}

// Handle share button
function handleShare() {
    const videoUrl = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: videoTitle.textContent,
            text: videoDescription.textContent,
            url: videoUrl,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(videoUrl).then(() => {
            alert('Video link copied to clipboard!');
        });
    }
}

// Handle fullscreen button
function handleFullscreen() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer.requestFullscreen) {
        videoPlayer.requestFullscreen();
    } else if (videoPlayer.webkitRequestFullscreen) {
        videoPlayer.webkitRequestFullscreen();
    } else if (videoPlayer.msRequestFullscreen) {
        videoPlayer.msRequestFullscreen();
    }
}

// Add function to increment views
async function incrementViews(videoId) {
    try {
        await fetch(`/api/videos/${videoId}/view`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
}

// Load related videos
async function loadRelatedVideos(videoId, category) {
    console.log('🔄 Loading related videos...');
    try {
        const response = await fetch(`/api/videos/related/${videoId}?category=${category}&limit=6`);
        const relatedVideosData = await response.json();
        
        relatedLoading.classList.add('hidden');
        
        if (relatedVideosData && relatedVideosData.length > 0) {
            displayRelatedVideos(relatedVideosData);
        } else {
            noRelatedVideos.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading related videos:', error);
        relatedLoading.classList.add('hidden');
        noRelatedVideos.classList.remove('hidden');
    }
}

// Display related videos - 2 CARDS PER ROW ON MOBILE
function displayRelatedVideos(videos) {
    console.log('📹 Displaying related videos:', videos.length);
    relatedVideos.innerHTML = videos.map(video => `
        <div class="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition duration-200 cursor-pointer video-card" 
             onclick="window.location.href='video.html?id=${video._id}'">
            <img src="${video.thumbnail}" 
                 alt="${video.title}" 
                 class="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                 onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=80&h=56&fit=crop'">
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">${video.title}</h4>
                <p class="text-xs text-gray-500 mb-1 capitalize">${video.category}</p>
                <div class="flex items-center text-xs text-gray-500">
                    <span>${formatViews(video.views)} views</span>
                    <span class="mx-1">•</span>
                    <span>${formatTimeAgo(video.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Show video error state
function showVideoError() {
    console.log('❌ Showing video error');
    videoLoading.classList.add('hidden');
    videoContent.classList.add('hidden');
    videoError.classList.remove('hidden');
}

// Utility functions
function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views;
}

function formatLikes(likes) {
    if (likes >= 1000) {
        return (likes / 1000).toFixed(1) + 'K';
    }
    return likes;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}