const ResendService = require('./resendService');

const sendPasswordResetEmail = async (email, resetToken) => {
    console.log('📧 Attempting to send password reset email to:', email);
    
    // Try Resend (works on Render free tier)
    if (process.env.RESEND_API_KEY) {
        console.log('🔄 Trying Resend...');
        const sent = await ResendService.sendPasswordResetEmail(email, resetToken);
        if (sent) {
            console.log('✅ Email sent via Resend');
            return true;
        }
    }
    
    // Fallback: Show manual link
    console.log('📋 Email service not configured, showing manual reset link');
    return false;
};

module.exports = {
    sendPasswordResetEmail
};