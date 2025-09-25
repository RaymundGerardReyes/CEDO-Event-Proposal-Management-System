/**
 * Get authentication token for a student user
 */

const BASE_URL = 'http://localhost:5000';

async function getStudentToken() {
    try {
        console.log('🔑 Getting Student Authentication Token...');

        // Try to login with a student user
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'raymundgerardrestaca@gmail.com', // Student user from the database
                password: 'password123' // Default password
            })
        });

        if (!loginResponse.ok) {
            // If login fails, try with another student
            const loginResponse2 = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: 'student@xu.edu.ph', // Demo student user
                    password: 'password123'
                })
            });

            if (!loginResponse2.ok) {
                throw new Error(`Student login failed: ${loginResponse2.status} ${loginResponse2.statusText}`);
            }

            const data = await loginResponse2.json();
            console.log('✅ Student login successful!');
            console.log('📊 Student Data:', {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role
            });
            console.log('🔑 Token:', data.token);
            return data.token;
        }

        const data = await loginResponse.json();
        console.log('✅ Student login successful!');
        console.log('📊 Student Data:', {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role
        });
        console.log('🔑 Token:', data.token);
        return data.token;

    } catch (error) {
        console.error('❌ Error getting student token:', error.message);
        return null;
    }
}

getStudentToken();


