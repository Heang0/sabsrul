const emailjs = require('@emailjs/nodejs');

class EmailJSService {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_USER_ID) {
            this.initialized = true;
            console.log('✅ EmailJS service initialized (Node.js SDK)');
            console.log('📧 Service ID:', process.env.EMAILJS_SERVICE_ID);
            console.log('📝 Template ID:', process.env.EMAILJS_TEMPLATE_ID);
            console.log('🔑 Public Key:', process.env.EMAILJS_USER_ID);
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

            console.log('📧 Sending via EmailJS Node.js SDK to:', email);
            console.log('🔗 Reset Link:', resetLink);

            // Use EmailJS Node.js SDK
            const response = await emailjs.send(
                process.env.EMAILJS_SERVICE_ID,
                process.env.EMAILJS_TEMPLATE_ID,
                {
                    to_email: email,
                    reset_link: resetLink,
                    from_name: 'SabSrul'
                },
                {
                    publicKey: process.env.EMAILJS_USER_ID,
                }
            );

            console.log('✅ Email sent via Gmail (EmailJS) to:', email);
            console.log('📨 Response status:', response.status);
            return true;

        } catch (error) {
            console.error('❌ EmailJS Node.js error:', error);
            return false;
        }
    }
}

module.exports = new EmailJSService();
