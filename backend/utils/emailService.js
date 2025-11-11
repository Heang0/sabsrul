const BrevoApiService = require('./brevoApiService');

const sendPasswordResetEmail = async (email, resetToken) => {
    console.log('📧 Attempting to send password reset email to:', email);
    
    // Try Brevo API (works on Render free tier)
    if (process.env.BREVO_API_KEY) {
        console.log('🔄 Trying Brevo API...');
        const sent = await BrevoApiService.sendPasswordResetEmail(email, resetToken);
        if (sent) {
            console.log('✅ Email sent via Brevo API');
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
