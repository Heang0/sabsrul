const nodemailer = require('nodemailer');
console.log('🔧 Configuring email transporter...');

// Check if email credentials are available
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not found in environment variables');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your Render environment variables');
}

// FIX: Changed createTransporter to createTransport
const transporter = nodemailer.createTransport({
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
        console.log('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

module.exports = transporter;
