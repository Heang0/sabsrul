// Admin Authentication
document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Admin login form submission
    adminLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Show loading state
        loginButton.disabled = true;
        buttonText.textContent = 'Signing in...';
        loadingSpinner.classList.remove('hidden');

        try {
            // ✅ FIXED: Using admin-login endpoint instead of regular login
            const response = await fetch('/api/auth/admin-login', {
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
                
                // Check if user is admin
                if (data.user.role === 'admin') {
                    // Redirect to admin dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Regular users shouldn't access admin login
                    alert('Access denied. Admin privileges required.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Network error. Please try again.');
        } finally {
            // Reset button state
            loginButton.disabled = false;
            buttonText.textContent = 'Access Admin Panel';
            loadingSpinner.classList.add('hidden');
        }
    });

    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.role === 'admin') {
        window.location.href = 'dashboard.html';
    }
});