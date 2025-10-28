// API Base URL
// API Base URL - Auto-detects environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

// DOM Elements
const statsGrid = document.getElementById('statsGrid');
const recentActivity = document.getElementById('recentActivity');
const popularVideos = document.getElementById('popularVideos');
const userMenuButton = document.getElementById('userMenuButton');
const userDropdown = document.getElementById('userDropdown');

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin dashboard loading...');
    
    if (!(await checkAuth())) {
        console.log('Admin: Auth failed, stopping execution');
        return;
    }
    
    console.log('Admin: Auth successful, initializing dashboard');
    initializeDashboard();
    setupEventListeners();
});

function setupEventListeners() {
    // User dropdown menu
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });
    }

    // Add logout functionality to all logout links
    const logoutLinks = document.querySelectorAll('a[href="login.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof logout === 'function') {
                logout();
            } else {
                // Fallback if logout function is not available
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminData');
                window.location.href = 'login.html';
            }
        });
    });
}

async function initializeDashboard() {
    try {
        console.log('Loading dashboard data...');
        await Promise.all([
            loadDashboardStats(),
            loadRecentActivity(),
            loadPopularVideos()
        ]);
        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch stats: ${response.status}`);
        }
        
        const stats = await response.json();
        displayStats(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
        displayFallbackStats();
    }
}

// Display statistics
function displayStats(stats) {
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <!-- Total Videos -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Videos</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${stats.totalVideos || 0}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-play-circle text-blue-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.videosGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.videosGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.videosGrowth || 0)}% from last month</span>
            </div>
        </div>

        <!-- Total Views -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Views</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${formatViews(stats.totalViews || 0)}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-eye text-green-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.viewsGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.viewsGrowth || 0)}% from last week</span>
            </div>
        </div>

        <!-- Total Likes -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Likes</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${formatLikes(stats.totalLikes || 0)}</p>
                </div>
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-heart text-red-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.likesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.likesGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.likesGrowth || 0)}% from last week</span>
            </div>
        </div>

        <!-- Recent Uploads -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Uploads This Month</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${stats.monthlyUploads || 0}</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-upload text-purple-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.uploadsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.uploadsGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.uploadsGrowth || 0)} more than last month</span>
            </div>
        </div>
    `;
}

// Display fallback stats if API fails
function displayFallbackStats() {
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fas fa-exclamation-triangle text-2xl text-yellow-500 mb-2"></i>
            <p class="text-gray-500">Unable to load statistics</p>
            <p class="text-gray-400 text-sm mt-2">Please check if the server is running</p>
        </div>
    `;
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/activity`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch activity: ${response.status}`);
        }
        
        const activity = await response.json();
        displayRecentActivity(activity);
    } catch (error) {
        console.error('Error loading activity:', error);
        displayFallbackActivity();
    }
}

// Display recent activity
function displayRecentActivity(activities) {
    if (!recentActivity) return;
    
    if (!activities || activities.length === 0) {
        recentActivity.innerHTML = `
            <div class="text-center py-4">
                <p class="text-gray-500 text-sm">No recent activity</p>
            </div>
        `;
        return;
    }

    recentActivity.innerHTML = activities.map(activity => `
        <div class="flex items-start space-x-3">
            <div class="w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0">
                <i class="${getActivityIcon(activity.type)} text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                <p class="text-xs text-gray-500">${activity.description}</p>
                <p class="text-xs text-gray-400 mt-1">${formatTimeAgo(activity.timestamp)}</p>
            </div>
        </div>
    `).join('');
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        'upload': 'fas fa-upload',
        'view': 'fas fa-eye',
        'like': 'fas fa-heart',
        'delete': 'fas fa-trash',
        'update': 'fas fa-edit'
    };
    return icons[type] || 'fas fa-info-circle';
}

// Get activity color
function getActivityColor(type) {
    const colors = {
        'upload': 'bg-green-100 text-green-600',
        'view': 'bg-blue-100 text-blue-600',
        'like': 'bg-red-100 text-red-600',
        'delete': 'bg-gray-100 text-gray-600',
        'update': 'bg-yellow-100 text-yellow-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
}

// Display fallback activity
function displayFallbackActivity() {
    if (!recentActivity) return;
    
    recentActivity.innerHTML = `
        <div class="text-center py-4">
            <p class="text-gray-500 text-sm">Unable to load recent activity</p>
        </div>
    `;
}

// Load popular videos
async function loadPopularVideos() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/popular`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch popular videos: ${response.status}`);
        }
        
        const videos = await response.json();
        displayPopularVideos(videos);
    } catch (error) {
        console.error('Error loading popular videos:', error);
        displayFallbackPopularVideos();
    }
}

// Display popular videos
function displayPopularVideos(videos) {
    if (!popularVideos) return;
    
    if (!videos || videos.length === 0) {
        popularVideos.innerHTML = `
            <div class="text-center py-4">
                <p class="text-gray-500 text-sm">No popular videos</p>
            </div>
        `;
        return;
    }

    popularVideos.innerHTML = videos.map(video => `
        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <img src="${video.thumbnail}" 
                 alt="${video.title}" 
                 class="w-12 h-9 object-cover rounded-lg flex-shrink-0">
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">${video.title}</p>
                <div class="flex items-center text-xs text-gray-500 space-x-2">
                    <span>${formatViews(video.views)} views</span>
                    <span>•</span>
                    <span>${formatLikes(video.likes)} likes</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Display fallback popular videos
function displayFallbackPopularVideos() {
    if (!popularVideos) return;
    
    popularVideos.innerHTML = `
        <div class="text-center py-4">
            <p class="text-gray-500 text-sm">Unable to load popular videos</p>
        </div>
    `;
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

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Auth functions (these should be imported from auth.js)
async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }
    
    // Verify token with server
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.log('Server token verification failed');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = 'login.html';
            return false;
        }
        console.log('Server token verification successful');
        return true;
    } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = 'login.html';
        return false;
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Fallback logout function
function logout() {
    console.log('Logging out from admin.js');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = 'login.html';
}

// Expose functions globally
window.logout = logout;
window.checkAuth = checkAuth;
window.getAuthHeaders = getAuthHeaders;