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

// Combined User Authentication (Login & Register)
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginFormContainer = document.getElementById('loginForm');
    const registerFormContainer = document.getElementById('registerForm');
    
    // Login form elements
    const userLoginForm = document.getElementById('userLoginForm');
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPasswordInput = document.getElementById('loginPassword');
    
    // Register form elements
    const userRegisterForm = document.getElementById('userRegisterForm');
    const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
    const registerPasswordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Tab switching
    if (loginTab && registerTab) {
        loginTab.addEventListener('click', function() {
            switchToLogin();
        });

        registerTab.addEventListener('click', function() {
            switchToRegister();
        });
    }

    function switchToLogin() {
        loginTab.classList.add('tab-active');
        registerTab.classList.remove('tab-active');
        loginFormContainer.classList.add('active-form');
        loginFormContainer.classList.remove('hidden-form');
        registerFormContainer.classList.add('hidden-form');
        registerFormContainer.classList.remove('active-form');
    }

    function switchToRegister() {
        registerTab.classList.add('tab-active');
        loginTab.classList.remove('tab-active');
        registerFormContainer.classList.add('active-form');
        registerFormContainer.classList.remove('hidden-form');
        loginFormContainer.classList.add('hidden-form');
        loginFormContainer.classList.remove('active-form');
    }

    // Toggle password visibility for login
    if (toggleLoginPassword) {
        toggleLoginPassword.addEventListener('click', function() {
            togglePasswordVisibility(loginPasswordInput, this);
        });
    }

    // Toggle password visibility for register
    if (toggleRegisterPassword) {
        toggleRegisterPassword.addEventListener('click', function() {
            togglePasswordVisibility(registerPasswordInput, this);
        });
    }

    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        button.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    }

    // Login form submission
    // Login form submission
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const loginButton = document.getElementById('loginButton');
            const loginButtonText = document.getElementById('loginButtonText');
            const loginLoadingSpinner = document.getElementById('loginLoadingSpinner');

            // Remove any existing error messages
            removeExistingErrorMessages(this);

            // Basic validation
            if (!email || !password) {
                showInlineError(this, 'Please fill in all fields');
                return;
            }

            // Show loading state
            loginButton.disabled = true;
            loginButtonText.textContent = 'Signing in...';
            loginLoadingSpinner.classList.remove('hidden');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Store token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Show success message
                    showInlineSuccess(this, 'Login successful! Redirecting...');
                    
                    // Redirect to home page after short delay
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    // Show beautiful inline error message
                    showInlineError(this, data.message || 'Invalid email or password');
                }
            } catch (error) {
                console.error('Login error:', error);
                showInlineError(this, 'Network error. Please check your connection and try again.');
            } finally {
                // Reset button state
                loginButton.disabled = false;
                loginButtonText.textContent = 'Sign In';
                loginLoadingSpinner.classList.add('hidden');
            }
        });
    }
    // Register form submission
    // Register form submission
    if (userRegisterForm) {
        userRegisterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;
            
            const registerButton = document.getElementById('registerButton');
            const registerButtonText = document.getElementById('registerButtonText');
            const registerLoadingSpinner = document.getElementById('registerLoadingSpinner');

            // Remove existing error messages
            removeExistingErrorMessages(this);

            // Validation
            if (!username || !email || !password || !confirmPassword) {
                showInlineError(this, 'Please fill in all fields');
                return;
            }

            if (password !== confirmPassword) {
                showInlineError(this, 'Passwords do not match!');
                return;
            }

            if (password.length < 6) {
                showInlineError(this, 'Password must be at least 6 characters long');
                return;
            }

            if (!agreeTerms) {
                showInlineError(this, 'Please agree to the Terms of Service and Privacy Policy');
                return;
            }

            // Show loading state
            registerButton.disabled = true;
            registerButtonText.textContent = 'Creating Account...';
            registerLoadingSpinner.classList.remove('hidden');

            try {
                console.log('🔄 Sending registration request...');
                
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();
                console.log('📨 Registration response:', data);

                if (response.ok) {
                    // Store token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    showInlineSuccess(this, 'Account created successfully! Welcome to SabSrul!');
                    
                    // Redirect to home page after short delay
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    showInlineError(this, data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('❌ Registration error:', error);
                showInlineError(this, 'Network error. Please check your connection and try again.');
            } finally {
                // Reset button state
                registerButton.disabled = false;
                registerButtonText.textContent = 'Create Account';
                registerLoadingSpinner.classList.add('hidden');
            }
        });
    }

    // Check if already logged in and redirect to home
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.id) {
        window.location.href = '/';
    }
});

// --- Professional Error/Success Message Functions ---

// Remove existing error messages
function removeExistingErrorMessages(form) {
    const existingErrors = form.querySelectorAll('.form-error-message, .form-success-message');
    existingErrors.forEach(error => error.remove());
}

// Show beautiful inline error message
function showInlineError(form, message) {
    removeExistingErrorMessages(form);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message w-full mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center animate-slideDown';
    errorDiv.innerHTML = `
        <div class="flex flex-col items-center justify-center space-y-2">
            <div class="flex items-center justify-center">
                <i class="fas fa-exclamation-circle text-red-500 text-lg mr-2"></i>
                <h4 class="text-sm font-medium text-red-800">Something went wrong</h4>
            </div>
            <p class="text-sm text-red-700">${message}</p>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-600 transition duration-200 text-xs mt-1">
                <i class="fas fa-times mr-1"></i>Dismiss
            </button>
        </div>
    `;
    
    // SAFE INSERTION - Append to the end of the form
    form.appendChild(errorDiv);
    
    // Add shake animation to the form
    form.classList.add('animate-shake');
    setTimeout(() => {
        form.classList.remove('animate-shake');
    }, 500);
}

