
const EmailJSService = require('./emailjsService');

const sendPasswordResetEmail = async (email, resetToken) => {
    console.log('📧 Attempting to send password reset email to:', email);
    
    // Try EmailJS (uses your Gmail through API)
    console.log('🔄 Trying EmailJS with Gmail...');
    const sent = await EmailJSService.sendPasswordResetEmail(email, resetToken);
    
    if (sent) {
        console.log('✅ Email sent successfully via Gmail!');
        return true;
    }
    
    // Fallback: Show manual link
    console.log('❌ Email sending failed, showing manual reset link');
    return false;
};

module.exports = {
    sendPasswordResetEmail
};
