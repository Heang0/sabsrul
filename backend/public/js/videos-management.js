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
    console.log('🚀 Videos management page loaded');
    initializeVideosPage();
});

async function initializeVideosPage() {
    if (!checkAuth()) return;
    
    await Promise.all([
        loadCategories(),
        loadVideos()
    ]);
    setupEventListeners();
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
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilter);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilter);
    }
    
    // Delete modal
    if (cancelDelete) {
        cancelDelete.addEventListener('click', closeDeleteModal);
    }
    
    if (confirmDelete) {
        confirmDelete.addEventListener('click', handleDeleteVideo);
    }
    
    // Close modal when clicking outside
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }

    // Edit form submission
    const editForm = document.getElementById('editVideoForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditVideo);
    }

    // ✅ FIXED: Setup thumbnail options when edit modal is opened
    document.addEventListener('click', function(e) {
        if (e.target.closest('button') && e.target.closest('button').onclick && 
            e.target.closest('button').onclick.toString().includes('editVideo')) {
            // Wait for modal to be visible, then setup thumbnail options
            setTimeout(setupThumbnailOptions, 100);
        }
    });
}
// Load categories for filter
async function loadCategories() {
    try {
        console.log('📂 Loading categories...');
        const response = await fetch(`${API_BASE_URL}/categories`);
        
        if (response.ok) {
            categories = await response.json();
            console.log('✅ Categories loaded:', categories.length);
            populateCategoryFilter();
            populateEditCategoryFilter();
        } else {
            console.warn('⚠️ Categories API returned:', response.status);
        }
    } catch (error) {
        console.error('❌ Error loading categories:', error);
    }
}

function populateCategoryFilter() {
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.slug || category.name;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

function populateEditCategoryFilter() {
    const editCategory = document.getElementById('editCategory');
    if (!editCategory) return;
    
    editCategory.innerHTML = '<option value="">Select Category</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.slug || category.name;
        option.textContent = category.name;
        editCategory.appendChild(option);
    });
}

// Load videos - UPDATED FOR ADMIN WITH DRAFTS
async function loadVideos(page = 1) {
    showLoading();
    
    // Set a timeout to prevent infinite loading
    const loadTimeout = setTimeout(() => {
        console.warn('⚠️ Load videos timeout - showing error');
        showError('Loading timeout. Please try again.');
        hideLoading();
    }, 10000); // 10 second timeout
    
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 10
        });
        
        // Add filters
        const search = searchInput?.value.trim() || '';
        const category = categoryFilter?.value || '';
        const status = statusFilter?.value || '';
        
        if (search) params.append('q', search);
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        
        console.log('🔍 Loading ADMIN videos with params:', params.toString());
        
        // USE THE NEW ADMIN ENDPOINT
        const response = await fetch(`${API_BASE_URL}/videos/admin/all?${params}`, {
            headers: getAuthHeaders()
        });
        
        console.log('📡 ADMIN API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Admin API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ ADMIN Videos loaded:', data.videos.length);
        
        videos = data.videos || [];
        currentPage = data.currentPage || page;
        totalPages = data.totalPages || 1;
        
        displayVideos();
        displayPagination();
        
    } catch (error) {
        console.error('❌ Error loading admin videos:', error);
        showError('Failed to load videos: ' + error.message);
    } finally {
        clearTimeout(loadTimeout); // Clear timeout when done
        hideLoading();
    }
}

