const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { validateEmail, validatePassword } = require('../utils/validation');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username can only contain letters, numbers, and underscores (no spaces or special characters)'
            });
        }

        // Check if user already exists (case-insensitive)
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: { $regex: new RegExp(`^${username}$`, 'i') } }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
            if (existingUser.username.toLowerCase() === username.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken. Please choose a different one.'
                });
            }
        }

        // Create new user with lowercase username for consistency
        const user = new User({
            username: username.toLowerCase(), // Store in lowercase
            email: email.toLowerCase(),
            password,
            role: 'user'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username, // Return the stored lowercase username
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            if (field === 'username') {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken. Please choose a different one.'
                });
            }
            if (field === 'email') {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during admin login'
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal if email exists or not
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordReset();
        await user.save();

        console.log(`🔐 Generated reset token for ${email}: ${resetToken}`);

        // Create reset link
        const clientURL = process.env.CLIENT_URL || 'https://sabsrul.onrender.com';
        const resetLink = `${clientURL}/reset-password.html?token=${resetToken}`;
        
        console.log('🔗 RESET LINK FOR TESTING:', resetLink);

        // Try to send email
        let emailSent = false;
        try {
            await sendPasswordResetEmail(email, resetToken);
            emailSent = true;
            console.log('✅ Email sent successfully');
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError.message);
            emailSent = false;
        }

        // Return response with reset link for testing
        res.json({
            success: true,
            message: emailSent 
                ? 'If an account with that email exists, a password reset link has been sent'
                : 'Check server logs for reset link (email service issue)',
            // Include reset link for testing
            resetLink: resetLink // ✅ ADD THIS LINE
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset request'
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        console.log(`🔄 Processing password reset for token: ${token}`);

        // Validate password
        if (!password || !validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find user by valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('❌ Invalid or expired reset token');
            return res.status(400).json({
                success: false,
                message: 'Password reset token is invalid or has expired. Please request a new reset link.'
            });
        }

        console.log(`✅ Valid reset token found for user: ${user.email}`);

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();

        console.log(`✅ Password successfully reset for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate new password
        if (!newPassword || !validatePassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findById(req.user.id);

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Check if new password is same as current password
        const isSamePassword = await user.comparePassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as current password'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password change'
        });
    }
};

// Additional utility function to verify reset token (for frontend validation)
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        res.json({
            success: true,
            message: 'Valid reset token',
            email: user.email // Return email for confirmation
        });

    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during token verification'
        });
    }
};