// Show beautiful inline success message
function showInlineSuccess(form, message) {
    removeExistingErrorMessages(form);
    
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success-message w-full mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-slideDown';
    successDiv.innerHTML = `
        <div class="flex flex-col items-center justify-center space-y-2">
            <div class="flex items-center justify-center">
                <i class="fas fa-check-circle text-green-500 text-lg mr-2"></i>
                <h4 class="text-sm font-medium text-green-800">Success!</h4>
            </div>
            <p class="text-sm text-green-700">${message}</p>
        </div>
    `;
    
    // SAFE INSERTION - Append to the end of the form
    form.appendChild(successDiv);
}
// --- Forgot Password Functionality ---
document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            // Remove existing messages
            removeExistingErrorMessages(this);
            
            // Basic validation
            if (!email) {
                showInlineError(this, 'Please enter your email address');
                return;
            }
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            
            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showInlineSuccess(this, 'Password reset link has been generated! Check the modal for your reset link.');
                    this.reset();
                } else {
                    showInlineError(this, data.message || 'Failed to generate reset link');
                }
            } catch (error) {
                console.error('Forgot password error:', error);
                showInlineError(this, 'Network error. Please check your connection and try again.');
            } finally {
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
    }
    
    // Reset Password Functionality
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (!token) {
                showInlineError(this, 'Invalid reset link. Please request a new password reset.');
                return;
            }
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            // Remove existing messages
            removeExistingErrorMessages(this);
            
            // Validation
            if (!password || !confirmPassword) {
                showInlineError(this, 'Please fill in all fields');
                return;
            }
            
            if (password.length < 6) {
                showInlineError(this, 'Password must be at least 6 characters long');
                return;
            }
            
            if (password !== confirmPassword) {
                showInlineError(this, 'Passwords do not match');
                return;
            }
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Resetting...';
            
            try {
                const response = await fetch(`/api/auth/reset-password/${token}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showInlineSuccess(this, 'Password reset successfully! Redirecting to login...');
                    
                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    showInlineError(this, data.message || 'Failed to reset password');
                }
            } catch (error) {
                console.error('Reset password error:', error);
                showInlineError(this, 'Network error. Please check your connection and try again.');
            } finally {
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
    }
});

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

// Real-time username validation
document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('registerUsername');
    const usernameError = document.getElementById('usernameError');
    const usernameSuccess = document.getElementById('usernameSuccess');
    const usernameAvailability = document.getElementById('usernameAvailability');

    if (usernameInput) {
        let usernameTimeout;
        
        usernameInput.addEventListener('input', function() {
            const username = this.value.trim();
            
            // Clear previous timeout
            clearTimeout(usernameTimeout);
            
            // Hide previous messages
            usernameError.classList.add('hidden');
            usernameSuccess.classList.add('hidden');
            usernameAvailability.classList.add('hidden');
            
            // Validate format
            const usernameRegex = /^[a-zA-Z0-9_]*$/;
            if (!usernameRegex.test(username)) {
                usernameError.textContent = 'Only letters, numbers, and underscores allowed';
                usernameError.classList.remove('hidden');
                return;
            }
            
            if (username.length < 3) {
                usernameError.textContent = 'Username must be at least 3 characters';
                usernameError.classList.remove('hidden');
                return;
            }
            
            if (username.length > 30) {
                usernameError.textContent = 'Username must be less than 30 characters';
                usernameError.classList.remove('hidden');
                return;
            }
            
            // Check availability after user stops typing
            usernameTimeout = setTimeout(async () => {
                try {
                    const response = await fetch('/api/auth/check-username', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        if (data.available) {
                            usernameSuccess.textContent = 'Username is available!';
                            usernameSuccess.classList.remove('hidden');
                            usernameAvailability.classList.remove('hidden');
                        } else {
                            usernameError.textContent = 'Username is already taken';
                            usernameError.classList.remove('hidden');
                        }
                    }
                } catch (error) {
                    console.error('Username check error:', error);
                }
            }, 500); // Wait 500ms after user stops typing
        });
    }
});

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
window.clearAuthData = clearAuthData;
window.API_BASE_URL = API_BASE_URL; // Expose for debugging

// Global logout button handler
document.addEventListener('click', function(e) {
    if (e.target.closest('[data-logout]')) {
        e.preventDefault();
        logout();
    }
});

// Add this CSS dynamically for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-shake {
        animation: shake 0.5s ease-in-out;
    }
    
    .animate-slideDown {
        animation: slideDown 0.3s ease-out;
    }
    
    /* Responsive message styles */
    .form-error-message,
    .form-success-message {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }
    
    @media (max-width: 640px) {
        .form-error-message,
        .form-success-message {
            padding: 0.75rem;
            margin-top: 1rem;
        }
        
        .form-error-message .flex,
        .form-success-message .flex {
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .form-error-message h4,
        .form-success-message h4 {
            font-size: 0.875rem;
        }
        
        .form-error-message p,
        .form-success-message p {
            font-size: 0.75rem;
            line-height: 1.2;
        }
    }
    
    @media (max-width: 480px) {
        .form-error-message,
        .form-success-message {
            padding: 0.5rem;
        }
        
        .form-error-message .flex,
        .form-success-message .flex {
            gap: 0.25rem;
        }
    }
`;
document.head.appendChild(style);