// Display videos in table - UPDATED
function displayVideos() {
    console.log('🎬 Displaying videos...');
    
    if (!videosTableBody) {
        console.error('❌ videosTableBody not found');
        return;
    }
    
    if (videos.length === 0) {
        console.log('📭 No videos to display, showing empty state');
        showEmptyState();
        return;
    }
    
    console.log(`📹 Displaying ${videos.length} videos`);
    
    // Show the videos table
    showVideosTable();
    
    // Populate the table
    videosTableBody.innerHTML = videos.map(video => `
        <tr class="hover:bg-gray-50">
            <!-- Video Info -->
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <img class="h-10 w-16 object-cover rounded-lg" src="${video.thumbnail}" alt="${video.title}" 
                         onerror="this.src='https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=80&h=45&fit=crop'">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">${video.title || 'Untitled Video'}</div>
                        <div class="text-sm text-gray-500">${formatDuration(video.duration)}</div>
                    </div>
                </div>
            </td>
            
            <!-- Category -->
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                    ${video.category || 'Uncategorized'}
                </span>
            </td>
            
            <!-- Views -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatViews(video.views || 0)}
            </td>
            
            <!-- Likes -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatLikes(video.likes || 0)}
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
                    <a href="../video.html?id=${video._id}" target="_blank" class="text-blue-600 hover:text-blue-900 transition duration-200" title="View">
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
    
    console.log('✅ Videos displayed successfully');
}

// Load videos - UPDATED WITH BETTER ERROR HANDLING
async function loadVideos(page = 1) {
    console.log('🔄 Starting to load videos...');
    showLoading();
    
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 10
        });
        
        // Add filters
        const search = searchInput?.value.trim() || '';
        const category = categoryFilter?.value || '';
        const status = statusFilter?.value || '';
        
        if (search) params.append('q', search);
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        
        console.log('🔍 Loading ADMIN videos with params:', params.toString());
        
        const response = await fetch(`${API_BASE_URL}/videos/admin/all?${params}`, {
            headers: getAuthHeaders()
        });
        
        console.log('📡 ADMIN API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Admin API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ ADMIN Videos loaded:', data.videos.length);
        
        videos = data.videos || [];
        currentPage = data.currentPage || page;
        totalPages = data.totalPages || 1;
        
        displayVideos();
        displayPagination();
        
    } catch (error) {
        console.error('❌ Error loading admin videos:', error);
        showError('Failed to load videos: ' + error.message);
        // Make sure to hide loading even on error
        showEmptyState();
    }
}

// Display pagination
function displayPagination() {
    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
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

// Clear filters
function clearFilters() {
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    currentPage = 1;
    loadVideos();
}

function editVideo(videoId) {
    const video = videos.find(v => v._id === videoId);
    if (!video) {
        showError('Video not found');
        return;
    }
    
    console.log('✏️ Editing video:', video);
    
    // Populate edit form (your existing code)
    document.getElementById('editVideoId').value = video._id;
    document.getElementById('editTitle').value = video.title || '';
    document.getElementById('editDescription').value = video.description || '';
    document.getElementById('editTags').value = video.tags ? video.tags.join(', ') : '';
    document.getElementById('editStatus').value = video.status || 'published';
    
    // Set thumbnail preview
    const thumbnailPreview = document.getElementById('editThumbnailPreview');
    if (thumbnailPreview) {
        thumbnailPreview.src = video.thumbnail;
        thumbnailPreview.alt = video.title || 'Video thumbnail';
    }
    
    // Reset thumbnail options
    resetThumbnailOptions();
    
    // Populate category dropdown
    const categorySelect = document.getElementById('editCategory');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.slug || category.name;
            option.textContent = category.name;
            if ((category.slug || category.name) === video.category) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    }
    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
    // ✅ THEN setup thumbnail options after modal is visible
    setTimeout(() => {
        setupThumbnailOptions();
    }, 50);
}

function setupThumbnailOptions() {
    console.log('🔧 Setting up thumbnail options...');
    
    const thumbnailRadios = document.querySelectorAll('input[name="thumbnailOption"]');
    const uploadInput = document.getElementById('editThumbnailUpload');
    const regenerateBtn = document.getElementById('regenerateThumbnailsBtn');
    const urlInput = document.getElementById('editThumbnailUrl');
    const newPreview = document.getElementById('newThumbnailPreview');
    
    console.log('📻 Thumbnail radios found:', thumbnailRadios.length);
    console.log('📤 Upload input:', uploadInput);
    console.log('🔄 Regenerate button:', regenerateBtn);
    
    if (!thumbnailRadios.length) {
        console.error('❌ No thumbnail option radios found!');
        return;
    }
    
    thumbnailRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('🎯 Thumbnail option changed to:', this.value);
            
            // Hide all first
            if (uploadInput) uploadInput.classList.add('hidden');
            if (regenerateBtn) regenerateBtn.classList.add('hidden');
            if (urlInput) urlInput.classList.add('hidden');
            if (newPreview) newPreview.classList.add('hidden');
            
            // Show selected option
            if (this.value === 'upload' && uploadInput) {
                uploadInput.classList.remove('hidden');
            } else if (this.value === 'regenerate' && regenerateBtn) {
                regenerateBtn.classList.remove('hidden');
                console.log('✅ Regenerate button should now be visible');
            } else if (this.value === 'url' && urlInput) {
                urlInput.classList.remove('hidden');
            }
        });
    });

    // Handle regenerate thumbnails
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', function() {
            const videoId = document.getElementById('editVideoId').value;
            console.log('🎬 Regenerate thumbnails clicked for video:', videoId);
            if (videoId) {
                regenerateThumbnails(videoId);
            } else {
                showError('No video selected for thumbnail regeneration');
            }
        });
    }
    
    // Setup thumbnail selection modal events
    setupThumbnailModalEvents();
}

// ✅ NEW: Setup thumbnail modal events
function setupThumbnailModalEvents() {
    const cancelBtn = document.getElementById('cancelThumbnailSelection');
    const modal = document.getElementById('thumbnailSelectionModal');
    
    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
}

// Reset thumbnail options
function resetThumbnailOptions() {
    // Reset all inputs
    document.querySelectorAll('input[name="thumbnailOption"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Set "keep" as default
    const keepRadio = document.querySelector('input[name="thumbnailOption"][value="keep"]');
    if (keepRadio) keepRadio.checked = true;
    
    // Hide all optional inputs
    const uploadInput = document.getElementById('editThumbnailUpload');
    const regenerateBtn = document.getElementById('regenerateThumbnailsBtn');
    const urlInput = document.getElementById('editThumbnailUrl');
    const newPreview = document.getElementById('newThumbnailPreview');
    
    if (uploadInput) uploadInput.classList.add('hidden');
    if (regenerateBtn) regenerateBtn.classList.add('hidden');
    if (urlInput) urlInput.classList.add('hidden');
    if (newPreview) newPreview.classList.add('hidden');
    
    // Clear values
    if (uploadInput) uploadInput.value = '';
    if (urlInput) urlInput.value = '';
}

// Regenerate thumbnails from the SPECIFIC video - UPDATED
async function regenerateThumbnails(videoId) {
    try {
        console.log('🔧 Starting thumbnail regeneration...');
        console.log('📹 Video ID:', videoId);
        
        showSuccess('Generating new thumbnails from your video...');
        
        // ✅ USE THE CORRECT ENDPOINT
        const response = await fetch(`${API_BASE_URL}/videos/${videoId}/generate-thumbnails`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Generated thumbnails from video:', result.thumbnails);
            showSuccess('Generated new thumbnails from your video!');
            showThumbnailSelectionModal(result.thumbnails, videoId);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error generating thumbnails:', error);
        showError('Failed to generate thumbnails: ' + error.message);
    }
}

// Get thumbnails from currently loaded videos
function getThumbnailsFromCurrentVideos(currentVideoId) {
    const thumbnails = [];
    
    // Use the current video's thumbnail
    const currentVideo = videos.find(v => v._id === currentVideoId);
    if (currentVideo && currentVideo.thumbnail) {
        thumbnails.push(currentVideo.thumbnail);
    }
    
    // Get thumbnails from other videos
    const otherVideos = videos.filter(v => v._id !== currentVideoId && v.thumbnail);
    const randomVideos = [...otherVideos].sort(() => 0.5 - Math.random()).slice(0, 5);
    
    thumbnails.push(...randomVideos.map(v => v.thumbnail));
    
    // Fill any remaining slots
    while (thumbnails.length < 6) {
        thumbnails.push('https://images.unsplash.com/photo-1574717024453-715e0b5cda7f?w=300&h=169&fit=crop');
    }
    
    return thumbnails.slice(0, 6);
}

// Show thumbnail selection modal
function showThumbnailSelectionModal(thumbnails, videoId) {
    const modal = document.getElementById('thumbnailSelectionModal');
    const grid = document.getElementById('thumbnailSelectionGrid');
    
    if (!modal || !grid) {
        console.error('Thumbnail selection modal not found');
        return;
    }
    
    // Display thumbnails
    grid.innerHTML = thumbnails.map((thumb, index) => `
        <div class="thumbnail-option cursor-pointer transition-all duration-200 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 hover:shadow-lg" 
             data-index="${index}" data-thumbnail="${thumb}">
            <img src="${thumb}" 
                 alt="Thumbnail ${index + 1}" 
                 class="w-full h-24 object-cover"
                 onerror="this.src='https://via.placeholder.com/300x169/1a1a1a/666666?text=Thumbnail+${index + 1}'">
            <div class="p-2 bg-white border-t">
                <p class="text-xs font-medium text-gray-900 text-center">Thumbnail ${index + 1}</p>
            </div>
        </div>
    `).join('');
    
    // Handle selection
    let selectedThumbnail = thumbnails[0];
    
    document.querySelectorAll('.thumbnail-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.thumbnail-option').forEach(opt => {
                opt.classList.remove('border-blue-500', 'border-2', 'bg-blue-50');
            });
            
            this.classList.add('border-blue-500', 'border-2', 'bg-blue-50');
            selectedThumbnail = this.dataset.thumbnail;
            
            // Update preview
            document.getElementById('selectedThumbnailImage').src = selectedThumbnail;
        });
    });
    
    // Select first by default and update preview
    const firstOption = document.querySelector('.thumbnail-option');
    if (firstOption) {
        firstOption.click();
    }
    
    // Confirm button
    const confirmBtn = document.getElementById('confirmThumbnailSelection');
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            updateVideoThumbnail(videoId, selectedThumbnail);
            modal.classList.add('hidden');
        };
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

// Update video thumbnail
async function updateVideoThumbnail(videoId, thumbnailUrl) {
    try {
        const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ 
                thumbnail: thumbnailUrl
            })
        });

        if (response.ok) {
            showSuccess('Thumbnail updated successfully!');
            // Update the preview in edit modal
            const preview = document.getElementById('editThumbnailPreview');
            if (preview) preview.src = thumbnailUrl;
            loadVideos(currentPage); // Refresh the table
        } else {
            throw new Error('Failed to update thumbnail');
        }
        
    } catch (error) {
        console.error('Error updating thumbnail:', error);
        showError('Failed to update thumbnail: ' + error.message);
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

// Enhanced handleEditVideo function with thumbnail support
async function handleEditVideo(e) {
    e.preventDefault();
    
    const videoId = document.getElementById('editVideoId').value;
    const formData = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        category: document.getElementById('editCategory').value,
        tags: document.getElementById('editTags').value,
        status: document.getElementById('editStatus').value
    };
    
    // Handle thumbnail if changed
    const selectedOption = document.querySelector('input[name="thumbnailOption"]:checked');
    if (selectedOption && selectedOption.value !== 'keep') {
        if (selectedOption.value === 'upload') {
            const fileInput = document.getElementById('editThumbnailUpload');
            if (fileInput.files.length > 0) {
                // For file upload, you would need to implement a separate endpoint
                // For now, we'll use the URL from the preview
                const newPreview = document.getElementById('newThumbnailImage');
                if (newPreview && newPreview.src) {
                    formData.thumbnail = newPreview.src;
                }
            }
        } else if (selectedOption.value === 'url') {
            const urlInput = document.getElementById('editThumbnailUrl');
            if (urlInput.value) {
                formData.thumbnail = urlInput.value;
            }
        }
        // For 'regenerate' option, thumbnails are handled separately via the modal
    }
    
    console.log('📤 Updating video:', videoId, formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 Update response status:', response.status);
        
        if (response.ok) {
            showSuccess('Video updated successfully');
            closeEditModal();
            loadVideos(currentPage);
        } else {
            const errorText = await response.text();
            throw new Error(`Failed to update video: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('❌ Error updating video:', error);
        showError('Failed to update video: ' + error.message);
    }
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
        console.log('🗑️ Deleting video:', videoToDelete);
        
        const response = await fetch(`${API_BASE_URL}/videos/${videoToDelete}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        console.log('📡 Delete response status:', response.status);
        
        if (response.ok) {
            showSuccess('Video deleted successfully');
            closeDeleteModal();
            loadVideos(currentPage);
        } else {
            const errorText = await response.text();
            throw new Error(`Delete failed: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('❌ Error deleting video:', error);
        showError('Failed to delete video: ' + error.message);
    }
}

