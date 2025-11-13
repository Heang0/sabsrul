const nodemailer = require('nodemailer');
console.log('🔧 Configuring email transporter...');

// Check if email credentials are available
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not found in environment variables');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your Render environment variables');
    console.log('Current EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
}

let transporter;

try {
    // Create transporter with better error handling
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Add timeout settings to prevent hanging
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    // Verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.log('❌ Email configuration error:', error.message);
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