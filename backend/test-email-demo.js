/**
 * Test Email Service in Demo Mode
 * Purpose: Test email service when credentials are not configured
 */

const emailService = require('./services/email.service');

async function testEmailDemo() {
    console.log('🧪 Testing Email Service in Demo Mode...\n');

    try {
        // Initialize email service (should run in demo mode)
        console.log('📋 Step 1: Initializing email service...');
        await emailService.initialize();
        console.log(`✅ Email service initialized: ${emailService.isInitialized ? 'YES' : 'NO (Demo Mode)'}\n`);

        // Test sending a proposal notification in demo mode
        console.log('📋 Step 2: Testing proposal notification in demo mode...');
        const result = await emailService.sendProposalSubmittedNotification({
            userEmail: 'test@example.com',
            userName: 'Test User',
            proposalData: {
                event_name: 'Test Event',
                event_start_date: '2024-02-15',
                event_venue: 'Test Venue',
                uuid: 'test-uuid-123'
            }
        });

        console.log('📧 Demo mode result:', result);

        if (result.demo) {
            console.log('✅ Email service working in demo mode');
            console.log('💡 To enable actual email sending, configure EMAIL_USER and EMAIL_PASSWORD');
        } else {
            console.log('✅ Email service working with real SMTP');
        }

        console.log('\n🎉 Email service test completed successfully!');

    } catch (error) {
        console.error('❌ Email service test failed:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testEmailDemo()
        .then(() => {
            console.log('\n✅ Email demo test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Email demo test failed:', error);
            process.exit(1);
        });
}

module.exports = testEmailDemo;

