/**
 * Install Missing Dependencies for Gmail SMTP
 * Based on latest 2024 recommendations
 */

const { execSync } = require('child_process');

console.log('📦 Installing Missing Dependencies for Gmail SMTP...\n');

const dependencies = [
    // Core email dependencies
    'nodemailer@^6.9.18', // Already have, but ensure latest
    'dotenv@^16.5.1',     // Already have, but ensure latest

    // Gmail-specific dependencies
    'googleapis@^144.0.0',        // Google APIs client for OAuth2
    'google-auth-library@^9.0.0',  // Google Auth Library (you have ^10.2.0)

    // Email template and formatting
    'handlebars@^4.7.8',          // Email template engine
    'mjml@^4.15.3',              // Responsive email templates
    'mjml-react@^4.15.3',        // React components for MJML

    // Email validation and processing
    'email-validator@^2.0.0',     // Email address validation
    'validator@^13.11.0',         // General validation

    // SMTP connection and retry logic
    'smtp-connection@^4.0.0',    // Low-level SMTP connection
    'retry@^0.13.1',             // Retry logic for failed emails

    // Email queue and processing
    'bull@^4.12.2',              // Redis-based job queue
    'bullmq@^5.0.0',             // Modern Redis queue
    'ioredis@^5.6.1',            // Redis client (you have this)

    // Email attachments and processing
    'multer@^2.0.2',             // File upload handling (you have this)
    'sharp@^0.33.0',             // Image processing for attachments
    'pdf-lib@^1.17.1',           // PDF processing

    // Email security and encryption
    'crypto@^1.0.1',             // Built-in crypto (already available)
    'helmet@^7.0.0',             // Security headers (you have this)

    // Email monitoring and logging
    'winston@^3.17.0',           // Logging (you have this)
    'winston-daily-rotate-file@^4.7.1', // Log rotation

    // Email testing and mocking
    'nodemailer-mock@^1.3.0',    // Mock nodemailer for testing
    'maildev@^2.0.5',            // Local SMTP server for testing
];

console.log('Installing core Gmail SMTP dependencies...\n');

try {
    // Install core dependencies
    const coreDeps = [
        'googleapis@^144.0.0',
        'handlebars@^4.7.8',
        'email-validator@^2.0.0',
        'validator@^13.11.0',
        'retry@^0.13.1',
        'bull@^4.12.2',
        'sharp@^0.33.0',
        'winston-daily-rotate-file@^4.7.1'
    ];

    console.log('Installing:', coreDeps.join(', '));
    execSync(`npm install ${coreDeps.join(' ')}`, { stdio: 'inherit' });

    console.log('\n✅ Core dependencies installed successfully!');
    console.log('\n📋 Optional dependencies for advanced features:');
    console.log('- mjml@^4.15.3 (responsive email templates)');
    console.log('- bullmq@^5.0.0 (modern job queue)');
    console.log('- pdf-lib@^1.17.1 (PDF processing)');
    console.log('- nodemailer-mock@^1.3.0 (testing)');
    console.log('- maildev@^2.0.5 (local SMTP testing)');

} catch (error) {
    console.error('❌ Installation failed:', error.message);
    console.log('\n🔧 Manual installation commands:');
    console.log('npm install googleapis handlebars email-validator validator retry bull sharp winston-daily-rotate-file');
}
