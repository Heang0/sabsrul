const nodemailer = require('nodemailer');

console.log('🔧 Configuring email transporter...');

// Check if email credentials are available
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not found in environment variables');
    console.log('Please set EMAIL_USER and EMAIL_PASS in your Render environment variables');
}

const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
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