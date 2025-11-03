console.log('✅ video.js loaded!');
console.log('🔍 DOM Elements Check:');
console.log('- videoPlayer:', document.getElementById('videoPlayer'));
console.log('- relatedLoadMore:', document.getElementById('relatedLoadMore'));
console.log('- relatedVideos:', document.getElementById('relatedVideos'));
console.log('- searchInput:', document.getElementById('searchInput'));

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
const relatedLoading = document.getElementById('relatedLoading');
const relatedVideos = document.getElementById('relatedVideos');
const noRelatedVideos = document.getElementById('noRelatedVideos');
const relatedCount = document.getElementById('relatedCount');

// ADD THESE MISSING ELEMENTS:
const videoPlayer = document.getElementById('videoPlayer'); // This was missing!
const relatedLoadMore = document.getElementById('relatedLoadMore'); // This was missing!

// Settings control elements
const settingsButton = document.getElementById('settingsButton');
const settingsMenu = document.getElementById('settingsMenu');
const qualityOptions = document.getElementById('qualityOptions');

// Global variables
let availableQualities = [];
let currentQuality = 'auto';
let currentVideoId = null;
let hasLiked = false;
let isSettingsMenuOpen = false;

// RELATED VIDEOS PAGINATION - ADD THESE
let relatedVideosPage = 1;
let hasMoreRelatedVideos = false;
let currentRelatedCategory = '';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Video page loaded');
    
    // Get video ID from URL - support both formats
    let videoId;
    const pathSegments = window.location.pathname.split('/');
    
    if (window.location.pathname.startsWith('/video/') && pathSegments.length > 2) {
        // Clean URL format: /video/CB9RpD0f4o
        videoId = pathSegments[2];
    } else {
        // Query parameter format: /video.html?id=CB9RpD0f4o
        const urlParams = new URLSearchParams(window.location.search);
        videoId = urlParams.get('id');
    }
    
    console.log('Video ID:', videoId);
    
    if (videoId) {
        initializeVideoPage(videoId);
    } else {
        showVideoError();
    }
});

async function initializeVideoPage(videoId) {
    setupEventListeners();
    loadCategories(); // Load categories for navigation
    loadVideo(videoId);
    
    // Check if we came from a tag search and update UI accordingly
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    if (tag) {
        console.log(`🎯 Came from tag search: ${tag}`);
        // The search bar will be automatically populated by setupVideoSearch
    }
}

function setupEventListeners() {

      // Search functionality - ADD THIS
    setupVideoSearch();
    // Like button
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }

    // Share button
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const isHidden = mobileMenu.classList.contains('hidden');
            
            // Close all other menus first
            closeAllMenus();
            
            // Toggle mobile menu
            if (isHidden) {
                mobileMenu.classList.remove('hidden');
                addMobileBackdrop();
            } else {
                mobileMenu.classList.add('hidden');
                removeMobileBackdrop();
            }
        });

        // Close mobile menu when clicking a category
        mobileMenu.addEventListener('click', function(e) {
            if (e.target.closest('a')) {
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                    removeMobileBackdrop();
                }, 100);
            }
        });
    }

    // Close menus when clicking outside
    document.addEventListener('click', function(event) {
        const categoriesDropdown = document.getElementById('categoriesDropdown');
        const desktopCategoriesMenu = document.getElementById('desktopCategoriesMenu');
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const mobileMenu = document.getElementById('mobileMenu');
        
        // Close categories dropdown if clicking outside
        if (categoriesDropdown && desktopCategoriesMenu && 
            !categoriesDropdown.contains(event.target) && 
            !desktopCategoriesMenu.contains(event.target)) {
            desktopCategoriesMenu.classList.add('hidden');
        }
        
        // Close mobile menu if clicking outside
        if (mobileMenu && mobileMenuButton && 
            !mobileMenu.contains(event.target) && 
            !mobileMenuButton.contains(event.target) &&
            !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            removeMobileBackdrop();
        }
        
        // Close settings menu if clicking outside
        if (isSettingsMenuOpen && 
            !settingsMenu.contains(event.target) && 
            !settingsButton.contains(event.target)) {
            closeSettingsMenu();
        }
    });

    // Add event delegation for related video clicks
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('[data-video-id]');
    if (videoCard) {
        const videoId = videoCard.getAttribute('data-video-id');
        window.location.href = `video.html?id=${videoId}`;
    }
});

    // Handle escape key to close all menus
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllMenus();
            removeMobileBackdrop();
        }
    });

    // Categories dropdown toggle (for desktop)
    setupCategoriesDropdown();
    
    // Video player controls
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer) {
        videoPlayer.addEventListener('mouseenter', showCustomControls);
        videoPlayer.addEventListener('mouseleave', hideCustomControls);
        
        // Touch events for mobile
        videoPlayer.addEventListener('touchstart', showCustomControls);
        videoPlayer.addEventListener('touchend', function() {
            setTimeout(hideCustomControls, 3000);
        });
    }
}

