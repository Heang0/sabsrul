// Profile Page JavaScript
console.log('✅ profile.js loaded!');

// DOM Elements
let currentUser = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Profile page loaded');
    checkAuthState();
    setupEventListeners();
    loadUserProfile();
    
    // Test API endpoints
    testAPIEndpoints();
    
    // Test playlist API immediately
    setTimeout(() => {
        console.log('🧪 Testing playlist API on page load...');
        if (typeof testPlaylistAPI === 'function') {
            testPlaylistAPI();
        } else {
            console.log('⚠️ testPlaylistAPI function not found');
        }
    }, 1000);
});

function checkAuthState() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('🔐 Profile auth check:', { hasToken: !!token, user: user });
    
    if (token && user.id) {
        currentUser = user;
        document.getElementById('userSection').classList.remove('hidden');
        document.getElementById('authButtons').classList.add('hidden');
        updateUserInfo(user);
    } else {
        window.location.href = 'login.html';
    }
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('cancelBtn').addEventListener('click', resetProfileForm);

    // Avatar change
    document.getElementById('changeAvatarBtn').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });
    document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);

    // Playlist creation
    document.getElementById('createPlaylistBtn').addEventListener('click', createNewPlaylist);
    document.getElementById('createFirstPlaylistBtn').addEventListener('click', createNewPlaylist);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Mobile navigation - Add this line
    setupMobileNavigation();
}

function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('border-purple-500', 'text-purple-600');
            button.classList.remove('border-transparent', 'text-gray-500');
        } else {
            button.classList.remove('border-purple-500', 'text-purple-600');
            button.classList.add('border-transparent', 'text-gray-500');
        }
    });

    // Show/hide tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');

    // Load tab content with debugging
    console.log(`📂 Loading content for tab: ${tabName}`);
    switch(tabName) {
        case 'watch-later':
            loadWatchLaterVideos();
            break;
        case 'playlists':
            console.log('🎵 Loading playlists tab...');
            loadUserPlaylists();
            break;
        case 'liked':
            loadLikedVideos();
            break;
    }
}

// ==================== PROFILE MANAGEMENT ====================

async function loadUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // Load basic user data first
        const userResponse = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success) {
                populateProfileForm(userData.user);
                // Load stats in background
                loadUserStats();
            }
        } else {
            console.log('❌ Failed to load user profile');
            // Use local storage data as fallback
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            populateProfileForm(user);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Use local storage data as fallback
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        populateProfileForm(user);
    }
}

function populateProfileForm(user) {
    console.log('📝 Populating profile form with user:', user);
    
    // Safely get DOM elements
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const bioInput = document.getElementById('bio');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const memberSince = document.getElementById('memberSince');
    
    // Safely set values only if elements exist
    if (usernameInput) usernameInput.value = user.username || '';
    if (emailInput) emailInput.value = user.email || '';
    if (bioInput) bioInput.value = user.bio || 'No bio yet';
    
    // Update display elements
    if (profileUsername) profileUsername.textContent = user.username || 'User';
    if (profileEmail) profileEmail.textContent = user.email || '';
    
    if (profileAvatar) {
        profileAvatar.src = user.avatar || 'https://via.placeholder.com/150/9333ea/ffffff?text=U';
        profileAvatar.alt = user.username || 'User';
    }
    
    // Format member since date
    if (memberSince && user.createdAt) {
        const joinDate = new Date(user.createdAt).toLocaleDateString();
        memberSince.textContent = joinDate;
    }
    
    console.log('✅ Profile form populated successfully');
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to update your profile');
        return;
    }

    const formData = {
        username: document.getElementById('username').value.trim(),
        bio: document.getElementById('bio').value.trim()
    };

    // Basic validation
    if (!formData.username) {
        alert('Username is required');
        return;
    }

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Update local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.username = data.user.username;
            user.bio = data.user.bio;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update UI
            populateProfileForm(user);
            updateUserInfo(user);
            
            alert('Profile updated successfully!');
        } else {
            alert(data.message || 'Error updating profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Network error. Please try again.');
    }
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Enhanced file validation
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB. Your file: ' + (file.size / (1024 * 1024)).toFixed(1) + 'MB');
        return;
    }

    // Show file info to user
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    console.log(`📸 Selected file: ${file.name}, ${fileSizeMB}MB, ${file.type}`);

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to change avatar');
        return;
    }

    // Show loading state with file info
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const originalText = changeAvatarBtn.innerHTML;
    changeAvatarBtn.innerHTML = `<i class="fas fa-compress-alt fa-spin mr-2"></i>Compressing ${fileSizeMB}MB...`;
    changeAvatarBtn.disabled = true;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        console.log('🔄 Uploading and compressing avatar...');
        
        const response = await fetch('/api/users/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        console.log('📨 Avatar upload response:', data);

        if (response.ok && data.success) {
            // Update local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.avatar = data.avatarUrl;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update UI elements with cache busting
            const profileAvatar = document.getElementById('profileAvatar');
            const userAvatar = document.getElementById('userAvatar');
            
            if (profileAvatar) {
                profileAvatar.src = data.avatarUrl + '?t=' + new Date().getTime();
            }
            if (userAvatar) {
                userAvatar.src = data.avatarUrl + '?t=' + new Date().getTime();
            }
            
            // Update user info display
            updateUserInfo(user);
            
            // Show compression stats to user
            const savings = data.compression?.savings || 0;
            if (savings > 0) {
                console.log(`✅ Avatar optimized! ${savings}% smaller`);
                alert(`Avatar updated successfully! (Optimized - ${savings}% smaller)`);
            } else {
                alert('Avatar updated successfully!');
            }
            
        } else {
            console.error('❌ Avatar upload failed:', data);
            alert(data.message || 'Error updating avatar. Please try again.');
        }
    } catch (error) {
        console.error('❌ Network error uploading avatar:', error);
        alert('Network error. Please check your connection and try again.');
    } finally {
        // Reset button state
        changeAvatarBtn.innerHTML = originalText;
        changeAvatarBtn.disabled = false;
        // Clear file input
        e.target.value = '';
    }
}

