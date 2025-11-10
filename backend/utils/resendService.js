const { Resend } = require('resend');

class ResendService {
    constructor() {
        this.initialized = false;
        this.resend = null;
        this.init();
    }

    init() {
        if (process.env.RESEND_API_KEY) {
            this.resend = new Resend(process.env.RESEND_API_KEY);
            this.initialized = true;
            console.log('✅ Resend service initialized');
            console.log('📧 Using domain: sabsrul.resend.dev');
        } else {
            console.log('❌ RESEND_API_KEY not found');
        }
    }

    async sendPasswordResetEmail(email, resetToken) {
        if (!this.initialized) {
            console.log('❌ Resend not initialized');
            return false;
        }

        try {
            const clientURL = process.env.CLIENT_URL || 'https://sabsrul.onrender.com';
            const resetLink = `${clientURL}/reset-password.html?token=${resetToken}`;

            const { data, error } = await this.resend.emails.send({
                from: process.env.EMAIL_FROM || 'SabSrul <onboarding@sabsrul.resend.dev>',
                to: email,
                subject: 'SabSrul - Password Reset Request',
                html: this.getEmailTemplate(resetLink),
            });

            if (error) {
                console.error('❌ Resend error:', error);
                return false;
            }

            console.log('✅ Resend email sent successfully to:', email);
            console.log('📧 Email ID:', data.id);
            return true;

        } catch (error) {
            console.error('❌ Resend service error:', error);
            return false;
        }
    }

    getEmailTemplate(resetLink) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(to right, #7c3aed, #6d28d9); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">SabSrul</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset</p>
                </div>
                
                <div style="padding: 30px; background: #f9fafb;">
                    <h2 style="color: #374151; margin-bottom: 20px;">Reset Your Password</h2>
                    <p style="color: #6b7280; line-height: 1.6;">
                        You requested to reset your password for SabSrul video platform. Click the button below to create a new password:
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
        `;
    }
}

module.exports = new ResendService();