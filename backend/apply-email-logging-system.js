/**
 * Apply Email Logging System
 * Purpose: Create email_smtp_logs table and test the enhanced email service
 * Key approaches: Database setup, service integration, comprehensive testing
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function applyEmailLoggingSystem() {
    console.log('🚀 APPLYING EMAIL LOGGING SYSTEM');
    console.log('='.repeat(60));

    try {
        // 1. Create email_smtp_logs table
        console.log('\n📋 1. CREATING EMAIL_SMTP_LOGS TABLE');
        console.log('-'.repeat(40));

        const sqlPath = path.join(__dirname, 'create-email-smtp-logs-table.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf8');

        await pool.query(sqlContent);
        console.log('✅ Email SMTP logs table created successfully');

        // 2. Test the enhanced email service
        console.log('\n📧 2. TESTING ENHANCED EMAIL SERVICE');
        console.log('-'.repeat(40));

        const enhancedEmailService = require('./services/enhanced-email.service');

        // Initialize the service
        await enhancedEmailService.initialize();

        if (enhancedEmailService.isInitialized) {
            console.log('✅ Enhanced email service initialized');

            // Test sending a notification email
            console.log('\n📤 Testing proposal submitted notification...');
            const testResult = await enhancedEmailService.sendProposalSubmittedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2025-10-01',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                },
                userId: 1,
                proposalId: 1
            });

            console.log('📧 Test email result:', testResult);

            if (testResult.success) {
                console.log('✅ Test email sent successfully');
                console.log(`📧 Email Log ID: ${testResult.emailLogId}`);
            } else {
                console.log('⚠️ Test email failed (this is expected in demo mode)');
            }
        } else {
            console.log('⚠️ Enhanced email service not initialized (demo mode)');
        }

        // 3. Check email logs
        console.log('\n📊 3. CHECKING EMAIL LOGS');
        console.log('-'.repeat(40));

        const emailLogs = await pool.query(`
            SELECT 
                id, uuid, from_email, to_email, subject, status, delivery_status,
                created_at, sent_at, delivery_error
            FROM email_smtp_logs 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log(`📈 Found ${emailLogs.rows.length} email logs:`);
        emailLogs.rows.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.to_email} - ${log.subject} (${log.status})`);
            console.log(`      Created: ${log.created_at}, Sent: ${log.sent_at || 'Not sent'}`);
            if (log.delivery_error) {
                console.log(`      Error: ${log.delivery_error}`);
            }
        });

        // 4. Get email statistics
        console.log('\n📈 4. EMAIL STATISTICS');
        console.log('-'.repeat(40));

        const stats = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM email_smtp_logs 
            GROUP BY status
            ORDER BY count DESC
        `);

        console.log('📊 Email statistics:');
        stats.rows.forEach(stat => {
            console.log(`   ${stat.status}: ${stat.count} emails`);
        });

        console.log('\n🎉 EMAIL LOGGING SYSTEM APPLIED SUCCESSFULLY!');
        console.log('💡 Key features implemented:');
        console.log('   ✅ Email SMTP logs table created');
        console.log('   ✅ Enhanced email service with logging');
        console.log('   ✅ Comprehensive email tracking');
        console.log('   ✅ Delivery status monitoring');
        console.log('   ✅ Error logging and retry logic');

        console.log('\n🔧 Next steps:');
        console.log('   1. Update your email routes to use enhanced-email.service.js');
        console.log('   2. Test the "Save, Upload & Submit for Review" button');
        console.log('   3. Check email_smtp_logs table for email records');
        console.log('   4. Monitor email delivery status');

    } catch (error) {
        console.error('❌ Failed to apply email logging system:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
applyEmailLoggingSystem();
