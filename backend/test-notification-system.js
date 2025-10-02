/**
 * Test Complete Notification System
 * Purpose: Test the entire notification flow from proposal action to user notification
 */

const emailService = require('./services/email.service');
const notificationService = require('./services/notification.service');

async function testNotificationSystem() {
    console.log('🧪 Testing Complete Notification System...\n');

    try {
        // Initialize services
        console.log('📋 Step 1: Initializing services...');
        await emailService.initialize();
        console.log(`✅ Email service initialized: ${emailService.isInitialized ? 'YES' : 'NO'}`);
        console.log(`✅ Notification service initialized: ${notificationService.isInitialized ? 'YES' : 'NO'}\n`);

        // Test data
        const testProposalData = {
            event_name: 'Test Community Event 2024',
            event_start_date: '2024-03-15',
            event_venue: 'Xavier University - Main Campus',
            contact_person: 'John Doe',
            organization_type: 'School-based'
        };

        const testUserId = 1; // Assuming user ID 1 exists
        const testProposalId = 1;
        const testProposalUuid = 'test-proposal-uuid-123';
        const testAdminId = 1; // Assuming admin ID 1 exists

        // Test 1: Create Proposal Submitted Notification
        console.log('📋 Step 2: Testing Proposal Submitted Notification...');
        try {
            const submittedNotification = await notificationService.createProposalSubmittedNotification({
                proposalId: testProposalId,
                proposalUuid: testProposalUuid,
                recipientId: testUserId,
                proposalData: testProposalData,
                senderId: testAdminId
            });

            console.log('✅ Proposal submitted notification created!');
            console.log('📧 Notification ID:', submittedNotification.id);
            console.log('📧 Message:', submittedNotification.message);
        } catch (error) {
            console.error('❌ Failed to create submitted notification:', error.message);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 2: Create Proposal Approved Notification
        console.log('📋 Step 3: Testing Proposal Approved Notification...');
        try {
            const approvedNotification = await notificationService.createProposalApprovedNotification({
                proposalId: testProposalId,
                proposalUuid: testProposalUuid,
                recipientId: testUserId,
                proposalData: testProposalData,
                senderId: testAdminId
            });

            console.log('✅ Proposal approved notification created!');
            console.log('📧 Notification ID:', approvedNotification.id);
            console.log('📧 Message:', approvedNotification.message);
        } catch (error) {
            console.error('❌ Failed to create approved notification:', error.message);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 3: Create Proposal Rejected Notification
        console.log('📋 Step 4: Testing Proposal Rejected Notification...');
        try {
            const adminComments = 'The proposal lacks sufficient detail in the budget breakdown and community impact assessment. Please revise and resubmit with more comprehensive documentation.';

            const rejectedNotification = await notificationService.createProposalRejectedNotification({
                proposalId: testProposalId,
                proposalUuid: testProposalUuid,
                recipientId: testUserId,
                proposalData: testProposalData,
                adminComments,
                senderId: testAdminId
            });

            console.log('✅ Proposal rejected notification created!');
            console.log('📧 Notification ID:', rejectedNotification.id);
            console.log('📧 Message:', rejectedNotification.message);
            console.log('📧 Admin Comments:', adminComments);
        } catch (error) {
            console.error('❌ Failed to create rejected notification:', error.message);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 4: Test Email Notifications
        console.log('📋 Step 5: Testing Email Notifications...');
        try {
            // Test approval email
            const approvalEmailResult = await emailService.sendProposalApprovedNotification({
                userEmail: '20220025162@my.xu.edu.ph',
                userName: 'John Doe',
                proposalData: testProposalData
            });

            console.log('✅ Approval email sent successfully!');
            console.log('📧 Message ID:', approvalEmailResult.messageId);

            // Test rejection email
            const rejectionEmailResult = await emailService.sendProposalRejectedNotification({
                userEmail: '20220025162@my.xu.edu.ph',
                userName: 'John Doe',
                proposalData: testProposalData,
                adminComments: 'The proposal lacks sufficient detail in the budget breakdown.'
            });

            console.log('✅ Rejection email sent successfully!');
            console.log('📧 Message ID:', rejectionEmailResult.messageId);
        } catch (error) {
            console.error('❌ Failed to send email notifications:', error.message);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 5: Test Notification Retrieval
        console.log('📋 Step 6: Testing Notification Retrieval...');
        try {
            const userNotifications = await notificationService.getUserNotifications({
                userId: testUserId,
                page: 1,
                limit: 10
            });

            console.log('✅ User notifications retrieved successfully!');
            console.log('📧 Total notifications:', userNotifications.pagination.total);
            console.log('📧 Notifications:', userNotifications.notifications.length);

            // Display notification details
            userNotifications.notifications.forEach((notification, index) => {
                console.log(`   ${index + 1}. ${notification.type}: ${notification.message.substring(0, 50)}...`);
            });
        } catch (error) {
            console.error('❌ Failed to retrieve notifications:', error.message);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 6: Test Unread Count
        console.log('📋 Step 7: Testing Unread Count...');
        try {
            const unreadCount = await notificationService.getUnreadCount(testUserId);
            console.log('✅ Unread count retrieved successfully!');
            console.log('📧 Unread notifications:', unreadCount);
        } catch (error) {
            console.error('❌ Failed to get unread count:', error.message);
        }

        console.log('\n🎉 Complete notification system test completed!');
        console.log('📧 Check your email inbox for the test notifications.');
        console.log('📧 Check the database for notification records.');
        console.log('📧 Test the frontend notifications page to see real data.');

    } catch (error) {
        console.error('❌ Notification system test failed:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testNotificationSystem()
        .then(() => {
            console.log('\n✅ Notification system test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Notification system test failed:', error);
            process.exit(1);
        });
}

module.exports = testNotificationSystem;
