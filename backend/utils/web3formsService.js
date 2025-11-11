
const axios = require('axios');

class Web3FormsService {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (process.env.WEB3FORMS_ACCESS_KEY) {
            this.initialized = true;
            console.log('✅ Web3Forms service initialized');
        } else {
            console.log('❌ WEB3FORMS_ACCESS_KEY not found');
            console.log('💡 Get free key from: https://web3forms.com');
        }
    }

    async sendPasswordResetEmail(email, resetToken) {
        if (!this.initialized) {
            console.log('❌ Web3Forms not initialized');
            return false;
        }

        try {
            const clientURL = process.env.CLIENT_URL || 'https://sabsrul.onrender.com';
            const resetLink = `${clientURL}/reset-password.html?token=${resetToken}`;

            console.log('📧 Sending via Web3Forms to:', email);

            const response = await axios.post('https://api.web3forms.com/submit', {
                access_key: process.env.WEB3FORMS_ACCESS_KEY,
                subject: 'SabSrul - Password Reset Request',
                from_name: 'SabSrul',
                email: email,
                message: `
                    You requested to reset your password for SabSrul video platform.
                    
                    Click this link to reset your password:
                    ${resetLink}
                    
                    This link will expire in 1 hour.
                    
                    If you didn't request this reset, please ignore this email.
                `
            });

            console.log('✅ Email sent via Web3Forms to:', email);
            console.log('📨 Response:', response.data);
            return response.data.success;

        } catch (error) {
            console.error('❌ Web3Forms error:', error.response?.data || error.message);
            return false;
        }
    }
}

module.exports = new Web3FormsService();
