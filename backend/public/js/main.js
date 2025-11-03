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

// CATEGORY PAGINATION VARIABLES - PROPERLY INITIALIZED
let categoryPages = {}; // Store current page for each category
let categoryHasMore = {}; // Store if each category has more pages


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

// Replace the existing setupEventListeners function with this:
function setupEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Setup search clear button - ADD THIS LINE
    setupSearchClearButton();

    // Clear search
   if (clearSearch) {
        clearSearch.addEventListener('click', clearSearchResults);
    }

    // Load more
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreVideos);
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
}

// Replace the existing setupMobileMenu function with this:
function setupMobileMenu() {
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
            if (e.target.closest('a') || e.target.closest('button')) {
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                    removeMobileBackdrop();
                }, 100);
            }
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

                // Mobile categories - WITH ICONS (exactly like video.html)
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
            limit: 12, // CHANGED FROM 16 TO 12
            ...(category !== 'all' && { category: category })
        });
        
        const response = await fetch(`/api/videos?${params}`);
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔍 FULL API RESPONSE:', data);
        
        // CHANGED FROM 16 TO 12
        const hasMoreVideos = data.videos.length >= 12 || data.hasMore;
        
        console.log('📹 Videos loaded:', data.videos.length, 'videos, Has more:', hasMoreVideos);
        
        if (data.videos.length === 0 && !append) {
            showEmptyState();
        } else {
            displayVideos(data.videos, append, category, hasMoreVideos, page);
        }
        
        currentPage = page;
        currentCategory = category;
        
        // Show/hide load more button based on actual data
        if (loadMoreBtn) {
            if (hasMoreVideos) {
                loadMoreBtn.classList.remove('hidden');
                loadMoreBtn.querySelector('button').textContent = `Load More Videos`;
            } else {
                loadMoreBtn.classList.add('hidden');
            }
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
    await loadVideos(currentCategory, currentPage, true); // append = true
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
        // Use the correct search endpoint
        const response = await fetch(`/api/videos/search/videos?q=${encodeURIComponent(query)}`);
        console.log('🔍 Search API response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('🔍 Search results:', data.videos);
            showSearchResults(data.videos, query);
        } else {
            console.error('Search API error:', response.status);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function showSearchResults(videos, query) {
    console.log('🎯 Showing search results:', videos.length, 'videos for query:', query);
    
    // Show the clear button in search bar
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn && query.length > 0) {
        clearSearchBtn.classList.remove('hidden');
    }
    
    // PROPERLY HIDE MAIN CONTENT AND SHOW SEARCH RESULTS
    contentArea.classList.add('hidden');
    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    searchResults.classList.remove('hidden');
    
    // Remove "Tag: " prefix if present for display
    const displayQuery = query.replace(/^Tag: /, '');
    
    if (videos.length === 0) {
        searchResultsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-search text-gray-400 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No Videos Found</h3>
                <p class="text-gray-500 mb-4">No videos found for "${displayQuery}"</p>
                <button onclick="clearSearchResults()" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200">
                    Show All Videos
                </button>
            </div>
        `;
        return;
    }
    
    // Update search results header to show correct count
    const resultsHeader = document.querySelector('#searchResults h2');
    if (resultsHeader) {
        resultsHeader.innerHTML = `Search Results <span class="text-purple-600">• ${videos.length} videos found for "${displayQuery}"</span>`;
    }
    
    searchResultsGrid.innerHTML = videos.map(video => `
        <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video.shortId || video._id}">
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
                <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                <p class="text-gray-600 text-xs mb-1 capitalize">${video.category}</p>
                <div class="flex justify-between text-gray-500 text-xs">
                    <span>${formatViews(video.views)} views</span>
                    <span>${formatTimeAgo(video.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Search results displayed');
}

function clearSearchResults() {
    currentSearch = '';
    currentPage = 1;
    currentCategory = 'all';
    
    if (searchInput) {
        searchInput.value = '';
        // Hide the clear button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.classList.add('hidden');
        }
    }
    if (mobileSearchInput) mobileSearchInput.value = '';
    
    // Hide search results
    searchResults.classList.add('hidden');
    
    // RELOAD THE MAIN CONTENT instead of just showing it
    showLoading();
    contentArea.classList.add('hidden');
    
    console.log('✅ Search cleared, reloading main content');
    
    // Load fresh main content
    loadVideos('all', 1, false); // append = false to reload completely
}

function hideSearchResults() {
    searchResults.classList.add('hidden');
}

// Display videos
function displayVideos(videos, append = false, category = 'all', hasMore = false, page = 1) {
    console.log('🎬 Displaying videos:', videos.length, 'Append:', append, 'Page:', page, 'Has more:', hasMore);
    
    // Hide loading, show content
    loadingState.classList.add('hidden');
    contentArea.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    if (!append) {
        // First load - show latest videos and categories
        displayLatestVideos(videos, category);
        displayCategorySections(videos, category);
    } else {
        // Append mode - add to existing videos
        appendVideosToCategories(videos, category);
    }
    
    // ALWAYS show load more button for testing
    if (loadMoreBtn) {
        loadMoreBtn.classList.remove('hidden');
        loadMoreBtn.querySelector('button').textContent = `Load More (Page ${page + 1})`;
    }
}

// Display pagination for main page (all categories)
function displayMainPagination(hasMore, currentPage) {
    const paginationContainer = document.getElementById('mainPaginationContainer');
    
    if (!paginationContainer) return;
    
    // Only show pagination if there are multiple pages
    if (currentPage > 1 || hasMore) {
        paginationContainer.innerHTML = `
        <div class="flex justify-center mt-12 mb-8">
            <div class="flex items-center space-x-4">
                <!-- Previous Button -->
                ${currentPage > 1 ? `
                    <button onclick="loadVideos('all', ${currentPage - 1})" 
                            class="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium">
                        ← Previous
                    </button>
                ` : ''}
                
                <!-- Current Page -->
                <span class="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium">
                    Page ${currentPage}
                </span>
                
                <!-- Next Button -->
                ${hasMore ? `
                    <button onclick="loadVideos('all', ${currentPage + 1})" 
                            class="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium">
                        Next →
                    </button>
                ` : ''}
            </div>
        </div>
        `;
    } else {
        paginationContainer.innerHTML = '';
    }
}

function displayLatestVideos(videos, currentCategory = 'all') {
    if (!latestVideos) return;
    
    // Don't show Latest Videos section when filtering by category
    if (currentCategory !== 'all') {
        latestVideos.innerHTML = '';
        latestVideos.closest('section').classList.add('hidden');
        return;
    }
    
    // Show Latest Videos section for "All Categories"
    latestVideos.closest('section').classList.remove('hidden');
    
    // Show LAST 6 videos (most recent) - CHANGED FROM 5 TO 6
    const sortedVideos = [...videos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestSixVideos = sortedVideos.slice(0, 6); // CHANGED TO 6
    
    console.log('📹 Displaying LATEST 6 videos:', latestSixVideos.length);
    
    latestVideos.innerHTML = latestSixVideos.map(video => `
        <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video.shortId || video._id}">
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
                <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                <p class="text-gray-600 text-xs mb-1 capitalize">${video.category}</p>
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
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300 cursor-pointer video-card" data-video-id="${video.shortId || video._id}">
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

// Get total video counts for each category from backend
async function getTotalCategoryCounts() {
    try {
        console.log('🔍 Getting total category counts...');
        
        // Load ALL videos to count by category
        const response = await fetch(`${API_BASE_URL}/videos?limit=1000`);
        if (response.ok) {
            const data = await response.json();
            const allVideos = data.videos || [];
            
            // Count videos by category
            const categoryCounts = {};
            allVideos.forEach(video => {
                if (video.category) {
                    categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
                }
            });
            
            console.log('📊 Total category counts calculated:', categoryCounts);
            return categoryCounts;
        }
        
        throw new Error('Could not load videos for counting');
        
    } catch (error) {
        console.error('❌ Error getting total category counts:', error);
        
        // Final fallback: return empty object (will use displayed count)
        return {};
    }
}

async function displayCategorySections(videos, currentFilterCategory = 'all') {
    if (!categorySections) return;
    
    console.log('📊 Displaying category sections with videos:', videos.length, 'Filter:', currentFilterCategory);
    
    // If filtering by a specific category, only show that category
    if (currentFilterCategory !== 'all') {
        console.log('🎯 Filtering to show only category:', currentFilterCategory);
        
        // Get total counts FIRST - before creating HTML
        const totalCounts = await getTotalCategoryCounts();
        const totalCount = totalCounts[currentFilterCategory] || videos.length;
        
        categorySections.innerHTML = `
        <section class="category-section mb-12" data-category="${currentFilterCategory}">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 capitalize">${currentFilterCategory}</h2>
                <span class="text-sm text-gray-500">${totalCount} videos</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                ${videos.map(video => `
                    <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video.shortId || video._id}">
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
                            <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                            <p class="text-gray-600 text-xs mb-1 capitalize">${video.category}</p>
                            <div class="flex justify-between text-gray-500 text-xs">
                                <span>${formatViews(video.views)} views</span>
                                <span>${formatTimeAgo(video.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        `;
        return;
    }
    
    // Original code for showing ALL categories
    console.log('📊 Displaying ALL categories');
    
    // Group videos by category
    const categories = {};
    videos.forEach(video => {
        if (!categories[video.category]) {
            categories[video.category] = [];
        }
        categories[video.category].push(video);
    });
    
    console.log('📂 Categories found:', Object.keys(categories));
    
    // Get total counts FIRST - before creating HTML
    const totalCounts = await getTotalCategoryCounts();
    
    // Create category sections with TOTAL counts
    categorySections.innerHTML = Object.keys(categories).map(category => {
        const categoryVideos = categories[category];
        const totalCount = totalCounts[category] || categoryVideos.length;
        
        console.log(`🎯 Rendering category "${category}" with ${categoryVideos.length} videos (Total: ${totalCount})`);
        
        return `
        <section class="category-section mb-12" data-category="${category}">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 capitalize">${category}</h2>
                <span class="text-sm text-gray-500">${totalCount} videos</span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                ${categoryVideos.map(video => `
                    <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video.shortId || video._id}">
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
                            <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                            <p class="text-gray-600 text-xs mb-1 capitalize">${video.category}</p>
                            <div class="flex justify-between text-gray-500 text-xs">
                                <span>${formatViews(video.views)} views</span>
                                <span>${formatTimeAgo(video.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        `;
    }).join('');
}

// Load total video counts for each category
async function loadCategoryTotalCounts() {
    try {
        // Try to get total counts from a new API endpoint
        const response = await fetch(`${API_BASE_URL}/categories/total-counts`);
        
        if (response.ok) {
            const categoryCounts = await response.json();
            console.log('📊 Total category counts:', categoryCounts);
            
            // Update each category count display
            Object.keys(categoryCounts).forEach(category => {
                const countElement = document.querySelector(`.category-count[data-category="${category}"]`);
                if (countElement) {
                    countElement.textContent = `${categoryCounts[category]} videos`;
                }
            });
        } else {
            // If the new endpoint doesn't exist, use fallback method
            useFallbackCategoryCounts();
        }
    } catch (error) {
        console.error('❌ Error loading category counts:', error);
        // Use fallback if API fails
        useFallbackCategoryCounts();
    }
}

// Fallback method to get category counts
async function useFallbackCategoryCounts() {
    try {
        // Load ALL videos to count by category
        const response = await fetch(`${API_BASE_URL}/videos?limit=1000`);
        if (response.ok) {
            const data = await response.json();
            const allVideos = data.videos;
            
            // Count videos by category
            const categoryCounts = {};
            allVideos.forEach(video => {
                if (video.category) {
                    categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
                }
            });
            
            console.log('📊 Fallback category counts:', categoryCounts);
            
            // Update each category count display
            Object.keys(categoryCounts).forEach(category => {
                const countElement = document.querySelector(`.category-count[data-category="${category}"]`);
                if (countElement) {
                    countElement.textContent = `${categoryCounts[category]} videos`;
                }
            });
        }
    } catch (error) {
        console.error('❌ Error in fallback category counts:', error);
        // Final fallback: show current displayed count
        showCurrentDisplayedCounts();
    }
}

// Show only the currently displayed counts
function showCurrentDisplayedCounts() {
    const categorySections = document.querySelectorAll('.category-section');
    categorySections.forEach(section => {
        const category = section.getAttribute('data-category');
        const videosInSection = section.querySelectorAll('.video-card');
        const countElement = section.querySelector('.category-count');
        
        if (countElement) {
            countElement.textContent = `${videosInSection.length} videos`;
        }
    });
}

// Append videos to existing categories - FIXED VERSION
function appendVideosToCategories(newVideos, category) {
    console.log('📥 Appending', newVideos.length, 'new videos to categories');
    
    // Group new videos by category
    const newCategories = {};
    newVideos.forEach(video => {
        if (!newCategories[video.category]) {
            newCategories[video.category] = [];
        }
        newCategories[video.category].push(video);
    });
    
    // Append to each existing category section
    Object.keys(newCategories).forEach(categoryName => {
        // Find the category section by looking for the category name in headings
        const allHeadings = document.querySelectorAll('#categorySections h2');
        let targetSection = null;
        
        allHeadings.forEach(heading => {
            if (heading.textContent.toLowerCase().includes(categoryName.toLowerCase())) {
                targetSection = heading.closest('.category-section');
            }
        });
        
        if (targetSection) {
            const videoGrid = targetSection.querySelector('.grid');
            const newVideosHTML = newCategories[categoryName].map(video => `
                <div class="rounded-xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer video-card" data-video-id="${video.shortId || video._id}">
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
                        <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">${video.title}</h3>
                        <p class="text-gray-600 text-xs mb-1 capitalize">${video.category}</p>
                        <div class="flex justify-between text-gray-500 text-xs">
                            <span>${formatViews(video.views)} views</span>
                            <span>${formatTimeAgo(video.createdAt)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            videoGrid.insertAdjacentHTML('beforeend', newVideosHTML);
            
            // DON'T update the video count - keep showing the TOTAL count
            // The total count is already shown from displayCategorySections
            console.log(`✅ Added ${newCategories[categoryName].length} videos to ${categoryName}`);
        } else {
            console.log('⚠️ Category section not found for:', categoryName);
        }
    });
    
    // Hide load more button if no more videos
    if (loadMoreBtn && newVideos.length < 12) {
        loadMoreBtn.classList.add('hidden');
    }
}

// Generate page numbers for pagination
function generatePageNumbers(currentPage, totalPages, category) {
    const pages = [];
    const maxVisiblePages = 5; // Show max 5 page numbers
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        pages.push(`
            <button onclick="loadVideosByCategory('${category}', 1)" 
                    class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium">
                1
            </button>
        `);
        if (startPage > 2) {
            pages.push(`<span class="px-2 py-2 text-gray-500">...</span>`);
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            pages.push(`
                <span class="px-3 py-2 bg-purple-600 text-white rounded-lg font-medium">
                    ${i}
                </span>
            `);
        } else {
            pages.push(`
                <button onclick="loadVideosByCategory('${category}', ${i})" 
                        class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium">
                    ${i}
                </button>
            `);
        }
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push(`<span class="px-2 py-2 text-gray-500">...</span>`);
        }
        pages.push(`
            <button onclick="loadVideosByCategory('${category}', ${totalPages})" 
                    class="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium">
                ${totalPages}
            </button>
        `);
    }
    
    return pages;
}



// Navigate to video page - KEEP ORIGINAL FORMAT
function navigateToVideo(videoId) {
    // Use original format: video.html?id=VIDEO_ID
    window.location.href = `/video.html?id=${videoId}`;
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
    return views.toString(); // Just return the number, no "views"
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

// Load videos by tag
async function loadVideosByTag(tag) {
    console.log(`🏷️ Loading videos for tag: ${tag}`);
    currentSearch = tag;
    currentPage = 1;
    
    // Update search input
    if (searchInput) searchInput.value = tag;
    if (mobileSearchInput) mobileSearchInput.value = tag;
    
    await handleTagSearch(tag);
}

// Load videos by tag
async function loadVideosByTag(tag) {
    console.log(`🏷️ Loading videos for tag: ${tag}`);
    currentSearch = tag;
    currentPage = 1;
    
    // Update search input to show the tag
    if (searchInput) searchInput.value = tag;
    if (mobileSearchInput) mobileSearchInput.value = tag;
    
    await handleTagSearch(tag);
}

// Handle tag search - FILTER BY SPECIFIC TAG
async function handleTagSearch(tag) {
    try {
        showLoading();
        hideSearchResults(); // Hide search results first
        
        const response = await fetch(`/api/videos/search/videos?q=${encodeURIComponent(tag)}&limit=50`);
        console.log('🔍 Searching for tag:', tag);
        
        if (response.ok) {
            const data = await response.json();
            console.log('🏷️ Tag search results:', data.videos);
            
            if (data.videos && data.videos.length > 0) {
                // Show search results with the tag filter
                showSearchResults(data.videos, `Tag: ${tag}`);
            } else {
                // No videos found for this tag
                showEmptyState();
                showNoResultsMessage(`No videos found for tag: ${tag}`);
            }
        } else {
            throw new Error(`Search API returned ${response.status}`);
        }
    } catch (error) {
        console.error('Tag search error:', error);
        showErrorState('Error searching by tag: ' + error.message);
    }
}

// Show no results message
function showNoResultsMessage(message) {
    if (searchResultsGrid) {
        searchResultsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-tag text-gray-400 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">No Videos Found</h3>
                <p class="text-gray-500 mb-4">${message}</p>
                <button onclick="clearSearchResults()" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200">
                    Show All Videos
                </button>
            </div>
        `;
    }
}

// Update the checkUrlParams function to handle tags properly:
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const tag = urlParams.get('tag');
    const search = urlParams.get('search');
    
    console.log('🔍 URL Parameters:', { category, tag, search });
    
    if (category) {
        console.log('🎯 Loading by category:', category);
        loadVideosByCategory(category);
    } else if (tag) {
        console.log('🏷️ Loading by tag:', tag);
        loadVideosByTag(tag);
    } else if (search) {
        console.log('🔍 Loading by search:', search);
        loadVideosByTag(search); // Use same function for search terms
    } else {
        console.log('📹 Loading all videos');
        loadVideos();
    }
}

// Add these missing functions - Categories dropdown functionality
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

// Setup search clear button
function setupSearchClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput && clearSearchBtn) {
        // Show/hide clear button based on input
        searchInput.addEventListener('input', function() {
            if (this.value.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
                clearSearchResults();
            }
        });
        
        // Clear search when X is clicked
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            clearSearchResults();
        });
        
        // Hide clear button on page load
        clearSearchBtn.classList.add('hidden');
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
    const desktopCategoriesMenu = document.getElementById('desktopCategoriesMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (desktopCategoriesMenu) desktopCategoriesMenu.classList.add('hidden');
    if (mobileMenu) mobileMenu.classList.add('hidden');
    
    removeMobileBackdrop();
}

// Update your initializePage function:
async function initializePage() {
    await loadCategories();
    setupEventListeners();
    setupMobileMenu();
    checkUrlParams(); // Check for category/tag filters
    if (!window.location.search) {
        loadVideos(); // Only load all videos if no filters
    }
}



// Make functions globally available
window.navigateToVideo = navigateToVideo;
window.loadVideosByCategory = loadVideosByCategory;
window.clearSearchResults = clearSearchResults;