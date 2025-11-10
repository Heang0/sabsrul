const nodemailer = require('nodemailer');

// Create transporter with proper error handling
let transporter;

try {
    // Try to load from config file
    const emailConfig = require('../config/email');
    transporter = emailConfig;
    console.log('✅ Email transporter loaded from config');
} catch (error) {
    console.log('⚠️ Email config not found, creating default transporter...');
    
    // Create fallback transporter
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

// Verify transporter configuration
if (transporter && transporter.verify) {
    transporter.verify(function(error, success) {
        if (error) {
            console.log('❌ Email transporter verification failed:', error);
        } else {
            console.log('✅ Email server is ready to send messages');
        }
    });
}

const sendPasswordResetEmail = async (email, resetToken) => {
    return new Promise((resolve, reject) => {
        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
            console.log('⏰ Email sending timeout - skipping email');
            resolve(true); // Don't reject, just skip email
        }, 15000); // 15 second timeout

        try {
            const clientURL = process.env.CLIENT_URL || 'https://sabsrul.onrender.com';
            const resetLink = `${clientURL}/reset-password.html?token=${resetToken}`;
            
            console.log('📧 SENDING REAL EMAIL TO:', email);
            console.log('🔗 Reset Link:', resetLink);

            const mailOptions = {
                from: `"SabSrul" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'SabSrul - Password Reset Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(to right, #7c3aed, #6d28d9); padding: 30px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 24px;">SabSrul</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset</p>
                        </div>
                        
                        <div style="padding: 30px; background: #f9fafb;">
                            <h2 style="color: #374151; margin-bottom: 20px;">Reset Your Password</h2>
                            <p style="color: #6b7280; line-height: 1.6;">
                                You requested to reset your password. Click the button below to create a new password:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" 
                                   style="background: #7c3aed; color: white; padding: 12px 30px; 
                                          text-decoration: none; border-radius: 8px; display: inline-block;
                                          font-weight: bold; font-size: 16px;">
                                    Reset Password
                                </a>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px;">
                                If the button doesn't work, copy and paste this link in your browser:<br>
                                <a href="${resetLink}" style="color: #7c3aed; word-break: break-all;">${resetLink}</a>
                            </p>
                            
                            <div style="margin-top: 30px; padding: 15px; background: #e0e7ff; border-radius: 8px;">
                                <p style="color: #4f46e5; margin: 0; font-size: 14px;">
                                    <strong>Note:</strong> This link will expire in 1 hour for security reasons.
                                </p>
                            </div>
                        </div>
                        
                        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                            <p>If you didn't request this reset, please ignore this email.</p>
                            <p>&copy; ${new Date().getFullYear()} SabSrul. All rights reserved.</p>
                        </div>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                clearTimeout(timeout);
                if (error) {
                    console.error('❌ Real email error:', error);
                    // Don't reject - still allow password reset to work
                    resolve(false);
                } else {
                    console.log('✅ REAL EMAIL SENT SUCCESSFULLY!');
                    console.log('📧 Message ID:', info.messageId);
                    console.log('👤 To:', email);
                    resolve(true);
                }
            });
            
        } catch (error) {
            clearTimeout(timeout);
            console.error('❌ Email service error:', error);
            resolve(false); // Don't reject - allow password reset to work
        }
    });
};

module.exports = {
    sendPasswordResetEmail
};