// State management - UPDATED
function showLoading() {
    console.log('🔄 Showing loading state...');
    if (loadingState) {
        loadingState.classList.remove('hidden');
        console.log('✅ Loading state shown');
    }
    if (videosTable) {
        videosTable.classList.add('hidden');
        console.log('✅ Videos table hidden');
    }
    if (emptyState) {
        emptyState.classList.add('hidden');
        console.log('✅ Empty state hidden');
    }
}

function hideLoading() {
    console.log('🔄 Hiding loading state...');
    if (loadingState) {
        loadingState.classList.add('hidden');
        console.log('✅ Loading state hidden');
    }
}

function showEmptyState() {
    console.log('🔄 Showing empty state...');
    if (loadingState) {
        loadingState.classList.add('hidden');
        console.log('✅ Loading state hidden');
    }
    if (videosTable) {
        videosTable.classList.add('hidden');
        console.log('✅ Videos table hidden');
    }
    if (emptyState) {
        emptyState.classList.remove('hidden');
        console.log('✅ Empty state shown');
    }
}

function showVideosTable() {
    console.log('🔄 Showing videos table...');
    if (loadingState) {
        loadingState.classList.add('hidden');
        console.log('✅ Loading state hidden');
    }
    if (emptyState) {
        emptyState.classList.add('hidden');
        console.log('✅ Empty state hidden');
    }
    if (videosTable) {
        videosTable.classList.remove('hidden');
        console.log('✅ Videos table shown');
    }
}

