const transporter = require('../config/email');

const sendPasswordResetEmail = async (email, resetLink) => {
    try {
        console.log('📧 SENDING PASSWORD RESET EMAIL...');
        console.log(`📨 To: ${email}`);
        console.log(`🔗 Reset Link: ${resetLink}`);

        const mailOptions = {
            from: `"SabSrul" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your SabSrul Password',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 30px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
            <p>SabSrul Video Platform</p>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            
            <div class="footer">
                <p>© 2024 SabSrul. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `,
            text: `
Password Reset Request

Hello,

You requested to reset your password for your SabSrul account.

Click here to reset your password: ${resetLink}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
SabSrul Team
            `.trim()
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        return true;

    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
};

module.exports = {
    sendPasswordResetEmail
};