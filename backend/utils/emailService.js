const Web3FormsService = require('./web3formsService');

const sendPasswordResetEmail = async (email, resetToken) => {
    console.log('📧 Attempting to send password reset email to:', email);
    
    // Try Web3Forms
    if (process.env.WEB3FORMS_ACCESS_KEY) {
        console.log('🔄 Trying Web3Forms...');
        const sent = await Web3FormsService.sendPasswordResetEmail(email, resetToken);
        if (sent) {
            console.log('✅ Email sent via Web3Forms');
            return true;
        }
    }
    
    // Fallback
    console.log('📋 Email service not configured, showing manual reset link');
    return false;
};

module.exports = {
    sendPasswordResetEmail
};