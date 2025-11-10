console.log('✅ video.js loaded!');

// DOM Elements
const videoLoading = document.getElementById('videoLoading');
const videoContent = document.getElementById('videoContent');
const videoError = document.getElementById('videoError');
const videoTitle = document.getElementById('videoTitle');
const videoViews = document.getElementById('videoViews');
const videoDate = document.getElementById('videoDate');
const videoCategory = document.getElementById('videoCategory');
const videoTags = document.getElementById('videoTags');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const shareBtn = document.getElementById('shareBtn');
const relatedLoading = document.getElementById('relatedLoading');
const relatedVideos = document.getElementById('relatedVideos');
const noRelatedVideos = document.getElementById('noRelatedVideos');
const videoPlayer = document.getElementById('videoPlayer');
const relatedLoadMore = document.getElementById('relatedLoadMore');

// Interaction buttons
const watchLaterBtn = document.getElementById('watchLaterBtn');
const addToPlaylistBtn = document.getElementById('addToPlaylistBtn');
const playlistDropdown = document.getElementById('playlistDropdown');
const playlistList = document.getElementById('playlistList');
const createPlaylistBtn = document.getElementById('createPlaylistBtn');

// Global variables
let currentVideoId = null;
let hasLiked = false;
let hasWatchLater = false;
let userPlaylists = [];

// RELATED VIDEOS PAGINATION
let relatedVideosPage = 1;
let hasMoreRelatedVideos = false;
let currentRelatedCategory = '';

// Initialize the page
let pageInitialized = false;

// REMOVED: The duplicate navigation functions that were causing errors

// Setup event listeners for video-specific interactions
function setupEventListeners() {
    console.log('🎬 Setting up video event listeners');
    
    // Search functionality
    setupVideoSearch();
    
    // Like button
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }

    // Watch Later button
    if (watchLaterBtn) {
        watchLaterBtn.addEventListener('click', handleWatchLater);
    }

    // Add to Playlist button
    if (addToPlaylistBtn) {
        addToPlaylistBtn.addEventListener('click', togglePlaylistDropdown);
    }

    // Create Playlist button
    if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', createNewPlaylist);
    }

    // Share button
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }

    // ADD THIS: Event delegation for related video clicks
    document.addEventListener('click', function(e) {
        const videoCard = e.target.closest('.video-card');
        if (videoCard) {
            const videoId = videoCard.getAttribute('data-video-id');
            if (videoId) {
                navigateToVideo(videoId);
            }
        }
    });
}

// Navigate to video page
function navigateToVideo(videoId) {
    window.location.href = `/video.html?id=${videoId}`;
}

// ==================== INTERACTION FUNCTIONS ====================

