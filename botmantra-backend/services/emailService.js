/**
 * Email Service - Send password reset emails
 * Integrates with popular email providers
 */

const nodemailer = require('nodemailer');

// Configuration for email service
const emailConfig = {
  // Using development email (replace with your email provider)
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  from: process.env.EMAIL_FROM || 'jitendra@mantravat.com'
};

// Create transporter
let transporter = null;

function initializeEmailService() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email service not configured. Using console logging instead.');
    return null;
  }
  
  try {
    transporter = nodemailer.createTransport(emailConfig);
    console.log('✅ Email service initialized');
    return transporter;
  } catch (error) {
    console.warn('⚠️  Failed to initialize email:', error.message);
    return null;
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetCode - OTP code
 * @param {string} resetLink - Reset link (optional)
 */
async function sendPasswordResetEmail(email, resetCode, resetLink = null) {
  try {
    const transport = transporter || initializeEmailService();
    
    // Generate reset link
    const frontendUrl = process.env.REACT_APP_URL || 'http://localhost:3000';
    const fullResetLink = resetLink || `${frontendUrl}/#/reset-password?email=${email}&code=${resetCode}`;
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: #f0f0f0; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; font-size: 18px; font-weight: bold; letter-spacing: 2px; font-family: monospace; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>We received a request to reset your password for your Yuvaan account.</p>
            
            <h3>Reset Code:</h3>
            <div class="code-box">${resetCode}</div>
            
            <p>This code will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
            
            <p>Or click the button below to reset your password directly:</p>
            <center>
                <a href="${fullResetLink}" class="button">Reset Password</a>
            </center>
            
            <div class="warning">
                <strong>⚠️ Security Note:</strong> Never share this code with anyone. We will never ask for this code via email or phone.
            </div>
            
            <p>If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px;">${fullResetLink}</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p>Best regards,<br><strong>Yuvaan Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2026 Yuvaan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Send email
    if (transport) {
      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: '🔐 Your Password Reset Code - Yuvaan',
        html: emailContent
      };
      
      const result = await transport.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      return { success: true, messageId: result.messageId };
    } else {
      // Fallback: log to console for development
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║  📧 PASSWORD RESET EMAIL (DEVELOPMENT MODE)          ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log(`To: ${email}`);
      console.log(`Subject: 🔐 Your Password Reset Code - Yuvaan`);
      console.log(`\nReset Code: ${resetCode}`);
      console.log(`Reset Link: ${fullResetLink}`);
      console.log('Code expires in: 1 hour\n');
      return { success: true, sentViaConsole: true };
    }
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 */
async function sendOtpEmail(email, otp) {
  try {
    const transport = transporter || initializeEmailService();
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: #f0f0f0; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; font-family: monospace; text-align: center; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your OTP Code</h1>
        </div>
        <div class="content">
            <p>Hi there,</p>
            <p>Your One-Time Password (OTP) for verification is:</p>
            
            <div class="code-box">${otp}</div>
            
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p>Best regards,<br><strong>Yuvaan Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2026 Yuvaan. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
    
    if (transport) {
      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: '🔐 Your OTP Code - Yuvaan',
        html: emailContent
      };
      
      const result = await transport.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}`);
      return { success: true, messageId: result.messageId };
    } else {
      console.log(`📧 OTP for ${email}: ${otp}`);
      return { success: true, sentViaConsole: true };
    }
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeEmailService,
  sendPasswordResetEmail,
  sendOtpEmail
};
