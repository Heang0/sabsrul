// API Base URL - Auto-detects environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;

// --- DOM Elements (For Login Page) ---
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const loginButton = document.getElementById('loginButton');
const buttonText = document.getElementById('buttonText');
const loadingSpinner = document.getElementById('loadingSpinner');
const messageContainer = document.getElementById('messageContainer');

// --- Utility Functions for Token Handling ---

/**
 * Checks if a JWT token is structurally valid and not expired.
 * NOTE: This is client-side and is only for UI experience, server-side validation is mandatory.
 * @param {string} token
 * @returns {boolean}
 */
function isValidToken(token) {
    if (!token) return false;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        // Decode payload (second part)
        const payloadBase64 = parts[1];
        // Ensure base64 string length is a multiple of 4 by padding with '='
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        
        // Check expiration (exp is in seconds, Date.now() is in milliseconds)
        return payload.exp > Date.now() / 1000;
    } catch (error) {
        console.error("Token validation error:", error);
        return false;
    }
}

/**
 * Returns authentication headers for API requests.
 * @returns {object}
 */
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Verifies token with server
 * @returns {boolean}
 */
async function verifyTokenWithServer(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

/**
 * Redirects if authentication is invalid or prevents redirect if already logged in.
 * Should be called in every admin page's main script.
 * @returns {boolean} True if auth passed, False if redirect happened
 */
async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    const currentPage = window.location.pathname;
    
    // Define pages that require authentication
    const adminPages = ['dashboard.html', 'upload.html', 'videos.html', 'categories.html', 'analytics.html'];
    const requiresAuth = adminPages.some(page => currentPage.includes(page));
    
    console.log('Auth check:', { currentPage, requiresAuth, hasToken: !!token, apiBase: API_BASE_URL });
    
    // 1. If trying to access an admin page
    if (requiresAuth) {
        if (!token || !isValidToken(token)) {
            console.log('No valid token, redirecting to login');
            clearAuthData();
            window.location.href = 'login.html';
            return false;
        }
        
        // Verify token with server to ensure it's still valid
        const isValid = await verifyTokenWithServer(token);
        if (!isValid) {
            console.log('Server token verification failed, redirecting to login');
            clearAuthData();
            window.location.href = 'login.html';
            return false;
        }
        
        console.log('Auth successful for admin page');
        return true;
    }
    
    // 2. If already logged in and trying to access the login page
    if (currentPage.includes('login.html')) {
        if (token && isValidToken(token)) {
            // Verify with server before redirecting
            const isValid = await verifyTokenWithServer(token);
            if (isValid) {
                console.log('Already logged in, redirecting to dashboard');
                window.location.href = 'dashboard.html';
                return false;
            } else {
                console.log('Token invalid on server, clearing data');
                clearAuthData();
            }
        }
    }
    
    return true;
}

/**
 * Clear all authentication data
 */
function clearAuthData() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
}

/**
 * Removes token and redirects to login page.
 */
function logout() {
    console.log('Logging out...');
    clearAuthData();
    window.location.href = 'login.html';
}

// --- UI Feedback Helpers ---

function removeExistingMessages() {
    if (messageContainer) {
        messageContainer.innerHTML = '';
    } else {
        const existingMessages = loginForm?.querySelectorAll('.alert-message');
        existingMessages?.forEach(msg => msg.remove());
    }
}

function displayMessage(message, type) {
    removeExistingMessages();

    const targetElement = messageContainer || loginForm;
    if (!targetElement) return;

    const iconClass = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    const bgClass = type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-700' : 'bg-green-500/10 border border-green-500/20 text-green-700';

    const messageDiv = document.createElement('div');
    messageDiv.className = `${bgClass} px-4 py-3 rounded-lg mb-4 alert-message`;
    messageDiv.innerHTML = `
        <div class="flex items-center">
            <i class="${iconClass} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    targetElement.insertBefore(messageDiv, targetElement.firstChild);
}

const showError = (message) => displayMessage(message, 'error');
const showSuccess = (message) => displayMessage(message, 'success');

// --- Login Handler (Only runs on login.html) ---

function setLoading(loading) {
    if (loginButton) {
        loginButton.disabled = loading;
        buttonText?.classList.toggle('hidden', loading);
        loadingSpinner?.classList.toggle('hidden', !loading);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    setLoading(true);

    try {
        console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminData', JSON.stringify(data.admin));
            
            showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showError(data.message || `Login failed (${response.status}). Check your credentials.`);
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('Failed to fetch')) {
            showError('Login failed: Could not connect to the server. Please check if the server is running.');
        } else {
            showError(`Login failed: ${error.message}`);
        }
    } finally {
        setLoading(false);
    }
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth script loaded - API Base URL:', API_BASE_URL);
    
    // Clear any existing auth data on login page load (for testing)
    if (window.location.pathname.includes('login.html')) {
        clearAuthData();
    }
    
    // Perform initial auth check on every page load
    if (!(await checkAuth())) {
        console.log('Auth check failed, redirecting...');
        return;
    }

    // Set up event listeners only on the login page
    if (loginForm) {
        console.log('Setting up login form listeners');
        
        // Toggle password visibility
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }
        
        // Login form submission
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Expose these functions globally so other admin scripts can use them
window.getAuthHeaders = getAuthHeaders;
window.logout = logout;
window.checkAuth = checkAuth;
window.isValidToken = isValidToken;
window.showError = showError;
window.showSuccess = showSuccess;
window.clearAuthData = clearAuthData;
window.API_BASE_URL = API_BASE_URL; // Expose for debugging

// Global logout button handler
document.addEventListener('click', function(e) {
    if (e.target.closest('[data-logout]')) {
        e.preventDefault();
        logout();
    }
});