// Categories functionality
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function displayCategories(categories) {
    const desktopCategories = document.getElementById('desktopCategories');
    const mobileCategories = document.getElementById('mobileCategories');
    
    if (!categories || categories.length === 0) {
        console.log('No categories available');
        return;
    }
    
    // Desktop categories dropdown
    if (desktopCategories) {
        desktopCategories.innerHTML = categories.map(category => `
            <a href="index.html?category=${category.slug || category.name}" 
               class="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors capitalize">
                ${category.name}
            </a>
        `).join('');
    }
    
    // Mobile categories menu - WITH ALL CATEGORIES
    if (mobileCategories) {
        mobileCategories.innerHTML = `
            <a href="index.html?category=all" 
               class="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors rounded-lg border border-gray-100">
                <i class="fas fa-play-circle text-purple-500 mr-3 w-4"></i>
                <span>All Categories</span>
            </a>
            ${categories.map(category => `
                <a href="index.html?category=${category.slug || category.name}" 
                   class="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors rounded-lg border border-gray-100">
                    <i class="fas fa-play-circle text-purple-500 mr-3 w-4"></i>
                    <span class="capitalize">${category.name}</span>
                </a>
            `).join('')}
        `;
    }
}

function setupCategoriesDropdown() {
    const categoriesDropdown = document.getElementById('categoriesDropdown');
    const categoriesButton = categoriesDropdown ? categoriesDropdown.querySelector('button') : null;
    const desktopCategoriesMenu = document.getElementById('desktopCategoriesMenu');
    
    if (categoriesButton && desktopCategoriesMenu) {
        // Toggle menu on click
        categoriesButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const isHidden = desktopCategoriesMenu.classList.contains('hidden');
            
            // Close all other open menus first
            closeAllMenus();
            
            // Toggle this menu
            if (isHidden) {
                desktopCategoriesMenu.classList.remove('hidden');
            } else {
                desktopCategoriesMenu.classList.add('hidden');
            }
        });
        
        // Keep menu open when hovering over it
        desktopCategoriesMenu.addEventListener('mouseenter', function() {
            desktopCategoriesMenu.classList.remove('hidden');
        });
        
        desktopCategoriesMenu.addEventListener('mouseleave', function() {
            desktopCategoriesMenu.classList.add('hidden');
        });
    }
}

// Mobile backdrop functions
function addMobileBackdrop() {
    let backdrop = document.getElementById('mobileBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'mobileBackdrop';
        backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden';
        backdrop.addEventListener('click', function() {
            closeAllMenus();
            removeMobileBackdrop();
        });
        document.body.appendChild(backdrop);
    }
    backdrop.classList.remove('hidden');
}

function removeMobileBackdrop() {
    const backdrop = document.getElementById('mobileBackdrop');
    if (backdrop) {
        backdrop.classList.add('hidden');
    }
}