async function handleLike() {
    const token = localStorage.getItem('token');
    if (!token || !currentVideoId) {
        showLoginPrompt('like videos');
        return;
    }

    try {
        const response = await fetch(`/api/interactions/like/${currentVideoId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            simulateLikeFunctionality();
            return;
        }

        const data = await response.json();
        
        hasLiked = data.liked;
        
        // Update like button UI
        if (likeBtn) {
            if (data.liked) {
                likeBtn.innerHTML = '<i class="fas fa-heart text-red-500"></i><span class="font-medium ml-2">Liked</span>';
                likeBtn.classList.add('text-red-600', 'bg-red-50', 'border-red-200');
            } else {
                likeBtn.innerHTML = '<i class="far fa-heart"></i><span class="font-medium ml-2">Like</span>';
                likeBtn.classList.remove('text-red-600', 'bg-red-50', 'border-red-200');
            }
        }
        
        // Update like count if provided
        if (data.likes !== undefined && likeCount) {
            likeCount.textContent = formatLikes(data.likes);
        }
        
    } catch (error) {
        console.error('Error liking video:', error);
        simulateLikeFunctionality();
    }
}

function simulateLikeFunctionality() {
    hasLiked = !hasLiked;
    
    // Update like button UI
    if (likeBtn) {
        if (hasLiked) {
            likeBtn.innerHTML = '<i class="fas fa-heart text-red-500 text-sm"></i><span class="font-medium text-sm ml-2">' + (window.innerWidth < 640 ? 'Liked' : (parseInt(likeCount.textContent) || 0) + 1) + '</span>';
            likeBtn.classList.add('text-red-600', 'bg-red-50', 'border-red-200');
            
            // Update like count
            const currentCount = parseInt(likeCount.textContent) || 0;
            likeCount.textContent = currentCount + 1;
        } else {
            likeBtn.innerHTML = '<i class="far fa-heart text-sm"></i><span class="font-medium text-sm ml-2 hidden sm:inline">Like</span><span class="font-medium text-sm ml-2 sm:hidden">Like</span>';
            likeBtn.classList.remove('text-red-600', 'bg-red-50', 'border-red-200');
            
            // Update like count
            const currentCount = parseInt(likeCount.textContent) || 1;
            likeCount.textContent = Math.max(0, currentCount - 1);
        }
    }
    
    // Store in localStorage for persistence
    const token = localStorage.getItem('token');
    if (token) {
        const userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');
        if (hasLiked) {
            userLikes[currentVideoId] = true;
        } else {
            delete userLikes[currentVideoId];
        }
        localStorage.setItem('userLikes', JSON.stringify(userLikes));
    }
    
    // Update the UI
    updateInteractionUI();
}

async function handleWatchLater() {
    const token = localStorage.getItem('token');
    if (!token || !currentVideoId) {
        showLoginPrompt('add videos to watch later');
        return;
    }

    try {
        const response = await fetch(`/api/interactions/watch-later/${currentVideoId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            simulateWatchLaterFunctionality();
            return;
        }

        const data = await response.json();
        
        if (response.ok) {
            hasWatchLater = data.watchLater;
            updateWatchLaterUI();
        }
    } catch (error) {
        console.error('Error with watch later:', error);
        simulateWatchLaterFunctionality();
    }
}

// Simulate watch later functionality
function simulateWatchLaterFunctionality() {
    hasWatchLater = !hasWatchLater;
    
    // Update watch later button UI
    if (watchLaterBtn) {
        if (hasWatchLater) {
            watchLaterBtn.innerHTML = '<i class="fas fa-clock text-yellow-500 text-sm"></i><span class="font-medium text-sm ml-2 hidden sm:inline">Added</span><span class="font-medium text-sm ml-2 sm:hidden">Added</span>';
            watchLaterBtn.classList.add('text-yellow-600', 'bg-yellow-50', 'border-yellow-200');
        } else {
            watchLaterBtn.innerHTML = '<i class="far fa-clock text-sm"></i><span class="font-medium text-sm ml-2 hidden sm:inline">Watch Later</span><span class="font-medium text-sm ml-2 sm:hidden">Later</span>';
            watchLaterBtn.classList.remove('text-yellow-600', 'bg-yellow-50', 'border-yellow-200');
        }
    }
}
function updateWatchLaterUI() {
    if (watchLaterBtn) {
        if (hasWatchLater) {
            watchLaterBtn.innerHTML = '<i class="fas fa-clock text-yellow-500"></i><span class="font-medium ml-2">Added</span>';
            watchLaterBtn.classList.add('text-yellow-600', 'bg-yellow-50', 'border-yellow-200');
        } else {
            watchLaterBtn.innerHTML = '<i class="far fa-clock"></i><span class="font-medium ml-2">Watch Later</span>';
            watchLaterBtn.classList.remove('text-yellow-600', 'bg-yellow-50', 'border-yellow-200');
        }
    }
}

function showLoginPrompt(action) {
    if (confirm(`Please log in to ${action}. Would you like to go to the login page?`)) {
        window.location.href = 'login.html';
    }
}

async function handleAddToPlaylist(playlistId) {
    const token = localStorage.getItem('token');
    if (!token || !currentVideoId) {
        alert('Please log in to add to playlist');
        return;
    }

    try {
        console.log('🔄 Adding video to playlist:', { playlistId, videoId: currentVideoId });
        
        const response = await fetch(`/api/playlists/${playlistId}/videos/${currentVideoId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('❌ Server returned non-JSON response:', textResponse.substring(0, 200));
            throw new Error('Server error - please try again later');
        }

        const data = await response.json();

        if (response.ok) {
            alert('Video added to playlist!');
            closePlaylistDropdown();
        } else {
            console.error('❌ API error response:', data);
            alert(data.message || 'Error adding to playlist');
        }
    } catch (error) {
        console.error('❌ Error adding to playlist:', error);
        
        // Fallback to localStorage
        if (error.message.includes('JSON') || error.message.includes('Server error')) {
            console.log('🔄 Using localStorage fallback for playlist');
            addToPlaylistLocalStorage(playlistId);
        } else {
            alert('Error adding to playlist: ' + error.message);
        }
    }
}

// Add to playlist using localStorage fallback
function addToPlaylistLocalStorage(playlistId) {
    try {
        const localPlaylists = JSON.parse(localStorage.getItem('localPlaylists') || '[]');
        const playlistIndex = localPlaylists.findIndex(p => p._id === playlistId);
        
        if (playlistIndex === -1) {
            alert('Playlist not found in local storage');
            return;
        }
        
        const playlist = localPlaylists[playlistIndex];
        
        if (!playlist.videos) {
            playlist.videos = [];
        }
        
        // Check if video is already in playlist
        const videoExists = playlist.videos.some(v => v._id === currentVideoId);
        
        if (videoExists) {
            alert('Video is already in this playlist!');
            return;
        }
        
        // Get current video information
        const videoTitle = document.getElementById('videoTitle')?.textContent || 'Unknown Video';
        const videoThumbnail = document.querySelector('#videoPlayer')?.poster || '';
        const videoCategory = document.getElementById('videoCategory')?.textContent || 'unknown';
        
        // Create a complete video object for storage
        const videoToAdd = {
            _id: currentVideoId,
            title: videoTitle,
            thumbnail: videoThumbnail,
            duration: 0,
            category: videoCategory,
            addedAt: new Date().toISOString()
        };
        
        // Add video to playlist
        playlist.videos.push(videoToAdd);
        playlist.updatedAt = new Date().toISOString();
        
        // Update the playlist in the array
        localPlaylists[playlistIndex] = playlist;
        
        // Save back to localStorage
        localStorage.setItem('localPlaylists', JSON.stringify(localPlaylists));
        
        alert(`✅ Video added to playlist! (Saved locally)\nNow has ${playlist.videos.length} video${playlist.videos.length !== 1 ? 's' : ''}`);
        closePlaylistDropdown();
        
    } catch (error) {
        console.error('❌ Error with localStorage fallback:', error);
        alert('Error saving to playlist locally: ' + error.message);
    }
}

async function loadUserPlaylists() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/playlists/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userPlaylists = data.playlists || [];
            updatePlaylistDropdown();
        }
    } catch (error) {
        console.error('Error loading playlists:', error);
    }
}

function updatePlaylistDropdown() {
    if (!playlistList) return;

    const localPlaylists = JSON.parse(localStorage.getItem('localPlaylists') || '[]');
    const availablePlaylists = userPlaylists.length > 0 ? userPlaylists : localPlaylists;

    if (availablePlaylists.length === 0) {
        playlistList.innerHTML = `
            <div class="px-4 py-3 text-sm text-gray-500 text-center">
                No playlists yet
            </div>
        `;
        return;
    }

    playlistList.innerHTML = availablePlaylists.map(playlist => `
        <div class="playlist-item px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between" 
             onclick="handleAddToPlaylist('${playlist._id}')">
            <div>
                <div class="text-sm font-medium">${playlist.name}</div>
                <div class="text-xs text-gray-500">${playlist.videos ? playlist.videos.length : 0} videos</div>
            </div>
            <i class="fas fa-plus text-gray-400"></i>
        </div>
    `).join('');
}

function togglePlaylistDropdown() {
    if (!playlistDropdown) return;

    if (playlistDropdown.classList.contains('hidden')) {
        playlistDropdown.classList.remove('hidden');
        loadUserPlaylists();
    } else {
        playlistDropdown.classList.add('hidden');
    }
}

function closePlaylistDropdown() {
    if (playlistDropdown) {
        playlistDropdown.classList.add('hidden');
    }
}

async function createNewPlaylist() {
    const playlistName = prompt('Enter playlist name:');
    if (!playlistName) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to create playlists');
        return;
    }

    try {
        const response = await fetch('/api/playlists', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: playlistName,
                description: '',
                isPublic: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            userPlaylists.push(data.playlist);
            updatePlaylistDropdown();
            // Automatically add current video to the new playlist
            await handleAddToPlaylist(data.playlist._id);
        } else {
            alert('Error creating playlist');
        }
    } catch (error) {
        console.error('Error creating playlist:', error);
    }
}

// ==================== VIDEO PLAYER FUNCTIONS ====================

// Load video data
async function loadVideo(videoId) {
    console.log('🔄 Loading video data for:', videoId);
    
    // Setup event listeners first
    setupEventListeners();
    
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
    
    // Check user's interaction state
    checkUserInteractionState(video._id);
    
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
    
    // Setup video player
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
    
    // Load related videos
    loadRelatedVideos(video._id, video.category, 1, false);
    
    // Update page title
    document.title = `${video.title || 'Video'} - SabSrul`;
    
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ Video displayed successfully');
}

function setupVideoPlayer(video) {
    const videoPlayer = document.getElementById('videoPlayer');
    
    console.log('🎥 Setting up video player with URL:', video.videoUrl);
    
    if (!videoPlayer) {
        console.error('❌ Video player element not found!');
        return;
    }
    
    // Clear any existing content and reset
    videoPlayer.innerHTML = '';
    
    // Set src directly
    videoPlayer.src = video.videoUrl;
    
    console.log('✅ Set video source directly:', video.videoUrl);
    
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
    
    // Auto-increment views when video starts playing
    videoPlayer.addEventListener('play', function() {
        incrementViews(video._id);
    });
    
    // Listen for video events
    videoPlayer.addEventListener('loadeddata', function() {
        console.log('✅ Video data loaded successfully');
    });
    
    videoPlayer.addEventListener('error', function(e) {
        console.error('❌ Video player error:', e);
        console.error('Video error code:', videoPlayer.error?.code);
        console.error('Video error message:', videoPlayer.error?.message);
        
        // Try alternative approach - reload the video
        if (video.videoUrl) {
            console.log('🔄 Trying to reload video');
            videoPlayer.load();
        }
    });
    
    // Load the video
    videoPlayer.load();
    
    console.log('✅ Video player setup complete');
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

// ==================== RELATED VIDEOS FUNCTIONALITY ====================

// Load related videos
async function loadRelatedVideos(videoId, category, page = 1, append = false) {
    console.log('🔄 Loading related videos...', { category, page, append });
    
    try {
        if (!append) {
            if (relatedLoading) relatedLoading.classList.remove('hidden');
            if (relatedVideos) relatedVideos.innerHTML = '';
            if (noRelatedVideos) noRelatedVideos.classList.add('hidden');
            if (relatedLoadMore) relatedLoadMore.classList.add('hidden');
        }
        
        const limit = page === 1 ? 16 : 18;
        const categoryResponse = await fetch(`/api/videos?category=${category}&page=${page}&limit=${limit}`);
        
        if (!categoryResponse.ok) {
            throw new Error(`Category API returned ${categoryResponse.status}`);
        }
        
        const categoryData = await categoryResponse.json();
        const categoryVideos = categoryData.videos || [];
        
        // Calculate if we have more videos
        const totalVideosInCategory = categoryData.totalCount || 0;
        hasMoreFromCategory = categoryData.hasMore || categoryData.totalPages > page || 
                             (page === 1 && totalVideosInCategory > 16);
        
        console.log('📹 Category videos loaded:', categoryVideos.length, 'Has more:', hasMoreFromCategory);
        
        // Remove current video and filter
        let allVideos = categoryVideos.filter(video => video._id !== videoId);
        
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

// Display related videos
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

// Add this function to check user's interaction state
async function checkUserInteractionState(videoId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // Check localStorage first for fallback data
        const userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');
        const userWatchLater = JSON.parse(localStorage.getItem('userWatchLater') || '{}');
        
        hasLiked = userLikes[videoId] || false;
        hasWatchLater = userWatchLater[videoId] || false;
        
        // Try to get real data from server
        const response = await fetch(`/api/interactions/user/interactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('🔍 User interactions data:', data);
            
            // Update with real data if available
            if (data.likedVideos && Array.isArray(data.likedVideos)) {
                hasLiked = data.likedVideos.some(video => video._id === videoId || video === videoId);
            }
            
            if (data.watchLater && Array.isArray(data.watchLater)) {
                hasWatchLater = data.watchLater.some(video => video._id === videoId || video === videoId);
            }
        } else {
            console.log('⚠️ Could not fetch user interactions, using localStorage data');
        }
        
        // Update UI
        updateInteractionUI();
        
    } catch (error) {
        console.error('Error checking user interaction:', error);
        updateInteractionUI();
    }
}

function updateInteractionUI() {
    // Update like button
    if (likeBtn) {
        if (hasLiked) {
            likeBtn.innerHTML = '<i class="fas fa-heart text-red-500 text-sm"></i><span class="font-medium text-sm ml-2">' + (window.innerWidth < 640 ? 'Liked' : likeCount.textContent) + '</span>';
            likeBtn.classList.add('text-red-600', 'bg-red-50', 'border-red-200');
        } else {
            likeBtn.innerHTML = '<i class="far fa-heart text-sm"></i><span class="font-medium text-sm ml-2 hidden sm:inline">Like</span><span class="font-medium text-sm ml-2 sm:hidden">Like</span>';
            likeBtn.classList.remove('text-red-600', 'bg-red-50', 'border-red-200');
        }
    }

    // Update watch later button
    if (watchLaterBtn) {
        if (hasWatchLater) {
            watchLaterBtn.innerHTML = '<i class="fas fa-clock text-yellow-500 text-sm"></i><span class="font-medium text-sm ml-2 hidden sm:inline">Added</span><span class="font-medium text-sm ml-2 sm:hidden">Added</span>';
            watchLaterBtn.classList.add('text-yellow-600', 'bg-yellow-50', 'border-yellow-200');
        } else {
            watchLaterBtn.innerHTML = '<i class="far fa-clock text-sm"></i><span class="font-medium text-sm ml-2 hidden sm:inline">Watch Later</span><span class="font-medium text-sm ml-2 sm:hidden">Later</span>';
            watchLaterBtn.classList.remove('text-yellow-600', 'bg-yellow-50', 'border-yellow-200');
        }
    }
}

// ==================== SEARCH FUNCTIONALITY ====================

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

// ==================== UTILITY FUNCTIONS ====================

// Show video error state
function showVideoError() {
    console.log('❌ Showing video error');
    
    // Safely handle elements
    if (videoLoading) videoLoading.classList.add('hidden');
    if (videoContent) videoContent.classList.add('hidden');
    if (videoError) videoError.classList.remove('hidden');
}

// Utility functions
function formatDuration(seconds) {
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
        if (diffMonths < 12) return `${diffMonths} months ago`;
        return `${Math.floor(diffMonths / 12)} years ago`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Recently';
    }
}

