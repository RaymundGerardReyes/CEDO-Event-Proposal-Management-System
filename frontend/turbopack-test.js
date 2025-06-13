#!/usr/bin/env node

/**
 * ✅ Turbopack & Fast Refresh Configuration Validator for Next.js 15.3.2
 * Validates stable Turbopack configuration and Fast Refresh compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Validating Turbopack & Fast Refresh Configuration...\n');

// ✅ Check Next.js version compatibility
try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;

    if (nextVersion) {
        console.log(`✅ Next.js version: ${nextVersion}`);
        // Check if version is 15.0.0 or higher (stable Turbopack)
        const version = nextVersion.replace(/[^\d.]/g, '');
        const [major, minor] = version.split('.').map(Number);

        if (major >= 15) {
            console.log('✅ Next.js 15+ detected - Turbopack stable support confirmed');
        } else {
            console.log('⚠️  Next.js version may not support stable Turbopack');
        }
    }
} catch (error) {
    console.log('❌ Could not read package.json');
}

// ✅ Validate next.config.js structure
if (fs.existsSync('./next.config.js')) {
    console.log('✅ next.config.js found');

    try {
        const config = require('./next.config.js');

        // ✅ Check for correct turbopack configuration (not experimental.turbo)
        if (config.experimental && config.experimental.turbo) {
            console.log('❌ Found deprecated experimental.turbo configuration');
            console.log('   ➜ Move this to top-level turbopack property for Next.js 15+');
        } else {
            console.log('✅ No deprecated experimental.turbo found');
        }

        // ✅ Check for new stable turbopack configuration
        if (config.turbopack) {
            console.log('✅ Found stable turbopack configuration');

            // Check specific Turbopack properties
            if (config.turbopack.resolveAlias) {
                console.log('✅ resolveAlias configured');
            }

            if (config.turbopack.resolveExtensions) {
                console.log('✅ resolveExtensions configured');
            }

            // Note: treeShaking is not a valid Turbopack option in Next.js 15.3.2

            if (config.turbopack.moduleIds) {
                console.log('✅ Module IDs strategy configured');
            }

            // Check for unsupported options
            const unsupportedOptions = ['memoryLimit', 'rules', 'treeShaking'];
            unsupportedOptions.forEach(option => {
                if (config.turbopack[option]) {
                    console.log(`⚠️  Found unsupported option: ${option}`);
                }
            });
        } else {
            console.log('⚠️  No turbopack configuration found - using defaults');
        }

        // ✅ Check Fast Refresh compatibility
        console.log('\n🔄 Fast Refresh Compatibility Checks:');

        // React Strict Mode check
        if (config.reactStrictMode === true) {
            console.log('✅ React Strict Mode enabled - better Fast Refresh experience');
        } else if (config.reactStrictMode === false) {
            console.log('⚠️  React Strict Mode disabled - may affect Fast Refresh reliability');
        }

        // Package optimization check
        if (config.experimental?.optimizePackageImports) {
            console.log('✅ Package imports optimized for Fast Refresh');
        }

        // Server components HMR check
        if (config.experimental?.serverComponentsHmrCache) {
            console.log('✅ Server Components HMR cache enabled');
        }

        // Check for webpack conflicts
        if (typeof config.webpack === 'function') {
            console.log('⚠️  webpack() function found - may conflict with Turbopack');
            console.log('   ➜ Consider removing when using --turbo flag');
        } else {
            console.log('✅ No webpack conflicts detected');
        }

    } catch (error) {
        console.log('❌ Error parsing next.config.js:', error.message);
    }
} else {
    console.log('❌ next.config.js not found');
    process.exit(1);
}

// ✅ Check CSS files for Fast Refresh compatibility
console.log('\n🎨 CSS Configuration Checks:');

if (fs.existsSync('./src/app/globals.css') || fs.existsSync('./styles/globals.css')) {
    console.log('✅ Global CSS file found');
} else {
    console.log('⚠️  No global CSS file found');
}

// Check PostCSS configuration
if (fs.existsSync('./postcss.config.js')) {
    console.log('✅ PostCSS configuration found');

    try {
        const postcssConfig = require('./postcss.config.js');
        if (postcssConfig.plugins?.tailwindcss) {
            console.log('✅ Tailwind CSS configured for Turbopack');
        }
    } catch (error) {
        console.log('⚠️  Could not validate PostCSS configuration');
    }
} else {
    console.log('⚠️  No PostCSS configuration found');
}

// ✅ Test Turbopack commands
console.log('\n🧪 Testing Turbopack Commands:');

try {
    console.log('Testing Next.js info...');
    const info = execSync('npx next info', { encoding: 'utf8', timeout: 10000 });

    if (info.includes('Turbopack')) {
        console.log('✅ Turbopack available in Next.js installation');
    } else {
        console.log('⚠️  Turbopack status unclear in Next.js info');
    }

    // Log the info output for debugging
    console.log('\nNext.js Info Output:');
    console.log(info);
} catch (error) {
    console.log('❌ Error running next info:', error.message);
}

// ✅ Fast Refresh best practices validation
console.log('\n📋 Fast Refresh Best Practices:');

// Check for common Fast Refresh issues
const srcDir = './src';
if (fs.existsSync(srcDir)) {
    console.log('✅ Using src/ directory structure');

    // Check for anonymous arrow functions (Fast Refresh limitation)
    try {
        const checkFiles = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    checkFiles(fullPath);
                } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        if (content.includes('export default () =>')) {
                            console.log(`⚠️  Anonymous arrow function found in ${fullPath}`);
                            console.log('   ➜ Consider using named functions for better Fast Refresh');
                        }
                    } catch (err) {
                        // Skip files that can't be read
                    }
                }
            }
        };

        checkFiles(srcDir);
    } catch (error) {
        console.log('⚠️  Could not scan source files for Fast Refresh compatibility');
    }
}

console.log('\n🎯 Validation Summary:');
console.log('✅ Use `npm run dev` (with --turbo flag) for Turbopack development');
console.log('✅ Use `npm run build` for production builds');
console.log('✅ Fast Refresh should work seamlessly with function components');
console.log('✅ Component state will be preserved during Fast Refresh');

console.log('\n🚀 Turbopack & Fast Refresh validation complete!'); 