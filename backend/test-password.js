const bcrypt = require('bcryptjs');

// Test password hashing functionality
async function testPasswordHashing() {
    console.log('Testing password hashing functionality...\n');

    const testPassword = 'TempPass123!@#$%';
    console.log('Original password:', testPassword);

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    console.log('Hashed password:', hashedPassword);
    console.log('Hash length:', hashedPassword.length);

    // Verify the password
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Password verification result:', isValid);

    // Test with wrong password
    const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log('Wrong password verification result:', isInvalid);

    console.log('\n✅ Password hashing test completed successfully!');
}

testPasswordHashing().catch(console.error); 