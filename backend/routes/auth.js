const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/admin-login
// @desc    Login admin
// @access  Public
router.post('/admin-login', authController.adminLogin);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getMe);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password - send reset email
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', authController.resetPassword);

// @route   GET /api/auth/verify-reset-token/:token
// @desc    Verify if reset token is valid
// @access  Public
router.get('/verify-reset-token/:token', authController.verifyResetToken);

// @route   POST /api/auth/change-password
// @desc    Change password (logged in users)
// @access  Private
router.post('/change-password', auth, authController.changePassword);

// @route   POST /api/auth/check-username
// @desc    Check if username is available
// @access  Public
router.post('/check-username', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username || username.length < 3) {
            return res.json({
                available: false,
                message: 'Username too short'
            });
        }
        
        // Check username format
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.json({
                available: false,
                message: 'Invalid username format'
            });
        }
        
        // Check if username exists (case-insensitive)
        const existingUser = await User.findOne({ 
            username: { $regex: new RegExp(`^${username}$`, 'i') } 
        });
        
        res.json({
            available: !existingUser,
            message: existingUser ? 'Username taken' : 'Username available'
        });
        
    } catch (error) {
        console.error('Username check error:', error);
        res.status(500).json({
            available: false,
            message: 'Server error'
        });
    }
});

module.exports = router;