const nodemailer = require('nodemailer');
console.log('🔧 Configuring email transporter...');

// Check if email credentials are available
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not found in environment variables');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your Render environment variables');
}

let transporter;

try {
    // Create transporter with Render-compatible settings
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Render-specific settings to prevent timeouts
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 30000,     // 30 seconds
        // Additional settings for better reliability
        tls: {
            rejectUnauthorized: false
        },
        debug: true, // Enable debug logging
        logger: true // Enable logger
    });

    // Verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.log('❌ Email configuration error:', error.message);
            console.log('💡 Troubleshooting tips for Render:');
            console.log('1. Check if EMAIL_USER and EMAIL_PASS are set in Render environment variables');
            console.log('2. Make sure you\'re using App Password (16 characters) not regular password');
            console.log('3. Try using port 465 with secure: true');
        } else {
            console.log('✅ Email server is ready to send messages');
            console.log('📧 Using email:', process.env.EMAIL_USER);
        }
    });

} catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    transporter = null;
}

module.exports = transporter;