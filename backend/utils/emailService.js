
const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (email, resetToken) => {
    console.log('🚀 Attempting Gmail SMTP to:', email);
    
    // Quick fallback - if Gmail fails, show manual link immediately
    const fallback = () => {
        console.log('📋 Gmail failed, showing manual link');
        return false;
    };

    try {
        const clientURL = process.env.CLIENT_URL || 'https://sabsrul.onrender.com';
        const resetLink = `${clientURL}/reset-password.html?token=${resetToken}`;

        console.log('🔧 Creating Gmail transporter...');
        
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 5000, // 5 seconds only
            greetingTimeout: 5000
        });

        console.log('📧 Sending email...');
        
        const mailOptions = {
            from: `"SabSrul" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'SabSrul - Password Reset',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetLink}" style="background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                    <p>Or copy this link: ${resetLink}</p>
                    <p><em>This link expires in 1 hour.</em></p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Gmail SUCCESS! Email sent to:', email);
        return true;

    } catch (error) {
        console.log('❌ Gmail failed:', error.message);
        return fallback();
    }
};

module.exports = {
    sendPasswordResetEmail
};
