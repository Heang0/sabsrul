// API Base URL
const API_BASE_URL = '/api';

// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const videoFile = document.getElementById('videoFile');
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');
const categorySelect = document.getElementById('category');
const submitButton = document.getElementById('submitButton');
const submitText = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');

// Video Preview Elements
const videoPreviewSection = document.getElementById('videoPreviewSection');
const videoPreview = document.getElementById('videoPreview');
const videoDuration = document.getElementById('videoDuration');
const videoSize = document.getElementById('videoSize');

// Global variables
let selectedVideoFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    initializeUploadPage();
    setupEventListeners();
});

async function initializeUploadPage() {
    await loadCategories();
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
    // Video file upload
    uploadArea.addEventListener('click', () => videoFile.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleVideoDrop);
    
    videoFile.addEventListener('change', handleVideoSelect);
    removeFile.addEventListener('click', handleRemoveVideo);
    
    // Form submission
    uploadForm.addEventListener('submit', handleFormSubmit);
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('border-purple-400', 'bg-purple-50');
}

function handleVideoDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('border-purple-400', 'bg-purple-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
        handleVideoFile(files[0]);
    }
}

function handleVideoSelect(e) {
    if (e.target.files.length > 0) {
        handleVideoFile(e.target.files[0]);
    }
}

async function handleVideoFile(file) {
    if (!file.type.startsWith('video/')) {
        showError('Please select a valid video file');
        return;
    }
    
    if (file.size > 1024 * 1024 * 1024) {
        showError('Video file size must be less than 1GB');
        return;
    }
    
    selectedVideoFile = file;
    fileName.textContent = file.name;
    uploadArea.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    
    // Show video preview
    await showVideoPreview(file);
}

// Show video preview
async function showVideoPreview(file) {
    return new Promise((resolve) => {
        const videoUrl = URL.createObjectURL(file);
        videoPreview.src = videoUrl;
        videoPreviewSection.classList.remove('hidden');
        
        // Set video size info
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        videoSize.textContent = `Size: ${sizeInMB} MB`;
        
        // Wait for video metadata to load
        videoPreview.addEventListener('loadedmetadata', function() {
            const duration = videoPreview.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            videoDuration.textContent = `Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            resolve();
        });
        
        videoPreview.addEventListener('error', function() {
            console.error('Error loading video preview');
            videoDuration.textContent = 'Duration: Unknown';
            resolve();
        });
        
        videoPreview.load();
    });
}

function handleRemoveVideo() {
    selectedVideoFile = null;
    videoFile.value = '';
    
    // Clean up preview
    if (videoPreview.src) {
        URL.revokeObjectURL(videoPreview.src);
        videoPreview.src = '';
    }
    
    fileInfo.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    videoPreviewSection.classList.add('hidden');
}

// Load categories for dropdown
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const categories = await response.json();
            populateCategorySelect(categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function populateCategorySelect(categories) {
    categorySelect.innerHTML = '<option value="">Select a category</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.slug;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
}

// Form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    setLoading(true);
    
    try {
        const formData = new FormData();
        
        formData.append('video', selectedVideoFile);
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('category', document.getElementById('category').value);
        
        const tags = document.getElementById('tags').value;
        if (tags) {
            formData.append('tags', tags);
        }
        
        console.log('📤 Uploading video with auto-thumbnail...');
        
        const response = await fetch(`${API_BASE_URL}/videos/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
        
        console.log('📊 Upload response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Upload successful:', result);
            showSuccess('Video uploaded successfully!');
            resetForm();
            
            setTimeout(() => {
                window.location.href = 'videos.html';
            }, 2000);
        } else {
            const errorText = await response.text();
            console.error('Upload error response:', errorText);
            let errorMessage = 'Upload failed';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError('Network error. Please try again.');
    } finally {
        setLoading(false);
    }
}

function validateForm() {
    if (!selectedVideoFile) {
        showError('Please select a video file');
        return false;
    }
    
    const title = document.getElementById('title').value.trim();
    if (!title) {
        showError('Please enter a video title');
        return false;
    }
    
    const category = document.getElementById('category').value;
    if (!category) {
        showError('Please select a category');
        return false;
    }
    
    return true;
}

function setLoading(loading) {
    if (loading) {
        submitButton.disabled = true;
        submitText.classList.add('hidden');
        submitSpinner.classList.remove('hidden');
    } else {
        submitButton.disabled = false;
        submitText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
    }
}

function resetForm() {
    uploadForm.reset();
    handleRemoveVideo();
}

function showError(message) {
    removeExistingMessages();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    uploadForm.insertBefore(errorDiv, uploadForm.firstChild);
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccess(message) {
    removeExistingMessages();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6';
    successDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    uploadForm.insertBefore(successDiv, uploadForm.firstChild);
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeExistingMessages() {
    const existingMessages = uploadForm.querySelectorAll('.bg-red-50, .bg-green-50');
    existingMessages.forEach(msg => msg.remove());
}

// Auth functions
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