const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Cleaning build directory...');

function forceRemoveDirectory(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            console.log(`🗑️  Removing ${dirPath}...`);

            // Method 1: Try Node.js built-in removal
            try {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`✅ Successfully removed ${dirPath}`);
                return true;
            } catch (error) {
                console.log(`⚠️  Node.js removal failed: ${error.message}`);
            }

            // Method 2: Try system commands
            try {
                if (process.platform === 'win32') {
                    // Take ownership and grant permissions
                    execSync(`takeown /f "${dirPath}" /r /d y`, { stdio: 'ignore' });
                    execSync(`icacls "${dirPath}" /grant %USERNAME%:F /t`, { stdio: 'ignore' });
                    // Force remove
                    execSync(`rd /s /q "${dirPath}"`, { stdio: 'ignore' });
                } else {
                    execSync(`rm -rf "${dirPath}"`, { stdio: 'ignore' });
                }
                console.log(`✅ Successfully removed ${dirPath} using system commands`);
                return true;
            } catch (sysError) {
                console.log(`⚠️  System command failed: ${sysError.message}`);
            }

            // Method 3: Try manual file by file deletion
            try {
                console.log(`🔄 Attempting manual file deletion for ${dirPath}...`);
                manualDelete(dirPath);
                console.log(`✅ Successfully removed ${dirPath} manually`);
                return true;
            } catch (manualError) {
                console.log(`❌ Manual deletion failed: ${manualError.message}`);
                return false;
            }
        } else {
            console.log(`✅ Directory ${dirPath} doesn't exist, skipping.`);
            return true;
        }
    } catch (error) {
        console.log(`❌ Failed to remove ${dirPath}:`, error.message);
        return false;
    }
}

function manualDelete(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            manualDelete(filePath);
        } else {
            try {
                // Try to make file writable
                fs.chmodSync(filePath, 0o666);
                fs.unlinkSync(filePath);
            } catch (error) {
                console.log(`⚠️  Could not delete file ${filePath}: ${error.message}`);
            }
        }
    }

    try {
        fs.rmdirSync(dirPath);
    } catch (error) {
        console.log(`⚠️  Could not remove directory ${dirPath}: ${error.message}`);
    }
}

function createCleanDirectory(dirPath) {
    try {
        console.log(`📁 Creating clean ${dirPath} directory...`);
        fs.mkdirSync(dirPath, { recursive: true });

        // Set proper permissions on Windows
        if (process.platform === 'win32') {
            try {
                execSync(`icacls "${dirPath}" /grant %USERNAME%:F`, { stdio: 'ignore' });
            } catch (permError) {
                // Ignore permission errors
            }
        }

        console.log(`✅ Created ${dirPath}`);
    } catch (error) {
        console.log(`❌ Failed to create ${dirPath}:`, error.message);
    }
}

function main() {
    console.log('🚀 Starting build directory cleanup...');

    // Directories to clean
    const dirsToClean = ['.next', 'out', 'dist'];

    let success = true;

    for (const dir of dirsToClean) {
        const result = forceRemoveDirectory(dir);
        if (!result) {
            success = false;
        }
    }

    // Create clean .next directory
    createCleanDirectory('.next');

    if (success) {
        console.log('🎉 Clean complete! You can now run npm commands.');
        process.exit(0);
    } else {
        console.log('⚠️  Clean completed with some warnings. Try running as administrator if issues persist.');
        process.exit(0); // Exit successfully even with warnings
    }
}

if (require.main === module) {
    main();
}

module.exports = { main }; 