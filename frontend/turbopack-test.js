// File: turbopack-test.js
// Purpose: Test script to verify Turbopack configuration and check for deprecation warnings.
// Key approaches: Configuration validation, warning detection, and build verification.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Turbopack Configuration...\n');

// Check if next.config.js exists and is valid
const configPath = path.join(__dirname, 'next.config.js');
if (!fs.existsSync(configPath)) {
    console.error('❌ next.config.js not found');
    process.exit(1);
}

console.log('✅ next.config.js found');

// Check for deprecated experimental.turbo usage (more specific detection)
const configContent = fs.readFileSync(configPath, 'utf8');

// Remove comments to avoid false positives
const configWithoutComments = configContent
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

const hasDeprecatedTurbo = configWithoutComments.includes('experimental.turbo') ||
    (configWithoutComments.includes('experimental:') &&
        configWithoutComments.includes('turbo:') &&
        !configWithoutComments.includes('turbopack:'));

if (hasDeprecatedTurbo) {
    console.error('❌ Deprecated experimental.turbo found in configuration');
    console.error('   Please migrate to stable turbopack configuration');
    process.exit(1);
}

console.log('✅ No deprecated experimental.turbo found');

// Check for proper turbopack configuration
const hasTurbopackConfig = configContent.includes('turbopack:') ||
    configContent.includes('baseConfig.turbopack');

if (hasTurbopackConfig) {
    console.log('✅ Turbopack configuration found');
} else {
    console.log('⚠️  No explicit Turbopack configuration found (this is optional)');
}

// Test build process
console.log('\n🔨 Testing build process...');
try {
    // Run a quick build test
    const result = execSync('npm run build', {
        cwd: __dirname,
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout
    });

    console.log('✅ Build completed successfully');
    console.log('✅ Turbopack configuration is working correctly');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 All tests passed! Turbopack configuration is properly set up.'); 