function closeAllMenus() {
    const settingsMenu = document.getElementById('settingsMenu');
    const desktopCategoriesMenu = document.getElementById('desktopCategoriesMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (settingsMenu) settingsMenu.classList.add('hidden');
    if (desktopCategoriesMenu) desktopCategoriesMenu.classList.add('hidden');
    if (mobileMenu) mobileMenu.classList.add('hidden');
    
    isSettingsMenuOpen = false;
    removeMobileBackdrop();
}

// Video player controls
function showCustomControls() {
    if (settingsButton) {
        settingsButton.classList.remove('hidden');
    }
}

function hideCustomControls() {
    if (settingsButton && !isSettingsMenuOpen) {
        settingsButton.classList.add('hidden');
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
            // REMOVE THIS LINE if it exists: loadRelatedVideos(videoId, video.category);
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
    
    // Set current video ID for like functionality
    currentVideoId = video._id;
    
    // Reset related videos pagination
    relatedVideosPage = 1;
    hasMoreRelatedVideos = false;
    
    // Safely hide/show elements
    if (videoLoading) videoLoading.classList.add('hidden');
    if (videoContent) videoContent.classList.remove('hidden');
    
    // Set video info
    if (videoTitle) videoTitle.textContent = video.title || 'Untitled Video';
    if (videoViews) videoViews.textContent = `${formatViews(video.views || 0)} views`;
    if (videoDate) videoDate.textContent = formatTimeAgo(video.createdAt);
    
    if (likeCount) likeCount.textContent = formatLikes(video.likes || 0);
    if (videoCategory) {
        const categoryName = formatCategoryName(video.category);
        videoCategory.textContent = categoryName;
        videoCategory.classList.add('cursor-pointer', 'hover:bg-purple-200');
        videoCategory.title = `View all ${categoryName} videos`;
        videoCategory.addEventListener('click', () => {
            window.location.href = `index.html?category=${video.category}`;
        });
    }
    
    // Setup video player with quality detection
    setupVideoPlayer(video);
    
    // Display tags if available
    if (videoTags && video.tags && video.tags.length > 0) {
        videoTags.innerHTML = video.tags.map(tag => `
            <span class="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 cursor-pointer hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300 transition-colors" 
                  onclick="filterByTag('${tag}')"
                  title="View all videos with tag: ${tag}">
                #${tag}
            </span>
        `).join('');
        videoTags.classList.remove('hidden');
    }
    
    // Load related videos - UPDATED CALL
    loadRelatedVideos(video._id, video.category, 1, false);
    
    // Update page title
    document.title = `${video.title || 'Video'} - SabSrul`;
     // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update browser history for clean back navigation
    window.history.replaceState({}, '', `video.html?id=${video.shortId}`);
    
    console.log('✅ Video displayed successfully');

}

function setupVideoPlayer(video) {
    const videoPlayer = document.getElementById('videoPlayer');
    
    console.log('🎥 Setting up video player with URL:', video.videoUrl);
    console.log('📊 Available video qualities:', video.qualities);
    
    if (!videoPlayer) {
        console.error('❌ Video player element not found!');
        return;
    }
    
    // Clear any existing content
    videoPlayer.innerHTML = '';
    
    // Detect available qualities
    detectAvailableQualities(video);
    
    // Add the main video source
    const mainSource = document.createElement('source');
    mainSource.src = video.videoUrl;
    mainSource.type = 'video/mp4';
    mainSource.setAttribute('data-quality', 'auto');
    videoPlayer.appendChild(mainSource);
    
    console.log('✅ Added main video source:', video.videoUrl);
    
    // Set poster (thumbnail)
    if (video.thumbnail && video.thumbnail.startsWith('http')) {
        videoPlayer.poster = video.thumbnail;
        console.log('✅ Thumbnail set:', video.thumbnail);
    } else {
        videoPlayer.poster = 'https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=800&h=450&fit=crop';
        console.log('⚠️ Using default thumbnail');
    }
    
    // Enable controls and set attributes
    videoPlayer.controls = true;
    videoPlayer.preload = 'auto';
    videoPlayer.playsInline = true;
    
    // Setup YouTube-style settings controls
    setupSettingsControls();
    
    // Auto-increment views when video starts playing
    videoPlayer.addEventListener('play', function() {
        incrementViews(video._id);
    });
    
    // Listen for video events
    videoPlayer.addEventListener('loadeddata', function() {
        console.log('✅ Video data loaded, ready state:', videoPlayer.readyState);
        console.log('📺 Video dimensions:', videoPlayer.videoWidth, 'x', videoPlayer.videoHeight);
    });
    
    videoPlayer.addEventListener('canplay', function() {
        console.log('🎬 Video can start playing');
    });
    
    videoPlayer.addEventListener('error', function(e) {
        console.error('❌ Video player error:', e);
        console.error('Video error details:', videoPlayer.error);
        handleVideoError(video);
    });
    
    console.log('✅ Video player setup complete');
}

function detectAvailableQualities(video) {
    availableQualities = [];
    
    console.log('🔍 Detecting available qualities from video data:', video);
    
    // Add auto quality first
    availableQualities.push({
        value: 'auto',
        label: 'Auto',
        description: 'Automatically adjust quality'
    });
    
    // Detect from video qualities object (REAL qualities from database)
    if (video.qualities) {
        // Sort qualities from highest to lowest
        Object.entries(video.qualities)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .forEach(([quality, url]) => {
                if (url && url.startsWith('http')) {
                    availableQualities.push({
                        value: quality,
                        label: `${quality}p`,
                        description: `${quality}p - ${getQualityDescription(quality)}`,
                        url: url
                    });
                    console.log(`✅ Found quality: ${quality}p`);
                }
            });
    }
    
    // If no specific qualities found, check if we can determine from main URL
    if (availableQualities.length === 1 && video.videoUrl) {
        console.log('⚠️ No specific qualities found, analyzing main URL');
        // Add the main URL as a quality option
        availableQualities.push({
            value: 'source',
            label: 'Source',
            description: 'Original video quality',
            url: video.videoUrl
        });
    }
    
    console.log('📊 Final available qualities:', availableQualities);
}

function handleVideoError(video) {
    console.error('🚨 Video playback failed, trying fallback strategies');
    
    // Strategy 1: Try the main video URL directly
    const videoPlayer = document.getElementById('videoPlayer');
    if (video.videoUrl && videoPlayer.src !== video.videoUrl) {
        console.log('🔄 Trying main video URL as fallback:', video.videoUrl);
        videoPlayer.src = video.videoUrl;
        return;
    }
    
    // Strategy 2: Show error to user
    console.error('❌ All video sources failed');
    alert('Video playback failed. Please try again or check your internet connection.');
}

function getQualityDescription(quality) {
    const descriptions = {
        '240': 'Low quality',
        '360': 'Basic quality', 
        '480': 'Standard definition',
        '720': 'High definition',
        '1080': 'Full HD',
        '1440': '2K QHD',
        '2160': '4K UHD'
    };
    return descriptions[quality] || 'Video quality';
}

function setupSettingsControls() {
    if (!settingsButton) return;
    
    // Always show settings button (for quality options)
    settingsButton.classList.remove('hidden');
    
    // Populate quality options
    updateQualityOptions();
}

function updateQualityOptions() {
    if (!qualityOptions) return;
    
    qualityOptions.innerHTML = availableQualities.map(quality => `
        <div class="settings-option px-3 py-2.5 hover:bg-gray-700 cursor-pointer transition-colors flex justify-between items-center ${
            quality.value === currentQuality ? 'bg-purple-600 hover:bg-purple-700' : ''
        }" 
             onclick="switchVideoQuality('${quality.value}')"
             data-quality="${quality.value}">
            <div>
                <div class="text-sm">${quality.label}</div>
                ${quality.description ? `<div class="text-xs text-gray-400 mt-0.5">${quality.description}</div>` : ''}
            </div>
            ${quality.value === currentQuality ? 
                '<i class="fas fa-check text-purple-400 ml-2 text-xs"></i>' : 
                ''
            }
        </div>
    `).join('');
}

function toggleSettingsMenu() {
    if (!settingsMenu) return;
    
    if (isSettingsMenuOpen) {
        closeSettingsMenu();
    } else {
        openSettingsMenu();
    }
}

function openSettingsMenu() {
    if (settingsMenu) {
        // Close categories menu when settings open
        const desktopCategoriesMenu = document.getElementById('desktopCategoriesMenu');
        if (desktopCategoriesMenu) {
            desktopCategoriesMenu.classList.add('hidden');
        }
        
        settingsMenu.classList.remove('hidden');
        isSettingsMenuOpen = true;
        
        // Update menu content
        updateQualityOptions();
    }
}

function closeSettingsMenu() {
    if (settingsMenu) {
        settingsMenu.classList.add('hidden');
        isSettingsMenuOpen = false;
    }
}

function switchVideoQuality(quality) {
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (!videoPlayer || !availableQualities.find(q => q.value === quality)) {
        console.warn('⚠️ Quality not available:', quality);
        return;
    }
    
    console.log('🔄 Switching to quality:', quality);
    
    const currentTime = videoPlayer.currentTime;
    const wasPlaying = !videoPlayer.paused;
    const playbackRate = videoPlayer.playbackRate;
    
    if (quality === 'auto') {
        // For auto quality, let the browser decide from available sources
        videoPlayer.src = '';
        videoPlayer.load();
    } else {
        // Find the quality object
        const qualityObj = availableQualities.find(q => q.value === quality);
        if (qualityObj && qualityObj.url) {
            videoPlayer.src = qualityObj.url;
        } else {
            console.warn('❌ Quality URL not found:', quality);
            return;
        }
    }
    
    // Update current quality
    currentQuality = quality;
    
    // Restore playback state
    videoPlayer.currentTime = currentTime;
    videoPlayer.playbackRate = playbackRate;
    
    if (wasPlaying) {
        videoPlayer.play().catch(error => {
            console.warn('⚠️ Auto-play prevented:', error);
        });
    }
    
    // Show quality change notification
    showQualityNotification(quality);
    
    // Close settings menu
    closeSettingsMenu();
    
    console.log('✅ Quality switched to:', quality);
}

function showQualityNotification(quality) {
    // Create or update notification element
    let notification = document.getElementById('qualityChangeNotification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'qualityChangeNotification';
        notification.className = 'absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-sm font-medium z-50';
        document.getElementById('videoPlayer').parentElement.appendChild(notification);
    }
    
    const qualityObj = availableQualities.find(q => q.value === quality);
    notification.textContent = `Quality: ${qualityObj ? qualityObj.label : 'Auto'}`;
    notification.classList.remove('hidden');
    
    // Hide after 2 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2000);
}

// Format category name (capitalize, remove dashes)
function formatCategoryName(category) {
    if (!category) return 'Uncategorized';
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Filter by tag
function filterByTag(tag) {
    console.log(`🏷️ Filtering by tag: ${tag}`);
    
    // Update search input if it exists
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        searchInput.value = tag;
    }
    if (clearSearchBtn) {
        clearSearchBtn.classList.remove('hidden');
    }
    
    // Navigate to index with tag filter
    window.location.href = `index.html?tag=${encodeURIComponent(tag)}`;
}

// Handle like button
async function handleLike() {
    if (!currentVideoId || hasLiked) return;
    
    try {
        const response = await fetch(`/api/videos/${currentVideoId}/like`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            const currentLikes = parseInt(likeCount.textContent) || 0;
            if (likeCount) likeCount.textContent = formatLikes(currentLikes + 1);
            
            // Visual feedback
            hasLiked = true;
            if (likeBtn) {
                likeBtn.innerHTML = '<i class="fas fa-heart text-red-500"></i><span class="font-medium ml-2">' + formatLikes(currentLikes + 1) + '</span>';
                likeBtn.classList.add('text-red-400', 'bg-red-500/20', 'border-red-500/30');
            }
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
            title: videoTitle ? videoTitle.textContent : 'Video',
            text: videoDescription ? videoDescription.textContent : '',
            url: videoUrl,
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(videoUrl).then(() => {
            // Show temporary feedback
            const originalText = shareBtn.innerHTML;
            shareBtn.innerHTML = '<i class="fas fa-check"></i><span class="font-medium ml-2">Copied!</span>';
            shareBtn.classList.add('text-green-400', 'bg-green-500/20');
            setTimeout(() => {
                shareBtn.innerHTML = originalText;
                shareBtn.classList.remove('text-green-400', 'bg-green-500/20');
            }, 2000);
        });
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

// Load related videos - WITH 16 VIDEOS LIMIT AND LOAD MORE
async function loadRelatedVideos(videoId, category, page = 1, append = false) {
    console.log('🔄 Loading related videos...', { category, page, append });
    
    try {
        if (!append) {
            // Show loading only on first load
            if (relatedLoading) relatedLoading.classList.remove('hidden');
            if (relatedVideos) relatedVideos.innerHTML = '';
            if (noRelatedVideos) noRelatedVideos.classList.add('hidden');
            if (relatedLoadMore) relatedLoadMore.classList.add('hidden');
        }
        
        // Get current video data to find tags for better relevance
        const currentVideoResponse = await fetch(`/api/videos/${videoId}`);
        const currentVideo = await currentVideoResponse.json();
        const currentTags = currentVideo.tags || [];
        
        console.log('🏷️ Current video tags for relevance:', currentTags);
        
        let relevantVideos = [];
        let categoryVideos = [];
        let hasMoreFromCategory = false;
        
        // LOAD 16 VIDEOS INITIALLY, 18 ON SUBSEQUENT PAGES
        const limit = page === 1 ? 16 : 18;
        const categoryResponse = await fetch(`/api/videos?category=${category}&page=${page}&limit=${limit}`);
        
        if (!categoryResponse.ok) {
            throw new Error(`Category API returned ${categoryResponse.status}`);
        }
        
        const categoryData = await categoryResponse.json();
        categoryVideos = categoryData.videos || [];
        
        // Calculate if we have more videos (show load more if total > 16)
        const totalVideosInCategory = categoryData.totalCount || 0;
        hasMoreFromCategory = categoryData.hasMore || categoryData.totalPages > page || 
                             (page === 1 && totalVideosInCategory > 16);
        
        console.log('📹 Category videos loaded:', categoryVideos.length, 'Has more:', hasMoreFromCategory, 'Limit:', limit, 'Total in category:', totalVideosInCategory);
        
        // Try to get videos with same tags first (more relevant) - ONLY ON FIRST PAGE
        if (currentTags.length > 0 && page === 1) {
            try {
                const tagPromises = currentTags.map(tag => 
                    fetch(`/api/videos/search/videos?q=${encodeURIComponent(tag)}&limit=5`)
                        .then(res => res.json())
                        .then(data => data.videos || [])
                        .catch(err => [])
                );
                
                const tagResults = await Promise.all(tagPromises);
                relevantVideos = tagResults.flat();
                
                // Remove duplicates and current video
                relevantVideos = relevantVideos.filter((video, index, self) => 
                    video._id !== videoId && 
                    self.findIndex(v => v._id === video._id) === index
                );
                
                console.log('🎯 Found relevant videos by tags:', relevantVideos.length);
            } catch (tagError) {
                console.log('⚠️ Tag-based search failed, using category only');
            }
        }
        
        // Combine videos: tag-relevant first (only on page 1), then category videos
        let allVideos = [];
        
        if (page === 1) {
            // On first page: tag-relevant videos first
            allVideos = [...relevantVideos];
            
            // Add category videos that aren't already in the list, up to 16 total
            for (let video of categoryVideos) {
                if (video._id !== videoId && !allVideos.find(v => v._id === video._id)) {
                    allVideos.push(video);
                    // Stop at 16 videos for first page
                    if (allVideos.length >= 16) break;
                }
            }
        } else {
            // On subsequent pages: only category videos
            allVideos = categoryVideos.filter(video => video._id !== videoId);
        }
        
        // Remove current video if it slipped through
        allVideos = allVideos.filter(video => video._id !== videoId);
        
        console.log('🎯 Final related videos:', allVideos.length, 'Has more:', hasMoreFromCategory);
        
        if (!append && relatedLoading) {
            relatedLoading.classList.add('hidden');
        }
        
        if (allVideos.length > 0) {
            // Update global variables for pagination
            hasMoreRelatedVideos = hasMoreFromCategory;
            currentRelatedCategory = category;
            relatedVideosPage = page;
            
            displayRelatedVideos(allVideos, append);
            
            // Show/hide load more button
            if (relatedLoadMore) {
                if (hasMoreRelatedVideos) {
                    relatedLoadMore.classList.remove('hidden');
                    console.log('🔄 Load More button shown');
                } else {
                    relatedLoadMore.classList.add('hidden');
                    console.log('❌ Load More button hidden');
                }
            }
            
            // Hide empty state
            if (noRelatedVideos) noRelatedVideos.classList.add('hidden');
        } else {
            if (!append) {
                if (noRelatedVideos) noRelatedVideos.classList.remove('hidden');
            }
            if (relatedLoadMore) relatedLoadMore.classList.add('hidden');
        }
    } catch (error) {
        console.error('❌ Error loading related videos:', error);
        if (!append && relatedLoading) relatedLoading.classList.add('hidden');
        if (!append && noRelatedVideos) noRelatedVideos.classList.remove('hidden');
        if (relatedLoadMore) relatedLoadMore.classList.add('hidden');
    }
}

        // Display related videos - EXACT INDEX PAGE STYLING
function displayRelatedVideos(videos, append = false) {
    console.log('📹 Displaying related videos:', videos.length, 'Append:', append);
    if (!relatedVideos) return;
    
    const videosHTML = videos.map(video => `
    <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video._id}">
        <div class="relative">
            <img src="${video.thumbnail}" 
                 alt="${video.title}" 
                 class="w-full h-48 object-cover"
                 onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=400&h=300&fit=crop'">
            <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                ${formatDuration(video.duration)}
            </div>
        </div>
        <div class="mt-3">
            <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title || 'Untitled Video'}</h3>
            <p class="text-gray-600 text-xs mb-1 capitalize">${formatCategoryName(video.category)}</p>
            <div class="flex justify-between text-gray-500 text-xs">
                <span>${formatViews(video.views || 0)} views</span>
                <span>${formatTimeAgo(video.createdAt)}</span>
            </div>
        </div>
    </div>
`).join('');
    
    if (append) {
        relatedVideos.insertAdjacentHTML('beforeend', videosHTML);
    } else {
        relatedVideos.innerHTML = videosHTML;
    }
}

// Load more related videos
async function loadMoreRelatedVideos() {
    if (!currentVideoId || !hasMoreRelatedVideos) return;
    
    relatedVideosPage++;
    await loadRelatedVideos(currentVideoId, currentRelatedCategory, relatedVideosPage, true);
}

// Search functionality for video page
function setupVideoSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput && clearSearchBtn) {
        // Check if we're on a tag page and pre-fill search
        const urlParams = new URLSearchParams(window.location.search);
        const tag = urlParams.get('tag');
        
        if (tag) {
            searchInput.value = tag;
            clearSearchBtn.classList.remove('hidden');
        }
        
        // Show/hide clear button based on input
        searchInput.addEventListener('input', function() {
            if (this.value.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
                clearVideoSearch();
            }
        });
        
        // Handle search submission
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query.length > 0) {
                    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
        
        // Clear search when X is clicked
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            clearVideoSearch();
        });
        
        // Hide clear button on page load if no search
        if (!tag) {
            clearSearchBtn.classList.add('hidden');
        }
    }
}

// Clear search/tag on video page
function clearVideoSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    const search = urlParams.get('search');
    
    // If we're on a tag or search page, redirect to clean index
    if (tag || search) {
        window.location.href = 'index.html';
    }
}

