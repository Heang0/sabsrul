const nodemailer = require('nodemailer');
console.log('🔧 Configuring Gmail transporter...');

// Check if email credentials are available
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not found in environment variables');
    console.log('💡 Please set EMAIL_USER and EMAIL_PASS in your Render environment variables');
}

let transporter;

try {
    // PROPER GMAIL CONFIGURATION
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Important settings for deliverability
        secure: true,
        tls: {
            rejectUnauthorized: false
        },
        // Rate limiting prevention
        pool: true,
        maxConnections: 1,
        maxMessages: 10
    });

    // Verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.log('❌ Gmail configuration error:', error.message);
            console.log('💡 TROUBLESHOOTING STEPS:');
            console.log('1. Make sure you\'re using an APP PASSWORD, not your regular Gmail password');
            console.log('2. Enable 2-Factor Authentication on your Gmail account');
            console.log('3. Generate a 16-character App Password from: https://myaccount.google.com/apppasswords');
            console.log('4. Make sure EMAIL_USER and EMAIL_PASS are set in Render environment variables');
        } else {
            console.log('✅ Gmail server is ready to send messages');
            console.log('📧 Using Gmail account:', process.env.EMAIL_USER);
        }
    });

} catch (error) {
    console.error('❌ Failed to create Gmail transporter:', error.message);
    transporter = null;
}

module.exports = transporter;