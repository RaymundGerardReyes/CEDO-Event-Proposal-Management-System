/**
 * Comprehensive Email Service Debugging Script
 * Tests all aspects of email configuration and SMTP connectivity
 */

const nodemailer = require('nodemailer');
const path = require('path');

console.log('🔍 COMPREHENSIVE EMAIL SERVICE DEBUGGING');
console.log('=====================================\n');

// Step 1: Check if dotenv is installed and working
console.log('📋 Step 1: Environment Variable Loading');
console.log('--------------------------------------');

try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    console.log('✅ dotenv loaded successfully');
} catch (error) {
    console.error('❌ dotenv loading failed:', error.message);
    process.exit(1);
}

// Step 2: Check environment variables
console.log('\n📋 Step 2: Environment Variables Check');
console.log('--------------------------------------');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const frontendUrl = process.env.FRONTEND_URL;

console.log('EMAIL_USER:', emailUser ? `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1]}` : 'NOT FOUND');
console.log('EMAIL_PASSWORD:', emailPassword ? `${emailPassword.substring(0, 4)}***` : 'NOT FOUND');
console.log('FRONTEND_URL:', frontendUrl || 'NOT FOUND');

if (!emailUser || !emailPassword) {
    console.error('❌ Missing email credentials!');
    console.log('Available environment variables:');
    Object.keys(process.env).filter(key => key.includes('EMAIL')).forEach(key => {
        console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
    });
    process.exit(1);
}

// Step 3: Test Nodemailer configuration
console.log('\n📋 Step 3: Nodemailer Configuration Test');
console.log('----------------------------------------');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPassword,
    },
    debug: true, // Enable debugging
    logger: true // Enable logging
});

console.log('✅ Nodemailer transporter created');

// Step 4: Test SMTP connection
console.log('\n📋 Step 4: SMTP Connection Test');
console.log('-------------------------------');

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP connection failed:', error.message);
        console.error('Error details:', error);

        // Provide specific troubleshooting based on error
        if (error.message.includes('Invalid login')) {
            console.log('\n🔧 TROUBLESHOOTING: Invalid Login');
            console.log('1. Verify your EMAIL_PASSWORD is a Google App Password (16 characters)');
            console.log('2. Make sure 2-Factor Authentication is enabled on your Google account');
            console.log('3. Generate a new App Password from: https://myaccount.google.com/apppasswords');
            console.log('4. Use the App Password, NOT your regular Gmail password');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('\n🔧 TROUBLESHOOTING: Network Error');
            console.log('1. Check your internet connection');
            console.log('2. Verify firewall settings allow SMTP connections');
            console.log('3. Try using a different network');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 TROUBLESHOOTING: Connection Refused');
            console.log('1. Check if Gmail SMTP is blocked by your network');
            console.log('2. Try using a VPN or different network');
        }
    } else {
        console.log('✅ SMTP connection successful!');
        console.log('✅ Email service is properly configured');

        // Step 5: Send test email
        console.log('\n📋 Step 5: Test Email Sending');
        console.log('-----------------------------');

        const mailOptions = {
            from: emailUser,
            to: emailUser, // Send to self for testing
            subject: 'CEDO Email Service Test',
            text: 'This is a test email from CEDO Email Service. If you receive this, the email service is working correctly!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">🎉 CEDO Email Service Test</h2>
                    <p>This is a test email from CEDO Email Service.</p>
                    <p>If you receive this email, the email service is working correctly!</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Configuration Details:</h3>
                        <ul>
                            <li><strong>From:</strong> ${emailUser}</li>
                            <li><strong>Service:</strong> Gmail SMTP</li>
                            <li><strong>Frontend URL:</strong> ${frontendUrl}</li>
                            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                        </ul>
                    </div>
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated test email from the CEDO system.
                    </p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('❌ Test email sending failed:', error.message);
                console.error('Error details:', error);
            } else {
                console.log('✅ Test email sent successfully!');
                console.log('📧 Message ID:', info.messageId);
                console.log('📧 Response:', info.response);
                console.log('\n🎉 EMAIL SERVICE IS FULLY WORKING!');
                console.log('You should receive a test email at:', emailUser);
            }
        });
    }
});

// Step 6: Additional diagnostics
console.log('\n📋 Step 6: System Diagnostics');
console.log('-----------------------------');

console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current working directory:', process.cwd());
console.log('Environment file path:', path.join(__dirname, '.env'));

// Check if .env file exists and is readable
const fs = require('fs');
try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    console.log('✅ .env file is readable');
    console.log('📄 .env file size:', envContent.length, 'characters');

    // Check for common issues in .env file
    if (envContent.includes('EMAIL_PASSWORD=your-16-character-app-password-here')) {
        console.log('⚠️  WARNING: EMAIL_PASSWORD appears to be a placeholder');
    }
    if (envContent.includes('EMAIL_USER=your-email@gmail.com')) {
        console.log('⚠️  WARNING: EMAIL_USER appears to be a placeholder');
    }
} catch (error) {
    console.error('❌ Cannot read .env file:', error.message);
}