// Show video error state
function showVideoError() {
    console.log('❌ Showing video error');
    
    // Safely handle elements
    if (videoLoading) videoLoading.classList.add('hidden');
    if (videoContent) videoContent.classList.add('hidden');
    if (videoError) videoError.classList.remove('hidden');
}

// Utility functions
function formatViews(views) {
    if (!views && views !== 0) return '0';
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}
// Utility functions
function formatDuration(seconds) {
    // Handle undefined, null, or 0 duration
    if (!seconds || seconds === 0) {
        return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views) {
    if (!views && views !== 0) return '0';
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}

function formatLikes(likes) {
    if (!likes && likes !== 0) return '0';
    if (likes >= 1000) {
        return (likes / 1000).toFixed(1) + 'K';
    }
    return likes.toString();
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffMonths < 12) return `${diffMonths} months ago`;
        return `${Math.floor(diffMonths / 12)} years ago`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Recently';
    }
}
function formatLikes(likes) {
    if (!likes && likes !== 0) return '0';
    if (likes >= 1000) {
        return (likes / 1000).toFixed(1) + 'K';
    }
    return likes.toString();
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffMonths < 12) return `${diffMonths} months ago`;
        return `${Math.floor(diffMonths / 12)} years ago`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Recently';
    }
}
// In video.js - track watch time
let watchStartTime = Date.now();

videoPlayer.addEventListener('play', function() {
    watchStartTime = Date.now();
});

videoPlayer.addEventListener('pause', function() {
    const watchTime = Math.round((Date.now() - watchStartTime) / 1000);
    console.log(`User watched ${watchTime} seconds`);
    // Send to analytics
});

// Make functions globally available
window.filterByTag = filterByTag;
window.toggleSettingsMenu = toggleSettingsMenu;
window.switchVideoQuality = switchVideoQuality;
window.loadMoreRelatedVideos = loadMoreRelatedVideos; // ADD THIS LINE
window.loadVideosByCategory = function(category) {
    window.location.href = `index.html?category=${category}`;
};
