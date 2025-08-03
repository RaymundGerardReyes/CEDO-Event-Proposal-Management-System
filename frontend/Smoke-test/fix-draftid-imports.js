#!/usr/bin/env node

/**
 * Fix DraftId Import Paths Script
 * Updates all import paths from [draftId] to draftId throughout the codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FRONTEND_DIR = path.join(__dirname, 'src');
const TEST_DIR = path.join(__dirname, 'tests');
const OLD_PATH = '[draftId]';
const NEW_PATH = 'draftId';

// File extensions to process
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md'];

// Patterns to replace
const REPLACEMENTS = [
    // Import statements
    {
        pattern: /from\s+['"]@\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '@/app/main/student-dashboard/submit-event/draftId"
    },
    {
        pattern: /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '../../../../../../../src/app/main/student-dashboard/submit-event/draftId"
    },
    {
        pattern: /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '../../../../../../src/app/main/student-dashboard/submit-event/draftId"
    },
    {
        pattern: /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '../../../../../src/app/main/student-dashboard/submit-event/draftId"
    },
    {
        pattern: /from\s+['"]\.\.\/\.\.\/\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '../../../../src/app/main/student-dashboard/submit-event/draftId"
    },
    {
        pattern: /from\s+['"]\.\.\/\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '../../../src/app/main/student-dashboard/submit-event/draftId"
    },
    {
        pattern: /from\s+['"]\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '../../src/app/main/student-dashboard/submit-event/draftId"
    },
    {
        pattern: /from\s+['"]\.\/src\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "from '../src/app/main/student-dashboard/submit-event/draftId"
    },
    // vi.mock statements
    {
        pattern: /vi\.mock\(['"]@\/app\/main\/student-dashboard\/submit-event\/\[draftId\]/g,
        replacement: "vi.mock('@/app/main/student-dashboard/submit-event/draftId"
    },
    // Direct path references
    {
        pattern: /\/\[draftId\]\//g,
        replacement: '/draftId/'
    },
    // Comments and documentation
    {
        pattern: /\[draftId\]/g,
        replacement: 'draftId'
    }
];

// Statistics
let filesProcessed = 0;
let filesModified = 0;
let totalReplacements = 0;

/**
 * Recursively find all files with specified extensions
 */
function findFiles(dir, extensions) {
    const files = [];

    if (!fs.existsSync(dir)) {
        return files;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip node_modules and .next
            if (item !== 'node_modules' && item !== '.next' && !item.startsWith('.')) {
                files.push(...findFiles(fullPath, extensions));
            }
        } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

/**
 * Process a single file
 */
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let modifiedContent = content;
        let fileModified = false;
        let replacementsInFile = 0;

        // Apply all replacements
        for (const { pattern, replacement } of REPLACEMENTS) {
            const matches = modifiedContent.match(pattern);
            if (matches) {
                modifiedContent = modifiedContent.replace(pattern, replacement);
                replacementsInFile += matches.length;
                fileModified = true;
            }
        }

        // Write back if modified
        if (fileModified) {
            fs.writeFileSync(filePath, modifiedContent, 'utf8');
            filesModified++;
            totalReplacements += replacementsInFile;
            console.log(`✅ Modified: ${path.relative(process.cwd(), filePath)} (${replacementsInFile} replacements)`);
        }

        filesProcessed++;

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

/**
 * Main execution
 */
function main() {
    console.log('🔧 Fixing DraftId Import Paths');
    console.log('================================');
    console.log(`📁 Frontend directory: ${FRONTEND_DIR}`);
    console.log(`📁 Test directory: ${TEST_DIR}`);
    console.log(`🔄 Converting: ${OLD_PATH} → ${NEW_PATH}`);
    console.log('');

    // Find all files to process
    const frontendFiles = findFiles(FRONTEND_DIR, EXTENSIONS);
    const testFiles = findFiles(TEST_DIR, EXTENSIONS);
    const allFiles = [...frontendFiles, ...testFiles];

    console.log(`📋 Found ${allFiles.length} files to process`);
    console.log('');

    // Process each file
    for (const file of allFiles) {
        processFile(file);
    }

    // Summary
    console.log('');
    console.log('📊 Summary');
    console.log('==========');
    console.log(`📁 Files processed: ${filesProcessed}`);
    console.log(`✏️  Files modified: ${filesModified}`);
    console.log(`🔄 Total replacements: ${totalReplacements}`);
    console.log('');

    if (filesModified > 0) {
        console.log('✅ Successfully updated all DraftId import paths!');
        console.log('');
        console.log('🔧 Next Steps:');
        console.log('1. Test the application to ensure all imports work');
        console.log('2. Check that dynamic routing still functions correctly');
        console.log('3. Verify that all components load properly');
        console.log('4. Run your test suite to catch any missed references');
    } else {
        console.log('ℹ️  No files needed updating - all paths already correct!');
    }
}

// Run the script
main(); 