function resetProfileForm() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    populateProfileForm(user);
}

// ==================== USER STATS ====================

async function loadUserStats() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token for stats');
        return;
    }

    try {
        // Try the stats endpoint first
        const response = await fetch('/api/users/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Safely update stats - check if elements exist
                const watchLaterElement = document.getElementById('watchLaterCount');
                const playlistsElement = document.getElementById('playlistsCount');
                const likedElement = document.getElementById('likedCount');
                
                if (watchLaterElement) watchLaterElement.textContent = data.stats.watchLaterCount || '0';
                if (playlistsElement) playlistsElement.textContent = data.stats.playlistsCount || '0';
                if (likedElement) likedElement.textContent = data.stats.likedCount || '0';
                
                console.log('✅ Stats loaded successfully');
                return;
            }
        }
        
        // Fallback to individual endpoints
        console.log('🔄 Using fallback stats loading');
        await loadIndividualCounts();
        
    } catch (error) {
        console.error('❌ Error loading user stats:', error);
        // Set default values safely
        const watchLaterElement = document.getElementById('watchLaterCount');
        const playlistsElement = document.getElementById('playlistsCount');
        const likedElement = document.getElementById('likedCount');
        
        if (watchLaterElement) watchLaterElement.textContent = '0';
        if (playlistsElement) playlistsElement.textContent = '0';
        if (likedElement) likedElement.textContent = '0';
    }
}

async function loadIndividualCounts() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // Load watch later count from user's watchLater array
        const userResponse = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success && userData.user) {
                const watchLaterElement = document.getElementById('watchLaterCount');
                const likedElement = document.getElementById('likedCount');
                if (watchLaterElement) watchLaterElement.textContent = userData.user.watchLater?.length || 0;
                if (likedElement) likedElement.textContent = userData.user.likedVideos?.length || 0;
            }
        }

        // Load playlists count
        const playlistsResponse = await fetch('/api/playlists/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (playlistsResponse.ok) {
            const playlistsData = await playlistsResponse.json();
            const playlistsElement = document.getElementById('playlistsCount');
            if (playlistsElement) playlistsElement.textContent = playlistsData.playlists?.length || 0;
        }
    } catch (error) {
        console.error('Error loading individual counts:', error);
    }
}

// ==================== WATCH LATER ====================

async function loadWatchLaterVideos() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/interactions/user/watch-later', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('📹 Watch Later videos loaded:', data.videos?.length || 0);
            displayWatchLaterVideos(data.videos);
        } else {
            console.log('🔄 Falling back to user profile watch later');
            await loadWatchLaterFromUser();
        }
    } catch (error) {
        console.error('Error loading watch later:', error);
        await loadWatchLaterFromUser();
    }
}

