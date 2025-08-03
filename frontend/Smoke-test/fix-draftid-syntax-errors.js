#!/usr/bin/env node

/**
 * Fix DraftId Syntax Errors Script
 * Fixes JavaScript syntax errors caused by incorrect replacement of draftId with [draftId]
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
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to replace (fixing syntax errors)
const REPLACEMENTS = [
    // Fix destructuring syntax errors
    {
        pattern: /const\s*\{\s*\[draftId\]\s*\}\s*=\s*useParams\(\)/g,
        replacement: "const { draftId } = useParams()"
    },
    {
        pattern: /const\s*\{\s*\[draftId\]\s*\}\s*=\s*use\(/g,
        replacement: "const { draftId } = use("
    },
    {
        pattern: /const\s*\{\s*\[draftId\]\s*\}\s*=\s*await\s*params/g,
        replacement: "const { draftId } = await params"
    },
    {
        pattern: /const\s*\{\s*\[draftId\]\s*\}\s*=\s*unwrappedParams/g,
        replacement: "const { draftId } = unwrappedParams"
    },
    {
        pattern: /const\s*\{\s*\[draftId\]\s*\}\s*=\s*await\s*createDraft/g,
        replacement: "const { draftId } = await createDraft"
    },
    // Fix property access syntax errors
    {
        pattern: /draftResponse\.\[draftId\]/g,
        replacement: "draftResponse.draftId"
    },
    {
        pattern: /draft\?\.\[draftId\]/g,
        replacement: "draft?.draftId"
    },
    // Fix variable usage in template literals and function calls
    {
        pattern: /\$\{\[draftId\]\}/g,
        replacement: "${draftId}"
    },
    {
        pattern: /useDraft\(\[draftId\]\)/g,
        replacement: "useDraft(draftId)"
    },
    {
        pattern: /getDraft\(\[draftId\]/g,
        replacement: "getDraft(draftId"
    },
    {
        pattern: /saveEventTypeSelection\(\[draftId\]/g,
        replacement: "saveEventTypeSelection(draftId"
    },
    {
        pattern: /correctUrl\(\[draftId\]/g,
        replacement: "correctUrl(draftId"
    },
    // Fix variable assignments and comparisons
    {
        pattern: /if\s*\(\[draftId\]/g,
        replacement: "if (draftId"
    },
    {
        pattern: /if\s*\(!\[draftId\]\)/g,
        replacement: "if (!draftId)"
    },
    {
        pattern: /const\s*\[draftId\]\s*=/g,
        replacement: "const draftId ="
    },
    {
        pattern: /let\s*\[draftId\]\s*=/g,
        replacement: "let draftId ="
    },
    // Fix object property assignments
    {
        pattern: /\[draftId\]:\s*\[draftId\]/g,
        replacement: "draftId: draftId"
    },
    {
        pattern: /\[draftId\]:\s*'test-draft-id'/g,
        replacement: "draftId: 'test-draft-id'"
    },
    // Fix console.log statements
    {
        pattern: /console\.log\([^)]*\[draftId\][^)]*\)/g,
        replacement: (match) => match.replace(/\[draftId\]/g, 'draftId')
    },
    // Fix router.push calls
    {
        pattern: /router\.push\([^)]*\[draftId\][^)]*\)/g,
        replacement: (match) => match.replace(/\[draftId\]/g, 'draftId')
    },
    // Fix component props
    {
        pattern: /\[draftId\]=\{\[draftId\]\}/g,
        replacement: "draftId={draftId}"
    },
    // Fix destructuring in useParams with alias
    {
        pattern: /const\s*\{\s*\[draftId\]:\s*\[draftId\]Param\s*\}\s*=\s*useParams\(\)/g,
        replacement: "const { draftId: draftIdParam } = useParams()"
    },
    // Fix variable references in arrays and objects
    {
        pattern: /\[\s*\[draftId\],\s*\]/g,
        replacement: "[draftId]"
    },
    {
        pattern: /\{\s*\[draftId\],\s*pathname\s*\}/g,
        replacement: "{ draftId, pathname }"
    },
    {
        pattern: /\{\s*\[draftId\],\s*mode,\s*proposalId,\s*source\s*\}/g,
        replacement: "{ draftId, mode, proposalId, source }"
    },
    // Fix import paths that got double brackets
    {
        pattern: /@\/app\/main\/student-dashboard\/submit-event\/\[\[draftId\]\]/g,
        replacement: "@/app/main/student-dashboard/submit-event/[draftId]"
    },
    {
        pattern: /\.\.\/\.\.\/\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[\[draftId\]\]/g,
        replacement: "../../../src/app/main/student-dashboard/submit-event/[draftId]"
    },
    {
        pattern: /\.\.\/\.\.\/src\/app\/main\/student-dashboard\/submit-event\/\[\[draftId\]\]/g,
        replacement: "../../src/app/main/student-dashboard/submit-event/[draftId]"
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
                if (typeof replacement === 'function') {
                    modifiedContent = modifiedContent.replace(pattern, replacement);
                } else {
                    modifiedContent = modifiedContent.replace(pattern, replacement);
                }
                replacementsInFile += matches.length;
                fileModified = true;
            }
        }

        // Write back if modified
        if (fileModified) {
            fs.writeFileSync(filePath, modifiedContent, 'utf8');
            filesModified++;
            totalReplacements += replacementsInFile;
            console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)} (${replacementsInFile} fixes)`);
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
    console.log('🔧 Fixing DraftId Syntax Errors');
    console.log('===============================');
    console.log(`📁 Frontend directory: ${FRONTEND_DIR}`);
    console.log(`📁 Test directory: ${TEST_DIR}`);
    console.log(`🔄 Fixing: ${OLD_PATH} → ${NEW_PATH} in JavaScript code`);
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
    console.log(`🔄 Total fixes: ${totalReplacements}`);
    console.log('');

    if (filesModified > 0) {
        console.log('✅ Successfully fixed all DraftId syntax errors!');
        console.log('');
        console.log('🔧 Next Steps:');
        console.log('1. Test the build process: npm run build');
        console.log('2. Check that all components load properly');
        console.log('3. Verify that dynamic routing works');
        console.log('4. Run your test suite to ensure everything works');
    } else {
        console.log('ℹ️  No syntax errors found - all files already correct!');
    }
}

// Run the script
main(); 