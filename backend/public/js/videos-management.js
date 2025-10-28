// API Base URL - Auto-detects environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

// DOM Elements
const loadingState = document.getElementById('loadingState');
const videosTable = document.getElementById('videosTable');
const videosTableBody = document.getElementById('videosTableBody');
const emptyState = document.getElementById('emptyState');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// Global variables
let currentPage = 1;
let totalPages = 1;
let videos = [];
let categories = [];
let videoToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    initializeVideosPage();
    setupEventListeners();
});

async function initializeVideosPage() {
    await Promise.all([
        loadCategories(),
        loadVideos()
    ]);
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
    // Search and filters
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    categoryFilter.addEventListener('change', handleFilter);
    statusFilter.addEventListener('change', handleFilter);
    
    // Delete modal
    cancelDelete.addEventListener('click', closeDeleteModal);
    confirmDelete.addEventListener('click', handleDeleteVideo);
    
    // Close modal when clicking outside
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

// Load categories for filter
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            categories = await response.json();
            populateCategoryFilter();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.slug;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

// Load videos
async function loadVideos(page = 1) {
    showLoading();
    
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 10
        });
        
        // Add filters
        const search = searchInput.value.trim();
        const category = categoryFilter.value;
        const status = statusFilter.value;
        
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE_URL}/admin/videos?${params}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to fetch videos');
        
        const data = await response.json();
        videos = data.videos;
        currentPage = data.currentPage;
        totalPages = data.totalPages;
        
        displayVideos();
        displayPagination();
        
    } catch (error) {
        console.error('Error loading videos:', error);
        showError('Failed to load videos');
    }
}

// Display videos in table
function displayVideos() {
    if (videos.length === 0) {
        showEmptyState();
        return;
    }
    
    hideLoading();
    
    videosTableBody.innerHTML = videos.map(video => `
        <tr class="hover:bg-gray-50">
            <!-- Video Info -->
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <img class="h-10 w-16 object-cover rounded-lg" src="${video.thumbnail}" alt="${video.title}">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 line-clamp-1">${video.title}</div>
                        <div class="text-sm text-gray-500">${formatDuration(video.duration)}</div>
                    </div>
                </div>
            </td>
            
            <!-- Category -->
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                    ${video.category}
                </span>
            </td>
            
            <!-- Views -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatViews(video.views)}
            </td>
            
            <!-- Likes -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatLikes(video.likes)}
            </td>
            
            <!-- Date -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(video.createdAt)}
            </td>
            
            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    video.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }">
                    ${video.status === 'published' ? 'Published' : 'Draft'}
                </span>
            </td>
            
            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <a href="video.html?id=${video._id}" target="_blank" class="text-blue-600 hover:text-blue-900 transition duration-200" title="View">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button onclick="editVideo('${video._id}')" class="text-green-600 hover:text-green-900 transition duration-200" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="openDeleteModal('${video._id}')" class="text-red-600 hover:text-red-900 transition duration-200" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Display pagination
function displayPagination() {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = `
        <div class="flex items-center justify-between">
            <div>
                <p class="text-sm text-gray-700">
                    Showing page <span class="font-medium">${currentPage}</span> of <span class="font-medium">${totalPages}</span>
                </p>
            </div>
            <div class="flex space-x-2">
    `;
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="loadVideos(${currentPage - 1})" class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200">
                Previous
            </button>
        `;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `
                <span class="px-3 py-1 border border-purple-300 bg-purple-50 text-purple-600 rounded-md text-sm font-medium">
                    ${i}
                </span>
            `;
        } else {
            paginationHTML += `
                <button onclick="loadVideos(${i})" class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200">
                    ${i}
                </button>
            `;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="loadVideos(${currentPage + 1})" class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200">
                Next
            </button>
        `;
    }
    
    paginationHTML += '</div></div>';
    pagination.innerHTML = paginationHTML;
}

// Search functionality
function handleSearch() {
    currentPage = 1;
    loadVideos();
}

// Filter functionality
function handleFilter() {
    currentPage = 1;
    loadVideos();
}

// Edit video
function editVideo(videoId) {
    // Redirect to edit page or open edit modal
    window.location.href = `edit-video.html?id=${videoId}`;
}

// Delete video modal
function openDeleteModal(videoId) {
    videoToDelete = videoId;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    videoToDelete = null;
    deleteModal.classList.add('hidden');
}

async function handleDeleteVideo() {
    if (!videoToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/videos/${videoToDelete}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showSuccess('Video deleted successfully');
            closeDeleteModal();
            loadVideos(currentPage);
        } else {
            throw new Error('Failed to delete video');
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        showError('Failed to delete video');
    }
}

// State management
function showLoading() {
    loadingState.classList.remove('hidden');
    videosTable.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function hideLoading() {
    loadingState.classList.add('hidden');
    videosTable.classList.remove('hidden');
}

function showEmptyState() {
    loadingState.classList.add('hidden');
    videosTable.classList.add('hidden');
    emptyState.classList.remove('hidden');
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

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

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

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
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