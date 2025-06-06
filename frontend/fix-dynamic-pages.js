#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Adding dynamic export to all page components...\n');

// Find all page.jsx files
const result = execSync('find src/app -name "page.jsx" -type f', { encoding: 'utf8' });
const pageFiles = result.trim().split('\n').filter(Boolean);

let filesProcessed = 0;
let filesModified = 0;

pageFiles.forEach(filePath => {
    try {
        const fullPath = path.resolve(filePath);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check if file already has dynamic export
        if (content.includes('export const dynamic')) {
            console.log(`✅ ${filePath} - Already has dynamic export`);
            filesProcessed++;
            return;
        }

        // Check if it's a client component
        if (!content.includes('"use client"')) {
            console.log(`⏭️  ${filePath} - Not a client component, skipping`);
            filesProcessed++;
            return;
        }

        // Add dynamic export after "use client"
        const lines = content.split('\n');
        let insertIndex = -1;

        // Find the line with "use client"
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('"use client"') || lines[i].includes("'use client'")) {
                insertIndex = i + 1;
                break;
            }
        }

        if (insertIndex === -1) {
            console.log(`⚠️  ${filePath} - Could not find "use client" directive`);
            filesProcessed++;
            return;
        }

        // Insert the dynamic export
        lines.splice(insertIndex, 0, '', '// Force dynamic rendering to prevent SSG issues', 'export const dynamic = \'force-dynamic\';');

        const newContent = lines.join('\n');
        fs.writeFileSync(fullPath, newContent, 'utf8');

        console.log(`✅ ${filePath} - Added dynamic export`);
        filesModified++;
        filesProcessed++;

    } catch (error) {
        console.error(`❌ ${filePath} - Error: ${error.message}`);
        filesProcessed++;
    }
});

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Files skipped: ${filesProcessed - filesModified}`);
console.log('\n🎯 Dynamic export addition complete!'); 