async function loadWatchLaterFromUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/users/profile?populate=watchLater', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user.watchLater) {
                console.log('📹 Watch Later from user profile:', data.user.watchLater.length);
                displayWatchLaterVideos(data.user.watchLater);
            } else {
                console.log('📭 No watch later videos found');
                displayWatchLaterVideos([]);
            }
        }
    } catch (error) {
        console.error('Error loading watch later from user:', error);
        displayWatchLaterVideos([]);
    }
}

function displayWatchLaterVideos(videos) {
    const container = document.getElementById('watchLaterVideos');
    const emptyState = document.getElementById('emptyWatchLater');
    const totalElement = document.getElementById('watchLaterTotal');

    console.log('🎬 Displaying watch later videos:', videos?.length || 0);

    if (!videos || videos.length === 0) {
        if (container) container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        if (totalElement) totalElement.textContent = '0 videos';
        console.log('📭 No videos to display in watch later');
        return;
    }

    if (container) {
        container.innerHTML = videos.map(video => `
            <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video._id || video.shortId}">
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

        container.classList.remove('hidden');
    }
    if (emptyState) emptyState.classList.add('hidden');
    if (totalElement) totalElement.textContent = `${videos.length} video${videos.length !== 1 ? 's' : ''}`;
    
    console.log('✅ Watch later videos displayed successfully');
    
    // Ensure click handlers work for newly loaded videos
    setTimeout(() => {
        setupVideoClickHandlers();
    }, 100);
}

// ==================== LIKED VIDEOS ====================

async function loadLikedVideos() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/interactions/user/likes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('❤️ Liked videos loaded:', data.videos?.length || 0);
            displayLikedVideos(data.videos);
        } else {
            console.log('🔄 Falling back to user profile liked videos');
            await loadLikedFromUser();
        }
    } catch (error) {
        console.error('Error loading liked videos:', error);
        await loadLikedFromUser();
    }
}

async function loadLikedFromUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/users/profile?populate=likedVideos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user.likedVideos) {
                console.log('❤️ Liked videos from user profile:', data.user.likedVideos.length);
                displayLikedVideos(data.user.likedVideos);
            } else {
                console.log('📭 No liked videos found');
                displayLikedVideos([]);
            }
        }
    } catch (error) {
        console.error('Error loading liked videos from user:', error);
        displayLikedVideos([]);
    }
}

function displayLikedVideos(videos) {
    const container = document.getElementById('likedVideos');
    const emptyState = document.getElementById('emptyLiked');
    const totalElement = document.getElementById('likedTotal');

    console.log('🎬 Displaying liked videos:', videos?.length || 0);

    if (!videos || videos.length === 0) {
        if (container) container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        if (totalElement) totalElement.textContent = '0 videos';
        console.log('📭 No videos to display in liked videos');
        return;
    }

    if (container) {
        container.innerHTML = videos.map(video => `
            <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video._id || video.shortId}">
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

        container.classList.remove('hidden');
    }
    if (emptyState) emptyState.classList.add('hidden');
    if (totalElement) totalElement.textContent = `${videos.length} video${videos.length !== 1 ? 's' : ''}`;
    
    console.log('✅ Liked videos displayed successfully');
    
    // Ensure click handlers work for newly loaded videos
    setTimeout(() => {
        setupVideoClickHandlers();
    }, 100);
}

// Add click event handlers for video cards
function setupVideoClickHandlers() {
    console.log('🎯 Setting up video click handlers...');
    
    // Remove any existing event listeners to prevent duplicates
    document.removeEventListener('click', handleVideoCardClick);
    
    // Add new event listener
    document.addEventListener('click', handleVideoCardClick);
}

// Handle video card clicks
function handleVideoCardClick(e) {
    const videoCard = e.target.closest('[data-video-id]');
    if (videoCard) {
        const videoId = videoCard.getAttribute('data-video-id');
        console.log('🎬 Video card clicked:', videoId);
        navigateToVideo(videoId);
    }
}

// Navigate to video page
function navigateToVideo(videoId) {
    console.log('🚀 Navigating to video:', videoId);
    // Use clean URL format: /video?id=VIDEO_ID
    window.location.href = `/video?id=${videoId}`;
}

