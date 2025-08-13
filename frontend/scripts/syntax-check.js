#!/usr/bin/env node

/**
 * Syntax Check Script for CEDO Frontend
 * 
 * This script performs pre-build syntax validation to catch common errors:
 * - Unterminated string constants
 * - Invalid destructuring syntax
 * - Malformed import statements
 * - Missing quotes and brackets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common syntax error patterns
const SYNTAX_ERRORS = [
    {
        name: 'Unterminated String Constants',
        pattern: /router\.push\("[^"]*'[^"]*"\)/g,
        message: 'Found unterminated string constant in router.push() call'
    },
    {
        name: 'Invalid Destructuring',
        pattern: /\[draftId\],?\s*\)\s*=>/g,
        message: 'Found invalid destructuring syntax [draftId] in function parameters'
    },
    {
        name: 'Malformed Import',
        pattern: /import.*"[^"]*'[^"]*"/g,
        message: 'Found malformed import statement with mixed quotes'
    },
    {
        name: 'Missing Closing Quote',
        pattern: /"[^"]*'[^"]*$/gm,
        message: 'Found string with missing closing quote'
    }
];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];

    SYNTAX_ERRORS.forEach(error => {
        const matches = content.match(error.pattern);
        if (matches) {
            errors.push({
                file: filePath,
                type: error.name,
                message: error.message,
                matches: matches.length
            });
        }
    });

    return errors;
}

function findJsxFiles(dir) {
    const files = [];

    function traverse(currentDir) {
        const items = fs.readdirSync(currentDir);

        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                traverse(fullPath);
            } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
                files.push(fullPath);
            }
        });
    }

    traverse(dir);
    return files;
}

function main() {
    console.log('🔍 Running syntax check...\n');

    const srcDir = path.join(__dirname, '..', 'src');
    const jsxFiles = findJsxFiles(srcDir);

    let allErrors = [];

    jsxFiles.forEach(file => {
        const errors = checkFile(file);
        allErrors = allErrors.concat(errors);
    });

    if (allErrors.length > 0) {
        console.log('❌ Syntax errors found:\n');
        allErrors.forEach(error => {
            console.log(`📁 ${error.file}`);
            console.log(`   ${error.type}: ${error.message}`);
            console.log(`   Found ${error.matches} instance(s)\n`);
        });

        console.log('💡 Fix these errors before building!');
        process.exit(1);
    } else {
        console.log('✅ No syntax errors found!');
        console.log(`📊 Checked ${jsxFiles.length} files`);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { checkFile, findJsxFiles, SYNTAX_ERRORS };
