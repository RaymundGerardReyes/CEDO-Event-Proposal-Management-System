/**
 * Test Email Notifications for Proposal Approval/Rejection
 * Purpose: Test the new email notification system for proposal status changes
 */

const emailService = require('./services/email.service');

async function testEmailNotifications() {
    console.log('🧪 Testing Email Notifications for Proposal Status Changes...\n');

    try {
        // Initialize email service
        console.log('📋 Step 1: Initializing email service...');
        await emailService.initialize();
        console.log(`✅ Email service initialized: ${emailService.isInitialized ? 'YES' : 'NO'}\n`);

        if (!emailService.isInitialized) {
            console.log('⚠️ Email service not initialized. Please check your EMAIL_USER and EMAIL_PASSWORD environment variables.');
            return;
        }

        // Test data
        const testProposalData = {
            event_name: 'Test Community Event 2024',
            event_start_date: '2024-03-15',
            event_venue: 'Xavier University - Main Campus',
            uuid: 'test-proposal-123',
            contact_person: 'John Doe',
            organization_type: 'School-based'
        };

        const testUserEmail = '20220025162@my.xu.edu.ph';
        const testUserName = 'John Doe';
        const testAdminComments = 'The proposal lacks sufficient detail in the budget breakdown and community impact assessment. Please revise and resubmit with more comprehensive documentation.';

        // Test 1: Proposal Approved Notification
        console.log('📋 Step 2: Testing Proposal Approved Notification...');
        try {
            const approvalResult = await emailService.sendProposalApprovedNotification({
                userEmail: testUserEmail,
                userName: testUserName,
                proposalData: testProposalData
            });

            console.log('✅ Proposal approved email sent successfully!');
            console.log('📧 Message ID:', approvalResult.messageId);
            console.log('📧 Subject: Proposal Approved - CEDO');
            console.log('📧 Recipient:', testUserEmail);
        } catch (error) {
            console.error('❌ Failed to send approval email:', error.message);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 2: Proposal Rejected Notification
        console.log('📋 Step 3: Testing Proposal Rejected Notification...');
        try {
            const rejectionResult = await emailService.sendProposalRejectedNotification({
                userEmail: testUserEmail,
                userName: testUserName,
                proposalData: testProposalData,
                adminComments: testAdminComments
            });

            console.log('✅ Proposal rejected email sent successfully!');
            console.log('📧 Message ID:', rejectionResult.messageId);
            console.log('📧 Subject: Proposal Not Approved - CEDO');
            console.log('📧 Recipient:', testUserEmail);
            console.log('📧 Admin Comments Included:', testAdminComments.substring(0, 50) + '...');
        } catch (error) {
            console.error('❌ Failed to send rejection email:', error.message);
        }

        console.log('\n🎉 Email notification tests completed!');
        console.log('📧 Check your email inbox for the test notifications.');
        console.log('📧 You should receive 2 emails:');
        console.log('   - ✅ Proposal Approved notification');
        console.log('   - ❌ Proposal Not Approved notification');

    } catch (error) {
        console.error('❌ Email notification test failed:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testEmailNotifications()
        .then(() => {
            console.log('\n✅ Email notification test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Email notification test failed:', error);
            process.exit(1);
        });
}

module.exports = testEmailNotifications;

