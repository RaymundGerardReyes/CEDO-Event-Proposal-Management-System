#!/usr/bin/env node

/**
 * Test Organization Type Field Implementation
 * 
 * Tests the complete flow from frontend form to database
 */

const fetch = require('node-fetch');

async function testOrganizationTypeField() {
    console.log('🧪 Testing Organization Type Field Implementation...\n');

    try {
        // Test 1: Create a student user with organization_type
        console.log('📝 Test 1: Creating student user with organization_type');

        const studentData = {
            name: "Test Student User",
            email: "teststudent@example.com",
            role: "student",
            organization: "Test University",
            organization_type: "school-based"
        };

        const response1 = await fetch('http://localhost:5000/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(studentData)
        });

        console.log('📡 Response status:', response1.status);
        const responseText1 = await response1.text();
        console.log('📡 Response body:', responseText1);

        // Test 2: Create a manager user without organization_type
        console.log('\n📝 Test 2: Creating manager user without organization_type');

        const managerData = {
            name: "Test Manager User",
            email: "testmanager@example.com",
            role: "manager",
            organization: "Test Organization"
            // No organization_type field
        };

        const response2 = await fetch('http://localhost:5000/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(managerData)
        });

        console.log('📡 Response status:', response2.status);
        const responseText2 = await response2.text();
        console.log('📡 Response body:', responseText2);

        // Test 3: Verify database has the correct data
        console.log('\n📝 Test 3: Verifying database data');
        try {
            const { query } = require('./config/database-postgresql-only');

            // Check student user
            const studentResult = await query(
                'SELECT name, role, organization_type FROM users WHERE email = $1',
                ['teststudent@example.com']
            );

            if (studentResult.rows.length > 0) {
                const student = studentResult.rows[0];
                console.log('✅ Student user found:', {
                    name: student.name,
                    role: student.role,
                    organization_type: student.organization_type
                });

                if (student.organization_type === 'school-based') {
                    console.log('✅ Organization type correctly saved to database!');
                } else {
                    console.log('❌ Organization type not saved correctly');
                }
            } else {
                console.log('❌ Student user not found in database');
            }

            // Check manager user
            const managerResult = await query(
                'SELECT name, role, organization_type FROM users WHERE email = $1',
                ['testmanager@example.com']
            );

            if (managerResult.rows.length > 0) {
                const manager = managerResult.rows[0];
                console.log('✅ Manager user found:', {
                    name: manager.name,
                    role: manager.role,
                    organization_type: manager.organization_type
                });

                if (manager.organization_type === null) {
                    console.log('✅ Organization type correctly null for manager!');
                } else {
                    console.log('❌ Organization type should be null for manager');
                }
            } else {
                console.log('❌ Manager user not found in database');
            }

        } catch (dbError) {
            console.error('❌ Database error:', dbError.message);
        }

        console.log('\n✅ Organization Type Field test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testOrganizationTypeField().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testOrganizationTypeField };