// Format category name for display
function formatCategoryName(category) {
    if (!category) return 'Uncategorized';
    
    // If category is an object with name property
    if (typeof category === 'object' && category.name) {
        return category.name.charAt(0).toUpperCase() + category.name.slice(1);
    }
    
    // If category is a string
    if (typeof category === 'string') {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    return 'Uncategorized';
}

function handleShare() {
    const videoUrl = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: videoTitle ? videoTitle.textContent : 'Video',
            text: '',
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

// ==================== GLOBAL FUNCTIONS ====================

// Make functions globally available
window.filterByTag = filterByTag;
window.loadMoreRelatedVideos = loadMoreRelatedVideos;
window.loadVideosByCategory = function(category) {
    window.location.href = `index.html?category=${category}`;
};
window.handleAddToPlaylist = handleAddToPlaylist;
window.togglePlaylistDropdown = togglePlaylistDropdown;
window.closePlaylistDropdown = closePlaylistDropdown;
window.createNewPlaylist = createNewPlaylist;
window.navigateToVideo = navigateToVideo;
window.loadVideo = loadVideo; // Make loadVideo globally available

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

// Quick fix for related videos click
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('.video-card');
    if (videoCard && videoCard.hasAttribute('data-video-id')) {
        const videoId = videoCard.getAttribute('data-video-id');
        window.location.href = `/video.html?id=${videoId}`;
    }
});

// Handle responsive text changes on window resize
window.addEventListener('resize', function() {
    updateInteractionUI();
});

// Also call it once on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateInteractionUI, 100);
});