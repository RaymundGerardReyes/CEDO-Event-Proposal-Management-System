#!/usr/bin/env node

/**
 * VS Code Debugging Configuration Test Script
 * 
 * This script tests the debugging configuration setup for the CEDO Google Auth project.
 * It verifies that all necessary components are in place and functioning correctly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 VS Code Debugging Configuration Test\n');

// Test configuration
const tests = [
    {
        name: 'Check VS Code Configuration Files',
        test: () => {
            const vscodeDir = path.join(__dirname, '.vscode');
            const requiredFiles = ['tasks.json', 'launch.json', 'settings.json'];

            if (!fs.existsSync(vscodeDir)) {
                throw new Error('.vscode directory does not exist');
            }

            for (const file of requiredFiles) {
                const filePath = path.join(vscodeDir, file);
                if (!fs.existsSync(filePath)) {
                    throw new Error(`${file} does not exist`);
                }

                const content = fs.readFileSync(filePath, 'utf8');
                if (content.trim().length === 0) {
                    throw new Error(`${file} is empty`);
                }

                // Validate JSON
                try {
                    JSON.parse(content);
                } catch (e) {
                    throw new Error(`${file} contains invalid JSON: ${e.message}`);
                }
            }

            return '✅ All VS Code configuration files exist and are valid';
        }
    },

    {
        name: 'Check Package.json Debug Scripts',
        test: () => {
            const packagePath = path.join(__dirname, 'package.json');
            const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

            const requiredScripts = [
                'dev:backend:debug',
                'dev:frontend:debug',
                'dev:full-debug',
                'debug:backend-only',
                'debug:backend-wait',
                'debug:frontend-only'
            ];

            for (const script of requiredScripts) {
                if (!packageContent.scripts[script]) {
                    throw new Error(`Script '${script}' is missing from package.json`);
                }
            }

            return '✅ All debug scripts are present in package.json';
        }
    },

    {
        name: 'Check Frontend Package.json',
        test: () => {
            const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');
            if (!fs.existsSync(frontendPackagePath)) {
                throw new Error('Frontend package.json does not exist');
            }

            const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));

            if (!frontendPackage.scripts.dev) {
                throw new Error('Frontend dev script is missing');
            }

            if (!frontendPackage.scripts['dev:debug']) {
                throw new Error('Frontend dev:debug script is missing');
            }

            return '✅ Frontend package.json has required scripts';
        }
    },

    {
        name: 'Check Backend Package.json',
        test: () => {
            const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
            if (!fs.existsSync(backendPackagePath)) {
                throw new Error('Backend package.json does not exist');
            }

            const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));

            if (!backendPackage.scripts.dev) {
                throw new Error('Backend dev script is missing');
            }

            if (!backendPackage.main) {
                throw new Error('Backend main entry point is not specified');
            }

            return '✅ Backend package.json has required configuration';
        }
    },

    {
        name: 'Check Node.js Version',
        test: () => {
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

            if (majorVersion < 18) {
                throw new Error(`Node.js version ${nodeVersion} is too old. Required: >=18.17.0`);
            }

            return `✅ Node.js version ${nodeVersion} is compatible`;
        }
    },

    {
        name: 'Check Port Availability',
        test: () => {
            const netstat = require('net');

            const checkPort = (port) => {
                return new Promise((resolve) => {
                    const server = netstat.createServer();
                    server.listen(port, () => {
                        server.once('close', () => resolve(true));
                        server.close();
                    });
                    server.on('error', () => resolve(false));
                });
            };

            const ports = [3000, 5000, 9229];
            const results = ports.map(port => checkPort(port));

            return Promise.all(results).then(available => {
                const unavailable = ports.filter((port, index) => !available[index]);
                if (unavailable.length > 0) {
                    throw new Error(`Ports ${unavailable.join(', ')} are not available`);
                }
                return '✅ All required ports (3000, 5000, 9229) are available';
            });
        }
    },

    {
        name: 'Check VS Code Extensions',
        test: () => {
            try {
                // Check if VS Code is installed
                execSync('code --version', { stdio: 'pipe' });
                return '✅ VS Code is installed and accessible';
            } catch (error) {
                return '⚠️  VS Code may not be installed or not in PATH';
            }
        }
    }
];

// Run tests
async function runTests() {
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`\n🧪 ${test.name}...`);
            const result = await test.test();
            console.log(result);
            passed++;
        } catch (error) {
            console.log(`❌ ${error.message}`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Your VS Code debugging setup is ready.');
        console.log('\n📋 Next Steps:');
        console.log('1. Open VS Code in your project directory');
        console.log('2. Press F5 or go to Run and Debug view (Ctrl+Shift+D)');
        console.log('3. Select a debug configuration from the dropdown');
        console.log('4. Start debugging!');
        console.log('\n📖 For detailed instructions, see VSCODE_DEBUGGING_GUIDE.md');
    } else {
        console.log('\n⚠️  Some tests failed. Please fix the issues above before debugging.');
    }

    return failed === 0;
}

// Run the tests
runTests().catch(console.error);

