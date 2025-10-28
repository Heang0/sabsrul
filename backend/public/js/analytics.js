// API Base URL - Auto-detects environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

// DOM Elements
const analyticsStats = document.getElementById('analyticsStats');
const dateRange = document.getElementById('dateRange');
const topVideos = document.getElementById('topVideos');

// Chart instances
let viewsChart = null;
let engagementChart = null;
let categoryChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    initializeAnalyticsPage();
    setupEventListeners();
});

async function initializeAnalyticsPage() {
    await loadAnalyticsData();
    setupUserMenu();
}

function setupUserMenu() {
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', function() {
            userDropdown.classList.add('hidden');
        });
    }
}

function setupEventListeners() {
    // Date range change
    dateRange.addEventListener('change', function() {
        loadAnalyticsData();
    });
}

// Load analytics data
async function loadAnalyticsData() {
    const days = parseInt(dateRange.value);
    
    try {
        const [statsData, chartsData, topVideosData] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/analytics/stats?days=${days}`, {
                headers: getAuthHeaders()
            }).then(res => res.json()),
            
            fetch(`${API_BASE_URL}/admin/analytics/charts?days=${days}`, {
                headers: getAuthHeaders()
            }).then(res => res.json()),
            
            fetch(`${API_BASE_URL}/admin/analytics/top-videos?days=${days}&limit=5`, {
                headers: getAuthHeaders()
            }).then(res => res.json())
        ]);
        
        displayStats(statsData);
        displayCharts(chartsData);
        displayTopVideos(topVideosData);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError('Failed to load analytics data');
        displayFallbackData();
    }
}

// Display statistics
function displayStats(stats) {
    analyticsStats.innerHTML = `
        <!-- Total Views -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Views</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${formatNumber(stats.totalViews || 0)}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-eye text-blue-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.viewsGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.viewsGrowth || 0)}% from previous period</span>
            </div>
        </div>

        <!-- Watch Time -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Watch Time</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${formatWatchTime(stats.totalWatchTime || 0)}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-clock text-green-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.watchTimeGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.watchTimeGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.watchTimeGrowth || 0)}% from previous period</span>
            </div>
        </div>

        <!-- Average View Duration -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Avg. View Duration</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${formatDuration(stats.avgViewDuration || 0)}</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-hourglass-half text-purple-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.avgDurationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.avgDurationGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.avgDurationGrowth || 0)}% from previous period</span>
            </div>
        </div>

        <!-- Engagement Rate -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Engagement Rate</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${formatPercentage(stats.engagementRate || 0)}</p>
                </div>
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <i class="fas fa-heart text-red-600 text-xl"></i>
                </div>
            </div>
            <div class="mt-4 flex items-center text-sm ${stats.engagementGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
                <i class="fas fa-arrow-${stats.engagementGrowth >= 0 ? 'up' : 'down'} mr-1"></i>
                <span>${Math.abs(stats.engagementGrowth || 0)}% from previous period</span>
            </div>
        </div>
    `;
}

// Display charts
function displayCharts(chartsData) {
    createViewsChart(chartsData.viewsOverTime || []);
    createEngagementChart(chartsData.engagementMetrics || {});
    createCategoryChart(chartsData.categoryPerformance || []);
}

// Create views chart
function createViewsChart(viewsData) {
    const ctx = document.getElementById('viewsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (viewsChart) {
        viewsChart.destroy();
    }
    
    const labels = viewsData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = viewsData.map(item => item.views);
    
    viewsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Views',
                data: data,
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create engagement chart
function createEngagementChart(engagementData) {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (engagementChart) {
        engagementChart.destroy();
    }
    
    engagementChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Likes', 'Comments', 'Shares', 'Watch Time'],
            datasets: [{
                label: 'Engagement',
                data: [
                    engagementData.likes || 0,
                    engagementData.comments || 0,
                    engagementData.shares || 0,
                    engagementData.watchTime || 0
                ],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ],
                borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(139, 92, 246)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create category chart
function createCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const labels = categoryData.map(item => item.category);
    const data = categoryData.map(item => item.views);
    
    // Generate colors for each category
    const backgroundColors = generateColors(categoryData.length);
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// Display top videos
function displayTopVideos(topVideosData) {
    if (!topVideosData || topVideosData.length === 0) {
        topVideos.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-video text-2xl text-gray-300 mb-2"></i>
                <p class="text-gray-500">No video data available</p>
            </div>
        `;
        return;
    }
    
    topVideos.innerHTML = topVideosData.map((video, index) => `
        <div class="flex items-center space-x-4 p-4 border-b border-gray-200 last:border-b-0">
            <div class="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                ${index + 1}
            </div>
            <img src="${video.thumbnail}" alt="${video.title}" class="w-16 h-12 object-cover rounded-lg">
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-medium text-gray-900 line-clamp-1">${video.title}</h4>
                <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>${formatNumber(video.views)} views</span>
                    <span>${formatPercentage(video.engagementRate)} engagement</span>
                    <span>${formatDuration(video.avgViewDuration)} avg. watch</span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-semibold text-gray-900">${formatNumber(video.views)}</div>
                <div class="text-xs text-gray-500">views</div>
            </div>
        </div>
    `).join('');
}

// Generate colors for charts
function generateColors(count) {
    const colors = [
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Yellow
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(14, 165, 233, 0.8)',   // Light Blue
        'rgba(20, 184, 166, 0.8)'    // Teal
    ];
    
    return colors.slice(0, count);
}

// Display fallback data when API fails
function displayFallbackData() {
    analyticsStats.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fas fa-chart-line text-2xl text-gray-300 mb-2"></i>
            <p class="text-gray-500">Analytics data not available</p>
        </div>
    `;
    
    topVideos.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-video text-2xl text-gray-300 mb-2"></i>
            <p class="text-gray-500">No video data available</p>
        </div>
    `;
    
    // Create empty charts
    createEmptyCharts();
}

function createEmptyCharts() {
    const emptyData = {
        viewsOverTime: Array(7).fill().map((_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            views: 0
        })),
        engagementMetrics: {
            likes: 0,
            comments: 0,
            shares: 0,
            watchTime: 0
        },
        categoryPerformance: []
    };
    
    displayCharts(emptyData);
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatWatchTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
}

function formatPercentage(value) {
    return (value * 100).toFixed(1) + '%';
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
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Import auth functions
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = 'login.html';
}