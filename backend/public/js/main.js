// API Base URL - Auto-detects environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

// DOM Elements
const loadingState = document.getElementById('loadingState');
const contentArea = document.getElementById('contentArea');
const emptyState = document.getElementById('emptyState');
const categoriesContainer = document.getElementById('categoriesContainer');
const desktopCategories = document.getElementById('desktopCategories');
const mobileCategories = document.getElementById('mobileCategories');
const trendingVideos = document.getElementById('trendingVideos');
const latestVideos = document.getElementById('latestVideos');
const categorySections = document.getElementById('categorySections');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobileMenu');
const searchInput = document.getElementById('searchInput');
const mobileSearchInput = document.getElementById('mobileSearchInput');
const searchResults = document.getElementById('searchResults');
const searchResultsGrid = document.getElementById('searchResultsGrid');
const clearSearch = document.getElementById('clearSearch');
const loadMoreBtn = document.getElementById('loadMoreBtn');

console.log('✅ JavaScript is loading!');

// Global variables
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
let isLoading = false;
let categories = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing...');
    initializePage();
});

async function initializePage() {
    await loadCategories();
    loadVideos();
    setupEventListeners();
    setupMobileMenu();
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Clear search
    if (clearSearch) {
        clearSearch.addEventListener('click', clearSearchResults);
    }

    // Load more
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreVideos);
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenu && !mobileMenu.contains(event.target) && mobileMenuButton && !mobileMenuButton.contains(event.target)) {
            mobileMenu.classList.add('hidden');
        }
    });
}

// Setup mobile menu
function setupMobileMenu() {
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// Load REAL categories from your admin panel
async function loadCategories() {
    try {
        console.log('📂 Loading REAL categories from admin panel...');
        const response = await fetch(`${API_BASE_URL}/categories`);
        
        if (!response.ok) {
            throw new Error(`Categories API returned ${response.status}`);
        }
        
        const categoriesData = await response.json();
        console.log('✅ REAL Categories loaded from database:', categoriesData);
        
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
            categories = categoriesData;
            displayCategories(categories);
        } else {
            console.warn('⚠️ No categories found in database');
            showNoCategoriesMessage();
        }
    } catch (error) {
        console.error('❌ Error loading REAL categories:', error);
        showCategoriesError();
    }
}

// Display REAL categories from database
function displayCategories(categories) {
    console.log('🎯 Displaying categories:', categories);
    
    // Desktop horizontal categories
    if (categoriesContainer) {
        categoriesContainer.innerHTML = `
            <button onclick="loadVideosByCategory('all')" 
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium whitespace-nowrap hover:bg-purple-700 transition duration-200">
                All Categories
            </button>
            ${categories.map(category => `
                <button onclick="loadVideosByCategory('${category.slug}')" 
                        class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 whitespace-nowrap transition duration-200">
                    ${category.name}
                </button>
            `).join('')}
        `;
        categoriesContainer.classList.remove('hidden');
    }

    // Desktop dropdown categories - FIXED CLICK ISSUE
    if (desktopCategories) {
        desktopCategories.innerHTML = `
            <a href="#" onclick="event.preventDefault(); loadVideosByCategory('all');" 
               class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition duration-200">
                All Categories
            </a>
            ${categories.map(category => `
                <a href="#" onclick="event.preventDefault(); loadVideosByCategory('${category.slug}');" 
                   class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition duration-200 capitalize">
                    ${category.name}
                </a>
            `).join('')}
        `;
    }

    // Mobile categories - FIXED CLICK ISSUE
    if (mobileCategories) {
        mobileCategories.innerHTML = `
            <button onclick="loadVideosByCategory('all'); mobileMenu.classList.add('hidden');" 
                    class="w-full text-left px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200">
                All Categories
            </button>
            ${categories.map(category => `
                <button onclick="loadVideosByCategory('${category.slug}'); mobileMenu.classList.add('hidden');" 
                        class="w-full text-left px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200">
                    ${category.name}
                </button>
            `).join('')}
        `;
    }
}

