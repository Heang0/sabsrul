const axios = require('axios');

class EmailJSService {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_USER_ID) {
            this.initialized = true;
            console.log('✅ EmailJS service initialized (Gmail via API)');
            console.log('📧 Service ID:', process.env.EMAILJS_SERVICE_ID);
            console.log('📝 Template ID:', process.env.EMAILJS_TEMPLATE_ID);
        } else {
            console.log('❌ EmailJS credentials not found');
        }
    }

    async sendPasswordResetEmail(email, resetToken) {
        if (!this.initialized) {
            console.log('❌ EmailJS not initialized');
            return false;
        }

        try {
            const clientURL = process.env.CLIENT_URL || 'https://sabsrul.onrender.com';
            const resetLink = `${clientURL}/reset-password.html?token=${resetToken}`;

            console.log('📧 Sending via EmailJS to:', email);
            console.log('🔗 Reset Link:', resetLink);

            const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_USER_ID,
                template_params: {
                    to_email: email,
                    reset_link: resetLink,
                    from_name: 'SabSrul'
                }
            });

            console.log('✅ Email sent via Gmail (EmailJS) to:', email);
            console.log('📨 Response status:', response.status);
            return true;

        } catch (error) {
            console.error('❌ EmailJS error:', error.response?.data || error.message);
            return false;
        }
    }
}

module.exports = new EmailJSService();