// ==================== PLAYLISTS ====================
async function loadUserPlaylists() {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('👤 Loading playlists for user:', currentUser.id);
    
    if (!token) {
        console.log('❌ No token for playlists');
        showEmptyPlaylists();
        return;
    }

    try {
        console.log('🔄 Loading user playlists from API...');
        const response = await fetch('/api/playlists/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📡 Playlists API response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Received playlists from API:', data.playlists?.length || 0);
            
            if (data.success && data.playlists && Array.isArray(data.playlists)) {
                // Double-check that all playlists belong to current user
                const userPlaylists = data.playlists.filter(playlist => {
                    const belongsToUser = playlist.user === currentUser.id;
                    if (!belongsToUser) {
                        console.warn('🚨 Foreign playlist found:', playlist.name, 'User:', playlist.user);
                    }
                    return belongsToUser;
                });
                
                console.log(`🎯 Displaying ${userPlaylists.length} user-specific playlists`);
                displayPlaylists(userPlaylists);
                
                // Update localStorage
                localStorage.setItem('localPlaylists', JSON.stringify(userPlaylists));
            } else {
                console.log('📭 No playlists found for user');
                showEmptyPlaylists();
            }
        } else {
            console.error('❌ API failed, status:', response.status);
            showEmptyPlaylists();
        }
    } catch (error) {
        console.error('❌ Network error loading playlists:', error);
        showEmptyPlaylists();
    }
}
function mergePlaylists(apiPlaylists, localPlaylists) {
    const merged = [...apiPlaylists];
    
    localPlaylists.forEach(localPlaylist => {
        const exists = merged.some(apiPlaylist => apiPlaylist._id === localPlaylist._id);
        if (!exists) {
            merged.push(localPlaylist);
        }
    });
    
    return merged;
}

function showPlaylistError(message) {
    const container = document.getElementById('playlistsContainer');
    const emptyState = document.getElementById('emptyPlaylists');
    
    if (emptyState) {
        emptyState.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Playlists</h3>
                <p class="text-gray-500 mb-4">${message}</p>
                <button onclick="loadUserPlaylists()" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200">
                    Try Again
                </button>
            </div>
        `;
        emptyState.classList.remove('hidden');
    }
    
    if (container) container.classList.add('hidden');
}

function showEmptyPlaylists() {
    const container = document.getElementById('playlistsContainer');
    const emptyState = document.getElementById('emptyPlaylists');
    
    if (emptyState) {
        emptyState.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-list text-gray-400 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No Playlists Yet</h3>
                <p class="text-gray-500 mb-4">Create your first playlist to get started.</p>
                <button onclick="createNewPlaylist()" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200">
                    Create Playlist
                </button>
            </div>
        `;
        emptyState.classList.remove('hidden');
    }
    
    if (container) container.classList.add('hidden');
}

function displayPlaylists(playlists) {
    const container = document.getElementById('playlistsContainer');
    const emptyState = document.getElementById('emptyPlaylists');

    if (!container || !emptyState) {
        console.error('❌ Playlist container elements not found');
        return;
    }

    console.log('🎯 Displaying playlists:', playlists);
    console.log('📊 Playlist details:');
    playlists.forEach((playlist, index) => {
        console.log(`  ${index + 1}. "${playlist.name}": ${playlist.videos ? playlist.videos.length : 0} videos`);
        if (playlist.videos) {
            console.log('     Videos:', playlist.videos.map(v => v._id || v));
        }
    });

    if (!playlists || playlists.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        console.log('📭 No playlists to display');
        return;
    }

    container.innerHTML = playlists.map(playlist => {
        const videoCount = playlist.videos ? playlist.videos.length : 0;
        const thumbnailUrl = playlist.videos && playlist.videos.length > 0 ? 
            (playlist.videos[0].thumbnail || 'https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=400&h=300&fit=crop') : 
            null;
        
        return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onclick="viewPlaylist('${playlist._id}')">
            <div class="relative">
                ${thumbnailUrl ? `
                    <img src="${thumbnailUrl}" 
                         alt="${playlist.name}" 
                         class="w-full h-40 object-cover"
                         onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=400&h=300&fit=crop'">
                ` : `
                    <div class="w-full h-40 bg-gray-200 flex items-center justify-center">
                        <i class="fas fa-list text-gray-400 text-3xl"></i>
                    </div>
                `}
                <div class="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    ${videoCount} video${videoCount !== 1 ? 's' : ''}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 mb-1 line-clamp-1">${playlist.name}</h3>
                ${playlist.description ? `<p class="text-gray-600 text-sm mb-2 line-clamp-2">${playlist.description}</p>` : ''}
                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span class="capitalize">${playlist.isPublic ? 'Public' : 'Private'}</span>
                    <span>Updated ${formatTimeAgo(playlist.updatedAt || playlist.createdAt)}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');
    console.log('✅ Playlists displayed successfully');
}

async function createNewPlaylist() {
    const playlistName = prompt('Enter playlist name:');
    if (!playlistName || playlistName.trim() === '') {
        alert('Please enter a valid playlist name');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in to create playlists');
        return;
    }

    try {
        console.log('🔄 Creating playlist:', playlistName);
        
        const response = await fetch('/api/playlists', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: playlistName.trim(),
                description: '',
                isPublic: false
            })
        });

        const data = await response.json();
        console.log('📨 Create playlist response:', data);

        if (response.ok) {
            console.log('✅ Playlist created successfully');
            
            // Temporary: Store in localStorage and show locally
            const newPlaylist = data.playlist;
            const localPlaylists = JSON.parse(localStorage.getItem('localPlaylists') || '[]');
            localPlaylists.push(newPlaylist);
            localStorage.setItem('localPlaylists', JSON.stringify(localPlaylists));
            
            // Display local playlists
            displayPlaylists(localPlaylists);
            
            // Update stats
            await loadUserStats();
            
            // Switch to playlists tab
            switchTab('playlists');
            
            alert('Playlist created successfully!');
            
        } else {
            console.error('❌ Error creating playlist:', data);
            alert(data.message || 'Error creating playlist');
        }
    } catch (error) {
        console.error('❌ Network error creating playlist:', error);
        alert('Network error. Please try again.');
    }
}

