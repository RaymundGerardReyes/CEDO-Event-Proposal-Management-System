// backend/test-google-timing.js
require('dotenv').config();

console.log('🔍 Google Token Timing Test');
console.log('============================');

// Test the token timing analysis
function analyzeTokenTiming(token) {
    try {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = currentTime - decodedToken.iat;

        console.log('Token timing analysis:', {
            currentTime,
            tokenIssued: decodedToken.iat,
            tokenNotBefore: decodedToken.nbf,
            tokenExpires: decodedToken.exp,
            timeDiff: `${timeDiff} seconds`,
            isEarly: currentTime < decodedToken.nbf,
            isLate: currentTime > decodedToken.exp,
            email: decodedToken.email,
            name: decodedToken.name
        });

        return {
            isEarly: currentTime < decodedToken.nbf,
            isLate: currentTime > decodedToken.exp,
            waitTime: Math.max(0, decodedToken.nbf - currentTime)
        };
    } catch (error) {
        console.error('Failed to decode token:', error.message);
        return null;
    }
}

// Test with a sample token (you can replace this with an actual token)
const sampleToken = process.argv[2];
if (sampleToken) {
    console.log('\n📋 Analyzing provided token...');
    const analysis = analyzeTokenTiming(sampleToken);

    if (analysis) {
        if (analysis.isEarly) {
            console.log(`⚠️  Token is too early. Would need to wait ${analysis.waitTime} seconds.`);
        } else if (analysis.isLate) {
            console.log('❌ Token has expired.');
        } else {
            console.log('✅ Token timing looks good.');
        }
    }
} else {
    console.log('\n📋 No token provided. Use: node test-google-timing.js <token>');
    console.log('This will analyze the timing of a Google ID token.');
}

console.log('\n🕐 Current server time:', new Date().toISOString());
console.log('============================\n'); 