// Utility functions
function formatDuration(seconds) {
    if (!seconds) return '0:00';
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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
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

// Auth functions - UPDATED
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'admin') {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}
// Add this function if you want debug capabilities
function debugThumbnailOptions() {
    console.log('🔍 Debugging thumbnail options...');
    console.log('Edit modal:', document.getElementById('editModal'));
    console.log('Thumbnail radios:', document.querySelectorAll('input[name="thumbnailOption"]').length);
    console.log('Regenerate button:', document.getElementById('regenerateThumbnailsBtn'));
    console.log('Regenerate radio:', document.getElementById('regenerateThumbnail'));
    
    // Check if all elements exist
    const elements = {
        'editModal': document.getElementById('editModal'),
        'thumbnailRadios': document.querySelectorAll('input[name="thumbnailOption"]'),
        'regenerateBtn': document.getElementById('regenerateThumbnailsBtn'),
        'regenerateRadio': document.getElementById('regenerateThumbnail'),
        'uploadInput': document.getElementById('editThumbnailUpload'),
        'urlInput': document.getElementById('editThumbnailUrl')
    };
    
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            console.log(`✅ ${name}: exists`, element);
        } else {
            console.log(`❌ ${name}: NOT FOUND`);
        }
    }
}
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'admin-login.html';
}

// Make functions globally available
window.loadVideos = loadVideos;
window.editVideo = editVideo;
window.closeEditModal = closeEditModal;
window.openDeleteModal = openDeleteModal;
window.clearFilters = clearFilters;
window.logout = logout;


window.regenerateThumbnails = regenerateThumbnails;
window.updateVideoThumbnail = updateVideoThumbnail;

// Debug initialization
console.log('🔍 videos-management.js loaded');
console.log('Current page:', window.location.href);
console.log('Token exists:', !!localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initializing videos page');
    initializeVideosPage();
});

