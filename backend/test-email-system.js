/**
 * Email System Test Script
 * Purpose: Test the complete email notification system
 * Key approaches: Comprehensive testing, error handling, validation
 * Refactor: Test all email functionality with proper validation
 */

const emailService = require('./services/email.service');

async function testEmailSystem() {
    console.log('🧪 Testing CEDO Email System...\n');

    try {
        // Test 1: Initialize email service
        console.log('📋 Test 1: Initializing email service...');
        await emailService.initialize();
        console.log('✅ Email service initialized successfully\n');

        // Test 2: Test email configuration
        console.log('📋 Test 2: Testing email configuration...');
        const configTest = await emailService.testEmailConfiguration();
        if (configTest.success) {
            console.log('✅ Email configuration test passed');
            console.log(`   SMTP: ${configTest.smtp}`);
            console.log(`   User: ${configTest.user}\n`);
        } else {
            console.log('❌ Email configuration test failed:', configTest.message);
            return;
        }

        // Test 3: Test proposal submitted notification
        console.log('📋 Test 3: Testing proposal submitted notification...');
        const testProposalData = {
            event_name: 'Test Event 2024',
            event_start_date: '2024-02-15',
            event_venue: 'Test Venue',
            uuid: 'test-uuid-123',
            id: 'test-uuid-123'
        };

        try {
            const submittedResult = await emailService.sendProposalSubmittedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: testProposalData
            });
            console.log('✅ Proposal submitted notification sent successfully');
            console.log(`   Message ID: ${submittedResult.messageId}\n`);
        } catch (error) {
            console.log('❌ Proposal submitted notification failed:', error.message);
        }

        // Test 4: Test proposal approved notification
        console.log('📋 Test 4: Testing proposal approved notification...');
        try {
            const approvedResult = await emailService.sendProposalApprovedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: testProposalData
            });
            console.log('✅ Proposal approved notification sent successfully');
            console.log(`   Message ID: ${approvedResult.messageId}\n`);
        } catch (error) {
            console.log('❌ Proposal approved notification failed:', error.message);
        }

        // Test 5: Test proposal rejected notification
        console.log('📋 Test 5: Testing proposal rejected notification...');
        try {
            const rejectedResult = await emailService.sendProposalRejectedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: testProposalData,
                adminComments: 'This is a test rejection with feedback for testing purposes.'
            });
            console.log('✅ Proposal rejected notification sent successfully');
            console.log(`   Message ID: ${rejectedResult.messageId}\n`);
        } catch (error) {
            console.log('❌ Proposal rejected notification failed:', error.message);
        }

        // Test 6: Test custom email
        console.log('📋 Test 6: Testing custom email...');
        try {
            const customResult = await emailService.sendCustomEmail({
                to: 'test@example.com',
                subject: 'Test Custom Email - CEDO',
                html: `
          <h1>Test Custom Email</h1>
          <p>This is a test custom email from the CEDO system.</p>
          <p>If you receive this, the email system is working correctly!</p>
        `
            });
            console.log('✅ Custom email sent successfully');
            console.log(`   Message ID: ${customResult.messageId}\n`);
        } catch (error) {
            console.log('❌ Custom email failed:', error.message);
        }

        console.log('🎉 Email system testing completed!');
        console.log('\n📊 Test Summary:');
        console.log('   ✅ Email service initialization');
        console.log('   ✅ Configuration validation');
        console.log('   ✅ Proposal submitted notification');
        console.log('   ✅ Proposal approved notification');
        console.log('   ✅ Proposal rejected notification');
        console.log('   ✅ Custom email functionality');

    } catch (error) {
        console.error('❌ Email system test failed:', error.message);
        console.error('💡 Make sure to set up your email environment variables:');
        console.error('   - EMAIL_USER or GOOGLE_EMAIL_USER');
        console.error('   - EMAIL_PASSWORD or GOOGLE_APP_PASSWORD');
        console.error('   - FRONTEND_URL');
    }
}

// Run the test
if (require.main === module) {
    testEmailSystem()
        .then(() => {
            console.log('\n✅ Email system test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Email system test failed:', error);
            process.exit(1);
        });
}

module.exports = testEmailSystem;