function showNoCategoriesMessage() {
    if (categoriesContainer) {
        categoriesContainer.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <i class="fas fa-tags mr-2"></i>
                No categories created yet
            </div>
        `;
        categoriesContainer.classList.remove('hidden');
    }
}

function showCategoriesError() {
    if (categoriesContainer) {
        categoriesContainer.innerHTML = `
            <div class="text-center py-4 text-red-500">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error loading categories
            </div>
        `;
        categoriesContainer.classList.remove('hidden');
    }
}

// Load videos from API
async function loadVideos(category = 'all', page = 1, append = false) {
    if (isLoading) return;
    
    isLoading = true;
    
    if (!append) {
        showLoading();
        hideSearchResults();
    }
    
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 12,
            ...(category !== 'all' && { category: category })
        });
        
        const response = await fetch(`/api/videos?${params}`);
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📹 Videos loaded successfully:', data.videos.length, 'videos');
        
        if (data.videos.length === 0 && !append) {
            showEmptyState();
        } else {
            displayVideos(data.videos, append);
        }
        
        currentPage = data.currentPage;
        currentCategory = category;
        
        // Show/hide load more button
        if (loadMoreBtn) {
            loadMoreBtn.classList.toggle('hidden', !data.hasMore);
        }
        
    } catch (error) {
        console.error('❌ Error loading videos:', error);
        showErrorState(error.message);
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// Load videos by specific category
async function loadVideosByCategory(category) {
    console.log(`🎯 Loading videos for category: ${category}`);
    currentCategory = category;
    currentPage = 1;
    
    // Update active state
    updateActiveCategory(category);
    
    await loadVideos(category);
}

// Update active category styling
function updateActiveCategory(activeCategory) {
    // Update horizontal categories
    const categoryButtons = categoriesContainer?.querySelectorAll('button');
    if (categoryButtons) {
        categoryButtons.forEach(button => {
            const isAllCategories = button.textContent.includes('All Categories') && activeCategory === 'all';
            const isCategoryMatch = button.textContent.trim() === activeCategory.replace('-', ' ');
            
            if (isAllCategories || isCategoryMatch) {
                button.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
                button.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
            } else {
                button.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
                button.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
            }
        });
    }
}

// Load more videos
async function loadMoreVideos() {
    if (isLoading) return;
    currentPage++;
    await loadVideos(currentCategory, currentPage, true);
}

// Search functionality
async function handleSearch(e) {
    const query = e.target.value.trim();
    currentSearch = query;
    
    if (query.length === 0) {
        clearSearchResults();
        return;
    }
    
    if (query.length < 2) return;
    
    try {
        const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const data = await response.json();
            showSearchResults(data.videos, query);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function showSearchResults(videos, query) {
    // Hide main content, show search results
    contentArea.classList.add('hidden');
    searchResults.classList.remove('hidden');
    
    searchResultsGrid.innerHTML = videos.map(video => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300 cursor-pointer video-card" data-video-id="${video._id}">
            <div class="relative">
                <img src="${video.thumbnail}" 
                     alt="${video.title}" 
                     class="w-full h-32 object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=300&h=169&fit=crop'">
                <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    ${formatDuration(video.duration)}
                </div>
            </div>
            <div class="p-3">
                <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                <p class="text-gray-600 text-xs mb-2 capitalize">${video.category}</p>
                <div class="flex justify-between text-gray-500 text-xs">
                    <span>${formatViews(video.views)} views</span>
                    <span>${formatTimeAgo(video.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('') || '<p class="text-gray-500 col-span-full text-center py-8">No videos found for "' + query + '"</p>';
}

function clearSearchResults() {
    currentSearch = '';
    if (searchInput) searchInput.value = '';
    if (mobileSearchInput) mobileSearchInput.value = '';
    searchResults.classList.add('hidden');
    contentArea.classList.remove('hidden');
}

function hideSearchResults() {
    searchResults.classList.add('hidden');
}

// Display videos
function displayVideos(videos, append = false) {
    console.log('🎬 Displaying videos...');
    
    // Hide loading, show content
    loadingState.classList.add('hidden');
    contentArea.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    if (!append) {
        // Display latest videos (first 6)
        displayLatestVideos(videos.slice(0, 6));
        
        // Display trending videos (most viewed)
        const trending = [...videos].sort((a, b) => b.views - a.views).slice(0, 3);
        displayTrendingVideos(trending);
        
        // Display by REAL categories from database
        displayCategorySections(videos);
    } else {
        // Append to existing category sections
        displayLatestVideos(videos.slice(0, 6));
    }
}

            // In displayLatestVideos function
function displayLatestVideos(videos) {
    if (!latestVideos) return;
    
    latestVideos.innerHTML = videos.map(video => `
        <div class="video-card" data-video-id="${video._id}">
            <div class="relative">
                <img src="${video.thumbnail}" 
                     alt="${video.title}" 
                     class="w-full h-32 object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=300&h=169&fit=crop'">
                <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    ${formatDuration(video.duration)}
                </div>
            </div>
            <div class="p-3">
                <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                <p class="text-gray-600 text-xs mb-2 capitalize">${video.category}</p>
                <div class="flex justify-between text-gray-500 text-xs">
                    <span>${formatViews(video.views)} views</span>
                    <span>${formatTimeAgo(video.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Display trending videos
function displayTrendingVideos(videos) {
    if (!trendingVideos) return;
    
    trendingVideos.innerHTML = videos.map(video => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300 cursor-pointer video-card" data-video-id="${video._id}">
            <div class="relative">
                <img src="${video.thumbnail}" 
                     alt="${video.title}" 
                     class="w-full h-48 object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=300&h=169&fit=crop'">
                <div class="absolute top-2 left-2">
                    <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Trending</span>
                </div>
                <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    ${formatDuration(video.duration)}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${video.title}</h3>
                <p class="text-gray-600 text-sm mb-3 capitalize">${video.category}</p>
                <div class="flex justify-between text-gray-500 text-sm">
                    <span>${formatViews(video.views)} views</span>
                    <span>${formatTimeAgo(video.createdAt)}</span>
                </div>
                <div class="flex space-x-4 mt-3 pt-3 border-t border-gray-100">
                    <div class="flex items-center text-gray-500">
                        <i class="fas fa-heart mr-1"></i>
                        <span>${formatLikes(video.likes)}</span>
                    </div>
                    <div class="flex items-center text-gray-500">
                        <i class="fas fa-eye mr-1"></i>
                        <span>${formatViews(video.views)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

    // In displayCategorySections function
function displayCategorySections(videos) {
    if (!categorySections) return;
    
    // Group videos by category
    const categories = {};
    videos.forEach(video => {
        if (!categories[video.category]) {
            categories[video.category] = [];
        }
        categories[video.category].push(video);
    });
    
    // Create category sections
    categorySections.innerHTML = Object.keys(categories).map(category => `
        <section class="category-section mb-12">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 capitalize">${category}</h2>
                <button onclick="loadVideosByCategory('${category}')" 
                        class="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    View all
                </button>
            </div>
            <div class="video-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                ${categories[category].slice(0, 6).map(video => `
                    <div class="video-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300 cursor-pointer" data-video-id="${video._id}">
                        <div class="relative">
                            <img src="${video.thumbnail}" 
                                 alt="${video.title}" 
                                 class="w-full h-32 object-cover"
                                 onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=300&h=169&fit=crop'">
                            <div class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                                ${formatDuration(video.duration)}
                            </div>
                        </div>
                        <div class="p-3">
                            <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                            <div class="flex justify-between text-gray-500 text-xs">
                                <span>${formatViews(video.views)} views</span>
                                <span>${formatTimeAgo(video.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `).join('');
}

// Navigate to video page
function navigateToVideo(videoId) {
    window.location.href = `video.html?id=${videoId}`;
}

// Utility functions
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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

function showLoading() {
    loadingState.classList.remove('hidden');
    contentArea.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
}

function showEmptyState() {
    loadingState.classList.add('hidden');
    contentArea.classList.add('hidden');
    emptyState.classList.remove('hidden');
}

function showErrorState(message) {
    loadingState.classList.add('hidden');
    emptyState.innerHTML = `
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error loading content</h3>
        <p class="text-gray-500 mb-4">${message}</p>
        <button onclick="location.reload()" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200">
            Try Again
        </button>
    `;
    emptyState.classList.remove('hidden');
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add event delegation for video clicks
document.addEventListener('click', function(e) {
    const videoCard = e.target.closest('[data-video-id]');
    if (videoCard) {
        const videoId = videoCard.getAttribute('data-video-id');
        navigateToVideo(videoId);
    }
});

// Make functions globally available
window.navigateToVideo = navigateToVideo;
window.loadVideosByCategory = loadVideosByCategory;
window.clearSearchResults = clearSearchResults;