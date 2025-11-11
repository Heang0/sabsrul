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
                message: `Reset your password: ${resetLink}`
            });

            console.log('✅ Email sent via Web3Forms to:', email);
            return response.data.success;

        } catch (error) {
            console.error('❌ Web3Forms error:', error.response?.data || error.message);
            return false;
        }
    }
}

module.exports = new Web3FormsService();