function viewPlaylist(playlistId) {
    console.log('🎵 Viewing playlist:', playlistId);
    
    // Get playlists from localStorage
    const localPlaylists = JSON.parse(localStorage.getItem('localPlaylists') || '[]');
    const playlist = localPlaylists.find(p => p._id === playlistId);
    
    if (!playlist) {
        alert('Playlist not found');
        return;
    }
    
    // Create a simple modal to show playlist details
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-gray-900">${playlist.name}</h2>
                    <button onclick="closePlaylistModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-600">${playlist.description || 'No description'}</p>
                    <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>${playlist.videos ? playlist.videos.length : 0} videos</span>
                        <span>•</span>
                        <span>${playlist.isPublic ? 'Public' : 'Private'}</span>
                        <span>•</span>
                        <span>Created ${formatTimeAgo(playlist.createdAt)}</span>
                    </div>
                </div>
                
                <div class="border-t border-gray-200 pt-4">
                    <h3 class="text-lg font-semibold mb-3">Videos (${playlist.videos ? playlist.videos.length : 0})</h3>
                    
                    ${playlist.videos && playlist.videos.length > 0 ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${playlist.videos.map(video => `
                                <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onclick="window.location.href='/video?id=${video._id}'">
                                    <img src="${video.thumbnail}" 
                                         alt="${video.title}" 
                                         class="w-16 h-12 object-cover rounded"
                                         onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=100&h=75&fit=crop'">
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-sm font-medium text-gray-900 truncate">${video.title}</h4>
                                        <p class="text-xs text-gray-500 capitalize">${video.category}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-film text-3xl mb-2"></i>
                            <p>No videos in this playlist yet</p>
                        </div>
                    `}
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                    <button onclick="closePlaylistModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const modalContainer = document.createElement('div');
    modalContainer.id = 'playlistModal';
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

function closePlaylistModal() {
    const modal = document.getElementById('playlistModal');
    if (modal) {
        modal.remove();
    }
}

// ==================== DEBUGGING FUNCTIONS ====================

async function testAPIEndpoints() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token found');
        return;
    }

    const endpoints = [
        '/api/users/profile',
        '/api/users/stats',
        '/api/playlists/user',
        '/api/interactions/user/watch-later',
        '/api/interactions/user/likes'
    ];

    console.log('🔍 Testing API endpoints...');
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`${endpoint}: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.log(`${endpoint}: ❌ Failed - ${error.message}`);
        }
    }
}

async function testPlaylistAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No token for API test');
        return;
    }

    console.log('🔍 Testing playlist API endpoints...');
    
    const endpoints = [
        '/api/playlists/user',
        '/api/playlists'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(`${endpoint}: ${response.status} ${response.statusText}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`${endpoint} response:`, data);
            } else {
                const errorText = await response.text();
                console.log(`${endpoint} error:`, errorText.substring(0, 200));
            }
        } catch (error) {
            console.log(`${endpoint}: ❌ Failed - ${error.message}`);
        }
    }
}

