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
const relatedLoading = document.getElementById('relatedLoading');
const relatedVideos = document.getElementById('relatedVideos');
const noRelatedVideos = document.getElementById('noRelatedVideos');
const relatedCount = document.getElementById('relatedCount');

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
    setupEventListeners();
    loadCategories(); // Load categories for navigation
    loadVideo(videoId);
}

function setupEventListeners() {
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
    
    // Mobile categories menu
    if (mobileCategories) {
        mobileCategories.innerHTML = categories.map(category => `
            <a href="index.html?category=${category.slug || category.name}" 
               class="flex items-center px-3 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors rounded-lg border border-gray-100">
                <i class="fas fa-play-circle text-purple-500 mr-3 w-4"></i>
                <span class="capitalize">${category.name}</span>
            </a>
        `).join('');
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
    
    // Set current video ID for like functionality
    currentVideoId = video._id;
    
    // Safely hide/show elements
    if (videoLoading) videoLoading.classList.add('hidden');
    if (videoContent) videoContent.classList.remove('hidden');
    
    // Set video info
    if (videoTitle) videoTitle.textContent = video.title || 'Untitled Video';
    if (videoViews) videoViews.textContent = `${formatViews(video.views || 0)} views`;
    if (videoDate) videoDate.textContent = formatTimeAgo(video.createdAt);
    if (videoDescription) videoDescription.textContent = video.description || 'No description available.';
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
    
    // Update page title
    document.title = `${video.title || 'Video'} - SabSrul`;
    
    console.log('✅ Video displayed successfully');
}

function setupVideoPlayer(video) {
    const videoPlayer = document.getElementById('videoPlayer');
    
    console.log('🎥 Setting up video player with URL:', video.videoUrl);
    
    if (!videoPlayer) {
        console.error('❌ Video player element not found!');
        return;
    }
    
    // Clear any existing content
    videoPlayer.innerHTML = '';
    
    // Detect available qualities
    detectAvailableQualities(video);
    
    // Add main video source
    const mainSource = document.createElement('source');
    mainSource.src = video.videoUrl;
    mainSource.type = 'video/mp4';
    mainSource.setAttribute('data-quality', 'auto');
    videoPlayer.appendChild(mainSource);
    
    // Add alternative qualities if available
    if (video.qualities) {
        Object.entries(video.qualities).forEach(([quality, url]) => {
            if (url && url.startsWith('http')) {
                const qualitySource = document.createElement('source');
                qualitySource.src = url;
                qualitySource.type = 'video/mp4';
                qualitySource.setAttribute('data-quality', quality);
                qualitySource.setAttribute('data-res', `${quality}p`);
                videoPlayer.appendChild(qualitySource);
            }
        });
    }
    
    // Set poster (thumbnail)
    if (video.thumbnail && video.thumbnail.startsWith('http')) {
        videoPlayer.poster = video.thumbnail;
        console.log('✅ Thumbnail set:', video.thumbnail);
    } else {
        videoPlayer.poster = 'https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=800&h=450&fit=crop';
        console.log('⚠️ Using default thumbnail');
    }
    
    // Enable controls
    videoPlayer.controls = true;
    
    // Setup YouTube-style settings controls
    setupSettingsControls();
    
    // Auto-increment views when video starts playing
    videoPlayer.addEventListener('play', function() {
        incrementViews(video._id);
    });
    
    console.log('✅ Video player setup complete');
    console.log('📊 Qualities available:', availableQualities);
}

function detectAvailableQualities(video) {
    availableQualities = [];
    
    // Add auto quality first
    availableQualities.push({
        value: 'auto',
        label: 'Auto',
        description: 'Automatically adjust quality'
    });
    
    // Detect from video URLs
    if (video.videoUrls) {
        Object.entries(video.videoUrls).forEach(([quality, url]) => {
            if (url && url.startsWith('http')) {
                availableQualities.push({
                    value: quality,
                    label: `${quality}p`,
                    description: `${quality}p - ${getQualityDescription(quality)}`
                });
            }
        });
    }
    
    // If no specific qualities, analyze the main video
    if (availableQualities.length === 1 && video.videoUrl) {
        // Simulate quality detection based on file size or other factors
        if (video.fileSize > 200 * 1024 * 1024) { // >200MB = likely 1080p
            availableQualities.push(
                { value: '1080', label: '1080p', description: '1080p - Full HD' },
                { value: '720', label: '720p', description: '720p - HD' },
                { value: '480', label: '480p', description: '480p - Standard' }
            );
        } else if (video.fileSize > 100 * 1024 * 1024) { // >100MB = likely 720p
            availableQualities.push(
                { value: '720', label: '720p', description: '720p - HD' },
                { value: '480', label: '480p', description: '480p - Standard' },
                { value: '360', label: '360p', description: '360p - Basic' }
            );
        } else { // Smaller file
            availableQualities.push(
                { value: '480', label: '480p', description: '480p - Standard' },
                { value: '360', label: '360p', description: '360p - Basic' },
                { value: '240', label: '240p', description: '240p - Low' }
            );
        }
    }
    
    console.log('📊 Available qualities:', availableQualities);
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
        // For auto quality, let the browser decide
        videoPlayer.src = videoPlayer.querySelector('source[data-quality="auto"]').src;
    } else {
        // Find the source for the selected quality
        const targetSource = videoPlayer.querySelector(`source[data-quality="${quality}"]`);
        if (targetSource) {
            videoPlayer.src = targetSource.src;
        } else {
            console.warn('❌ Quality source not found:', quality);
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

// Load related videos
async function loadRelatedVideos(videoId, category) {
    console.log('🔄 Loading related videos...');
    try {
        const response = await fetch(`/api/videos/related/${videoId}?category=${category}&limit=6`);
        const relatedVideosData = await response.json();
        
        if (relatedLoading) relatedLoading.classList.add('hidden');
        
        if (relatedVideosData && relatedVideosData.length > 0) {
            if (relatedCount) relatedCount.textContent = relatedVideosData.length;
            displayRelatedVideos(relatedVideosData);
        } else {
            if (noRelatedVideos) noRelatedVideos.classList.remove('hidden');
            if (relatedCount) relatedCount.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading related videos:', error);
        if (relatedLoading) relatedLoading.classList.add('hidden');
        if (noRelatedVideos) noRelatedVideos.classList.remove('hidden');
        if (relatedCount) relatedCount.textContent = '0';
    }
}

// Display related videos
function displayRelatedVideos(videos) {
    console.log('📹 Displaying related videos:', videos.length);
    if (!relatedVideos) return;
    
    relatedVideos.innerHTML = videos.map(video => `
        <div class="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-gray-50 transition duration-200 cursor-pointer video-card" 
             onclick="window.location.href='video.html?id=${video._id}'">
            <img src="${video.thumbnail}" 
                 alt="${video.title}" 
                 class="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                 onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=80&h=56&fit=crop'">
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">${video.title || 'Untitled Video'}</h4>
                <p class="text-xs text-gray-600 mb-1 capitalize">${formatCategoryName(video.category)}</p>
                <div class="flex items-center text-xs text-gray-500">
                    <span>${formatViews(video.views || 0)} views</span>
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

// Make functions globally available
window.filterByTag = filterByTag;
window.toggleSettingsMenu = toggleSettingsMenu;
window.switchVideoQuality = switchVideoQuality;
window.loadVideosByCategory = function(category) {
    window.location.href = `index.html?category=${category}`;
};