// API Base URL
const API_BASE_URL = '/api';

// DOM Elements
const categoriesGrid = document.getElementById('categoriesGrid');
const emptyState = document.getElementById('emptyState');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const addFirstCategory = document.getElementById('addFirstCategory');
const categoryModal = document.getElementById('categoryModal');
const modalTitle = document.getElementById('modalTitle');
const categoryForm = document.getElementById('categoryForm');
const categoryName = document.getElementById('categoryName');
const categorySlug = document.getElementById('categorySlug');
const categoryDescription = document.getElementById('categoryDescription');
const cancelCategory = document.getElementById('cancelCategory');

// Global variables
let categories = [];
let editingCategory = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    initializeCategoriesPage();
    setupEventListeners();
});

async function initializeCategoriesPage() {
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
    // Add category buttons
    addCategoryBtn.addEventListener('click', openAddModal);
    addFirstCategory.addEventListener('click', openAddModal);
    
    // Form submission
    categoryForm.addEventListener('submit', handleFormSubmit);
    
    // Cancel button
    cancelCategory.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    categoryModal.addEventListener('click', function(e) {
        if (e.target === categoryModal) {
            closeModal();
        }
    });
    
    // Auto-generate slug from name
    categoryName.addEventListener('input', generateSlug);
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            categories = await response.json();
            displayCategories();
        } else {
            throw new Error('Failed to fetch categories');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories');
    }
}

// Display categories
function displayCategories() {
    if (categories.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-start justify-between mb-4">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 capitalize">${category.name}</h3>
                    <p class="text-sm text-gray-500 mt-1">${category.videoCount || 0} videos</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="editCategory('${category._id}')" class="text-gray-400 hover:text-green-500 transition duration-200" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCategory('${category._id}')" class="text-gray-400 hover:text-red-500 transition duration-200" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            ${category.description ? `
                <p class="text-sm text-gray-600 mb-4">${category.description}</p>
            ` : ''}
            
            <div class="flex items-center justify-between text-xs text-gray-500">
                <span>Slug: ${category.slug}</span>
                <span>Created: ${formatDate(category.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

// Modal functions
function openAddModal() {
    editingCategory = null;
    modalTitle.textContent = 'Add Category';
    categoryForm.reset();
    categoryModal.classList.remove('hidden');
}

function openEditModal(category) {
    editingCategory = category;
    modalTitle.textContent = 'Edit Category';
    
    categoryName.value = category.name;
    categorySlug.value = category.slug;
    categoryDescription.value = category.description || '';
    
    categoryModal.classList.remove('hidden');
}

function closeModal() {
    editingCategory = null;
    categoryModal.classList.add('hidden');
    categoryForm.reset();
}

// Generate slug from category name
function generateSlug() {
    if (!editingCategory) {
        const name = categoryName.value;
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        categorySlug.value = slug;
    }
}

// Form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: categoryName.value.trim(),
        slug: categorySlug.value.trim(),
        description: categoryDescription.value.trim()
    };
    
    if (!formData.name || !formData.slug) {
        showError('Please fill in all required fields');
        return;
    }
    
    try {
            const url = editingCategory ? 
    `${API_BASE_URL}/categories/${editingCategory._id}` :
    `${API_BASE_URL}/categories`;
        
        const method = editingCategory ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showSuccess(editingCategory ? 'Category updated successfully' : 'Category created successfully');
            closeModal();
            await loadCategories();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Operation failed');
        }
    } catch (error) {
        console.error('Error saving category:', error);
        showError(error.message || 'Failed to save category');
    }
}

// Edit category
function editCategory(categoryId) {
    const category = categories.find(c => c._id === categoryId);
    if (category) {
        openEditModal(category);
    }
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showSuccess('Category deleted successfully');
            await loadCategories();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete category');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showError(error.message || 'Failed to delete category');
    }
}

// State management
function showEmptyState() {
    emptyState.classList.remove('hidden');
    categoriesGrid.innerHTML = '';
}

function hideEmptyState() {
    emptyState.classList.add('hidden');
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
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