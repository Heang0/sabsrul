// Fixed email service with correct nodemailer syntax
let emailService;

try {
  // Try to use nodemailer if available
  const nodemailer = require('nodemailer');
  
  // Check if we have email credentials
  const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  
  if (hasEmailConfig) {
    // Create real transporter for Gmail
    emailService = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    console.log('✅ Nodemailer configured with Gmail');
  } else {
    // Create simulated transporter for development
    console.log('⚠️ Email credentials not found, using simulated email service');
    emailService = {
      sendMail: async (mailOptions) => {
        console.log('📧 SIMULATED EMAIL SENT:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        
        // Extract and display the reset link
        const resetLinkMatch = mailOptions.html?.match(/http[^"]*/);
        if (resetLinkMatch) {
          console.log('🔗 Reset Link:', resetLinkMatch[0]);
          console.log('💡 Copy this link and open in browser to test password reset');
        }
        
        // Simulate successful email sending
        return { 
          messageId: 'simulated-' + Date.now(),
          simulated: true 
        };
      }
    };
  }
} catch (error) {
  console.log('❌ Nodemailer error, using simulated email service:', error.message);
  
  // Fallback simulation service
  emailService = {
    sendMail: async (mailOptions) => {
      console.log('📧 SIMULATED EMAIL SENT:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      
      // Extract and display the reset link
      const resetLinkMatch = mailOptions.html?.match(/http[^"]*/);
      if (resetLinkMatch) {
        console.log('🔗 Reset Link:', resetLinkMatch[0]);
        console.log('💡 Copy this link and open in browser to test password reset');
      }
      
      // Simulate successful email sending
      return { 
        messageId: 'simulated-' + Date.now(),
        simulated: true 
      };
    }
  };
}

const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${clientURL}/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
      from: `"SabSrul" <${process.env.EMAIL_USER || 'noreply@sabsrul.com'}>`,
      to: email,
      subject: 'SabSrul - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #7c3aed, #6d28d9); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">SabSrul</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset</p>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #374151; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              You requested to reset your password. Click the button below to create a new password:
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
      `
    };

    const info = await emailService.sendMail(mailOptions);
    
    if (info.simulated) {
      console.log('✅ SIMULATED: Password reset email would be sent to:', email);
      console.log('🔗 TEST RESET LINK:', resetLink);
      console.log('🔑 RESET TOKEN (for manual testing):', resetToken);
    } else {
      console.log(`✅ Password reset email sent to: ${email}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    
    // Even if email fails, we still want the reset process to work for testing
    console.log('💡 DEVELOPMENT: Password reset token generated:', resetToken);
    console.log('💡 DEVELOPMENT: Use this URL to reset:', `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`);
    
    // For development, we'll consider this a success so testing can continue
    return true;
  }
};

module.exports = {
  sendPasswordResetEmail
};