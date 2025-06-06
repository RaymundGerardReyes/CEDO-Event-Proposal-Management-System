#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing dynamic export naming conflicts...\n');

// Find all page.jsx files that might have conflicts
const result = execSync('find src/app -name "page.jsx" -type f', { encoding: 'utf8' });
const pageFiles = result.trim().split('\n').filter(Boolean);

let filesProcessed = 0;
let filesFixed = 0;

pageFiles.forEach(filePath => {
    try {
        const fullPath = path.resolve(filePath);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Check if file has both dynamic import and dynamic export
        const hasDynamicImport = content.includes('import dynamic from') || content.includes('dynamic(');
        const hasDynamicExport = content.includes('export const dynamic');

        if (hasDynamicImport && hasDynamicExport) {
            console.log(`🔧 ${filePath} - Fixing naming conflict`);

            // Replace export const dynamic with export const forceDynamic
            const newContent = content.replace(
                'export const dynamic = \'force-dynamic\';',
                'export const forceDynamic = \'force-dynamic\';'
            );

            fs.writeFileSync(fullPath, newContent, 'utf8');
            filesFixed++;
        } else if (hasDynamicExport) {
            console.log(`✅ ${filePath} - Has dynamic export, no conflict`);
        } else {
            console.log(`⏭️  ${filePath} - No dynamic export found`);
        }

        filesProcessed++;

    } catch (error) {
        console.error(`❌ ${filePath} - Error: ${error.message}`);
        filesProcessed++;
    }
});

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files fixed: ${filesFixed}`);
console.log('\n🎯 Naming conflict fix complete!'); 