#!/usr/bin/env node

/**
 * Fix Old Path References Script
 * Updates all remaining /student-dashboard/ and /admin-dashboard/ references
 * to use the new /main/student-dashboard/ and /main/admin-dashboard/ paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File extensions to process
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to replace
const REPLACEMENTS = [
    {
        pattern: /href=["']\/student-dashboard\//g,
        replacement: 'href="/main/student-dashboard/',
        description: 'href="/student-dashboard/ -> href="/main/student-dashboard/'
    },
    {
        pattern: /href=["']\/admin-dashboard\//g,
        replacement: 'href="/main/admin-dashboard/',
        description: 'href="/admin-dashboard/ -> href="/main/admin-dashboard/'
    },
    {
        pattern: /router\.push\(["']\/student-dashboard\//g,
        replacement: 'router.push("/main/student-dashboard/',
        description: 'router.push("/student-dashboard/ -> router.push("/main/student-dashboard/'
    },
    {
        pattern: /router\.push\(["']\/admin-dashboard\//g,
        replacement: 'router.push("/main/admin-dashboard/',
        description: 'router.push("/admin-dashboard/ -> router.push("/main/admin-dashboard/'
    },
    {
        pattern: /redirect\(["']\/student-dashboard\//g,
        replacement: 'redirect("/main/student-dashboard/',
        description: 'redirect("/student-dashboard/ -> redirect("/main/student-dashboard/'
    },
    {
        pattern: /redirect\(["']\/admin-dashboard\//g,
        replacement: 'redirect("/main/admin-dashboard/',
        description: 'redirect("/admin-dashboard/ -> redirect("/main/admin-dashboard/'
    },
    {
        pattern: /window\.location\.href\s*=\s*["']\/student-dashboard\//g,
        replacement: 'window.location.href = "/main/student-dashboard/',
        description: 'window.location.href = "/student-dashboard/ -> window.location.href = "/main/student-dashboard/'
    },
    {
        pattern: /window\.location\.href\s*=\s*["']\/admin-dashboard\//g,
        replacement: 'window.location.href = "/main/admin-dashboard/',
        description: 'window.location.href = "/admin-dashboard/ -> window.location.href = "/main/admin-dashboard/'
    }
];

// Directories to skip
const SKIP_DIRS = [
    'node_modules',
    '.next',
    'coverage',
    '__mocks__',
    '.git'
];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

function shouldSkipDir(dirName) {
    return SKIP_DIRS.includes(dirName);
}

function shouldProcessFile(fileName) {
    return EXTENSIONS.some(ext => fileName.endsWith(ext));
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let newContent = content;

        REPLACEMENTS.forEach(({ pattern, replacement, description }) => {
            const matches = newContent.match(pattern);
            if (matches) {
                newContent = newContent.replace(pattern, replacement);
                modified = true;
                totalReplacements += matches.length;
                console.log(`  ✅ ${description}: ${matches.length} replacements`);
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            modifiedFiles++;
            console.log(`  📝 Modified: ${filePath}`);
        }

        totalFiles++;
    } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
}

function walkDirectory(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!shouldSkipDir(item)) {
                    walkDirectory(fullPath);
                }
            } else if (stat.isFile() && shouldProcessFile(item)) {
                processFile(fullPath);
            }
        }
    } catch (error) {
        console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    }
}

// Main execution
console.log('🔧 Fixing Old Path References...');
console.log('================================');

const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
    walkDirectory(srcDir);
} else {
    console.error('❌ src directory not found');
    process.exit(1);
}

console.log('\n📊 Summary:');
console.log('===========');
console.log(`📁 Total files processed: ${totalFiles}`);
console.log(`📝 Files modified: ${modifiedFiles}`);
console.log(`🔄 Total replacements: ${totalReplacements}`);

if (modifiedFiles > 0) {
    console.log('\n✅ Old path references have been updated!');
    console.log('🔄 Please restart your development server to see the changes.');
} else {
    console.log('\n✅ No old path references found. Everything is up to date!');
} 