// ==================== UTILITY FUNCTIONS ====================

function updateUserInfo(user) {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (userAvatar) {
        // Add cache busting for R2 avatars
        if (user.avatar && user.avatar.includes('r2.dev')) {
            userAvatar.src = user.avatar + '?t=' + new Date().getTime();
        } else {
            userAvatar.src = user.avatar || 'https://via.placeholder.com/32/9333ea/ffffff?text=U';
        }
        userAvatar.alt = user.username || 'User';
    }
    
    if (profileAvatar) {
        // Add cache busting for R2 avatars
        if (user.avatar && user.avatar.includes('r2.dev')) {
            profileAvatar.src = user.avatar + '?t=' + new Date().getTime();
        } else {
            profileAvatar.src = user.avatar || 'https://via.placeholder.com/150/9333ea/ffffff?text=U';
        }
        profileAvatar.alt = user.username || 'User';
    }
    
    if (userName) {
        userName.textContent = user.username || 'User';
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views) {
    if (!views && views !== 0) return '0';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Recently';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    } catch (error) {
        return 'Recently';
    }
}
// ==================== MOBILE NAVIGATION ====================

function setupMobileNavigation() {
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

        // Close mobile menu when clicking a link
        mobileMenu.addEventListener('click', function(e) {
            if (e.target.closest('a')) {
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                    removeMobileBackdrop();
                }, 100);
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        
        if (mobileMenu && mobileMenuButton && 
            !mobileMenu.contains(event.target) && 
            !mobileMenuButton.contains(event.target) &&
            !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            removeMobileBackdrop();
        }
    });
}

// Mobile backdrop functions
function addMobileBackdrop() {
    let backdrop = document.getElementById('mobileBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'mobileBackdrop';
        backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden';
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
        backdrop.remove();
    }
}
// Add this function to profile.js
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Profile page loaded');
    checkAuthState();
    setupEventListeners();
    loadUserProfile();
    setupVideoClickHandlers(); // Make sure this is called
    loadCategories();
    testAPIEndpoints();
});

function closeAllMenus() {
    const mobileMenu = document.getElementById('mobileMenu');
    const desktopCategoriesMenu = document.getElementById('desktopCategoriesMenu');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    if (mobileMenu) mobileMenu.classList.add('hidden');
    if (desktopCategoriesMenu) desktopCategoriesMenu.classList.add('hidden');
    if (userDropdownMenu) userDropdownMenu.classList.add('hidden');
    
    removeMobileBackdrop();
}

function formatCategoryName(category) {
    if (!category) return 'Uncategorized';
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
function populateProfileForm(user) {
    console.log('📝 Populating profile form with user:', user);
    
    // Safely get DOM elements
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const bioInput = document.getElementById('bio');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    const memberSince = document.getElementById('memberSince');
    
    // Safely set values only if elements exist
    if (usernameInput) usernameInput.value = user.username || '';
    if (emailInput) emailInput.value = user.email || '';
    if (bioInput) bioInput.value = user.bio || 'No bio yet';
    
    // Update display elements
    if (profileUsername) profileUsername.textContent = user.username || 'User';
    if (profileEmail) profileEmail.textContent = user.email || '';
    
    if (profileAvatar) {
        // Handle R2 URLs with cache busting
        if (user.avatar && user.avatar.includes('r2.dev')) {
            profileAvatar.src = user.avatar + '?t=' + new Date().getTime();
        } else {
            profileAvatar.src = user.avatar || 'https://via.placeholder.com/150/9333ea/ffffff?text=U';
        }
        profileAvatar.alt = user.username || 'User';
    }
    
    // Format member since date
    if (memberSince && user.createdAt) {
        const joinDate = new Date(user.createdAt).toLocaleDateString();
        memberSince.textContent = joinDate;
    }
    
    console.log('✅ Profile form populated successfully');
}
// Make navigation functions globally available
window.navigateToVideo = navigateToVideo;
window.setupVideoClickHandlers = setupVideoClickHandlers;
window.viewPlaylist = viewPlaylist;
window.closePlaylistModal = closePlaylistModal;
window.createNewPlaylist = createNewPlaylist;
window.setupMobileNavigation = setupMobileNavigation;
window.closeAllMenus = closeAllMenus;