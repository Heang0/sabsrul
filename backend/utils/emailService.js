const transporter = require('../config/email');

const sendPasswordResetEmail = async (email, resetLink) => {
    try {
        console.log('📧 SENDING PASSWORD RESET EMAIL...');
        console.log(`📨 To: ${email}`);
        console.log(`🔗 Reset Link: ${resetLink}`);

        // Check if email credentials are available
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email credentials missing in environment variables');
            console.log('Please set EMAIL_USER and EMAIL_PASS in your environment variables');
            return false;
        }

        const mailOptions = {
            from: `"SabSrul Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'SabSrul - Password Reset Request',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset</h1>
                            <p>SabSrul Video Platform</p>
                        </div>
                        <div class="content">
                            <h2>Hello!</h2>
                            <p>You requested a password reset for your SabSrul account.</p>
                            <p>Click the button below to reset your password:</p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" class="button">Reset Your Password</a>
                            </p>
                            <p><strong>This link will expire in 1 hour</strong> for security reasons.</p>
                            <p>If you didn't request this reset, please ignore this email.</p>
                            <div class="footer">
                                <p>© 2024 SabSrul. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Send email
        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return true;

    } catch (error) {
        console.error('❌ Email sending failed:', error);
        console.log('Error details:', error.message);
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail
};