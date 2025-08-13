// File: verify-turbopack.js
// Purpose: Verification script to check if Turbopack starts without deprecation warnings.
// Key approaches: Process monitoring, output analysis, and warning detection.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Turbopack Configuration...\n');

// Start the development server with Turbopack
const devProcess = spawn('npm', ['run', 'dev:turbo'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true
});

let output = '';
let hasDeprecationWarning = false;
let hasStarted = false;

// Monitor stdout
devProcess.stdout.on('data', (data) => {
    const outputChunk = data.toString();
    output += outputChunk;

    // Check for deprecation warnings
    if (outputChunk.includes('experimental.turbo') && outputChunk.includes('deprecated')) {
        hasDeprecationWarning = true;
        console.log('❌ Deprecation warning detected!');
    }

    // Check if server started successfully
    if (outputChunk.includes('Ready in') || outputChunk.includes('Local:')) {
        hasStarted = true;
        console.log('✅ Development server started successfully');
    }

    // Check for Turbopack-specific messages
    if (outputChunk.includes('Turbopack')) {
        console.log('✅ Turbopack detected in output');
    }
});

// Monitor stderr
devProcess.stderr.on('data', (data) => {
    const errorChunk = data.toString();
    output += errorChunk;

    // Check for deprecation warnings in stderr
    if (errorChunk.includes('experimental.turbo') && errorChunk.includes('deprecated')) {
        hasDeprecationWarning = true;
        console.log('❌ Deprecation warning detected in stderr!');
    }
});

// Handle process exit
devProcess.on('close', (code) => {
    console.log(`\n📊 Verification Results:`);
    console.log(`- Process exited with code: ${code}`);
    console.log(`- Deprecation warnings: ${hasDeprecationWarning ? '❌ Found' : '✅ None'}`);
    console.log(`- Server started: ${hasStarted ? '✅ Yes' : '❌ No'}`);

    if (!hasDeprecationWarning && hasStarted) {
        console.log('\n🎉 SUCCESS: Turbopack configuration is working correctly!');
        console.log('   No deprecation warnings detected.');
    } else if (hasDeprecationWarning) {
        console.log('\n⚠️  ISSUE: Deprecation warnings still present.');
        console.log('   Please check the configuration.');
    } else {
        console.log('\n⚠️  ISSUE: Server may not have started properly.');
    }

    process.exit(hasDeprecationWarning ? 1 : 0);
});

// Set a timeout to kill the process after 30 seconds
setTimeout(() => {
    console.log('\n⏰ Timeout reached, stopping verification...');
    devProcess.kill();
}, 30000);

console.log('⏳ Starting Turbopack development server...');
console.log('   (This will run for 30 seconds to check for warnings)'); 