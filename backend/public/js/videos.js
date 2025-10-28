// API Base URL - Auto-detects environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

// DOM Elements
const videoLoading = document.getElementById('videoLoading');
const videoContent = document.getElementById('videoContent');
const videoError = document.getElementById('videoError');
const videoPlayer = document.getElementById('videoPlayer');
const videoTitle = document.getElementById('videoTitle');
const videoViews = document.getElementById('videoViews');
const videoDate = document.getElementById('videoDate');
const videoDescription = document.getElementById('videoDescription');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const shareBtn = document.getElementById('shareBtn');
const relatedLoading = document.getElementById('relatedLoading');
const relatedVideos = document.getElementById('relatedVideos');
const noRelatedVideos = document.getElementById('noRelatedVideos');

// Mobile menu functionality
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobileMenu');

// Global variables
let currentVideo = null;
let categories = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    
    if (videoId) {
        initializePage(videoId);
    } else {
        showVideoError();
    }
    
    setupMobileMenu();
});

// Setup mobile menu
function setupMobileMenu() {
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

async function initializePage(videoId) {
    try {
        await Promise.all([
            loadCategories(),
            loadVideo(videoId)
        ]);
    } catch (error) {
        console.error('Error initializing page:', error);
        showVideoError();
    }
}

// Load categories for dropdown
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        categories = await response.json();
        displayCategoryDropdowns(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display categories in dropdown menus
function displayCategoryDropdowns(categories) {
    // Desktop dropdown
    const desktopCategories = document.getElementById('desktopCategories');
    if (desktopCategories) {
        desktopCategories.innerHTML = categories.map(category => `
            <a href="index.html?category=${category.slug}" 
               class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition duration-200">
                ${category.name}
            </a>
        `).join('');
    }

    // Mobile dropdown
    const mobileCategories = document.getElementById('mobileCategories');
    if (mobileCategories) {
        mobileCategories.innerHTML = categories.map(category => `
            <a href="index.html?category=${category.slug}" 
               class="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200"
               onclick="mobileMenu.classList.add('hidden');">
                ${category.name}
            </a>
        `).join('');
    }
}

// Load video data
async function loadVideo(videoId) {
    try {
        // Increment view count
        await fetch(`${API_BASE_URL}/videos/${videoId}/view`, { method: 'POST' });
        
        // Get video data
        const response = await fetch(`${API_BASE_URL}/videos/${videoId}`);
        const video = await response.json();
        
        if (video) {
            currentVideo = video;
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

// Display video content
function displayVideo(video) {
    videoLoading.classList.add('hidden');
    videoContent.classList.remove('hidden');
    
    // Set video player
    videoPlayer.poster = video.thumbnail;
    videoPlayer.innerHTML = `
        <source src="${video.videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
    `;
    
    // Set video info
    videoTitle.textContent = video.title;
    videoViews.textContent = `${formatViews(video.views)} views`;
    videoDate.textContent = formatTimeAgo(video.createdAt);
    videoDescription.textContent = video.description;
    likeCount.textContent = formatLikes(video.likes);
    
    // Setup like button
    setupLikeButton(video);
    
    // Setup share button
    setupShareButton(video);
    
    // Update page title
    document.title = `${video.title} - SabSrul`;
}

// Setup like button functionality
function setupLikeButton(video) {
    let isLiked = false;
    let currentLikes = video.likes;
    
    likeBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/videos/${video._id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                isLiked = !isLiked;
                currentLikes = isLiked ? currentLikes + 1 : currentLikes - 1;
                
                likeBtn.innerHTML = isLiked ? 
                    '<i class="fas fa-heart text-red-500"></i>' : 
                    '<i class="far fa-heart"></i>';
                likeCount.textContent = formatLikes(currentLikes);
                
                likeBtn.classList.toggle('text-red-500', isLiked);
            }
        } catch (error) {
            console.error('Error liking video:', error);
        }
    });
}

// Setup share button functionality
function setupShareButton(video) {
    shareBtn.addEventListener('click', () => {
        const shareUrl = `${window.location.origin}/video.html?id=${video._id}`;
        const shareText = `Check out this video: ${video.title}`;
        
        if (navigator.share) {
            navigator.share({
                title: video.title,
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    });
}

// Load related videos
async function loadRelatedVideos(videoId, category) {
    try {
        const response = await fetch(`${API_BASE_URL}/videos/related/${videoId}?category=${category}&limit=6`);
        const relatedVideosData = await response.json();
        
        relatedLoading.classList.add('hidden');
        
        if (relatedVideosData.length > 0) {
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

// Display related videos
function displayRelatedVideos(videos) {
    relatedVideos.innerHTML = videos.map(video => `
        <div class="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition duration-200 cursor-pointer" 
             onclick="navigateToVideo('${video._id}')">
            <img src="${video.thumbnail}" 
                 alt="${video.title}" 
                 class="w-20 h-14 object-cover rounded-lg flex-shrink-0">
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">${video.title}</h4>
                <p class="text-xs text-gray-500 mb-1">${video.channel}</p>
                <div class="flex items-center text-xs text-gray-500">
                    <span>${formatViews(video.views)} views</span>
                    <span class="mx-1">•</span>
                    <span>${formatTimeAgo(video.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Navigate to video page
function navigateToVideo(videoId) {
    window.location.href = `video.html?id=${videoId}`;
}

// Show video error state
function showVideoError() {
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