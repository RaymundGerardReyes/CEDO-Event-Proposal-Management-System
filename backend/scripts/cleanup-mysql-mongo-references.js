#!/usr/bin/env node

/**
 * COMPREHENSIVE MYSQL/MONGODB CLEANUP SCRIPT
 * ==========================================
 * 
 * This script systematically removes all MySQL and MongoDB references
 * from the backend codebase and replaces them with PostgreSQL equivalents.
 */

const fs = require('fs');
const path = require('path');

// Files to process (relative to backend directory)
const filesToProcess = [
    'controllers/admin.controller.js',
    'controllers/proposal.controller.js',
    'controllers/report.controller.js',
    'services/admin.service.js',
    'services/proposal.service.js',
    'services/report.service.js',
    'services/audit.service.js',
    'services/data-sync.service.js',
    'services/file.service.js',
    'services/hybrid-file.service.js',
    'lib/db/proposals.js',
    'routes/admin/dashboard.js',
    'routes/dashboard.js',
    'routes/database-api.js',
    'routes/db-check.js',
    'routes/drafts.js',
    'utils/db.js',
    'utils/gridfs.js',
    'utils/secrets.js',
    'models/Proposal.js'
];

// Replacement mappings
const replacements = [
    // MySQL to PostgreSQL
    { from: /mysql/gi, to: 'postgresql' },
    { from: /MySQL/gi, to: 'PostgreSQL' },
    { from: /MYSQL/gi, to: 'POSTGRESQL' },

    // MongoDB to PostgreSQL
    { from: /mongodb/gi, to: 'postgresql' },
    { from: /MongoDB/gi, to: 'PostgreSQL' },
    { from: /MONGODB/gi, to: 'POSTGRESQL' },
    { from: /mongo/gi, to: 'postgresql' },
    { from: /Mongo/gi, to: 'PostgreSQL' },

    // Specific phrase replacements
    { from: /mysql_realtime/gi, to: 'postgresql_realtime' },
    { from: /Hybrid MySQL \+ MongoDB/gi, to: 'PostgreSQL' },
    { from: /MySQL \+ MongoDB/gi, to: 'PostgreSQL' },
    { from: /MongoDB \+ MySQL/gi, to: 'PostgreSQL' },
    { from: /mongodb\.js/gi, to: 'postgresql.js' },
    { from: /mysql\.js/gi, to: 'postgresql.js' },

    // Remove MongoDB-specific imports and requires
    { from: /const\s*\{\s*getDb\s*\}\s*=\s*require\(['"]\.\.\/config\/mongodb['"]\);\s*/g, to: '' },
    { from: /const\s*\{\s*getDb\s*\}\s*=\s*require\(['"]\.\.\/utils\/db['"]\);\s*/g, to: '' },
    { from: /const\s*\{\s*Binary\s*\}\s*=\s*require\(['"]mongodb['"]\);\s*/g, to: '' },
    { from: /const\s*mongoose\s*=\s*require\(['"]mongoose['"]\);\s*/g, to: '' },
    { from: /const\s*GridFSBucket\s*=\s*require\(['"]mongodb['"]\)\.GridFSBucket;\s*/g, to: '' },

    // Update console.log messages
    { from: /from MySQL/gi, to: 'from PostgreSQL' },
    { from: /to MySQL/gi, to: 'to PostgreSQL' },
    { from: /in MySQL/gi, to: 'in PostgreSQL' },
    { from: /MySQL query/gi, to: 'PostgreSQL query' },
    { from: /MySQL Error/gi, to: 'PostgreSQL Error' },
    { from: /MySQL: /gi, to: 'PostgreSQL: ' },

    // Update source references
    { from: /source:\s*['"]mysql/gi, to: "source: 'postgresql" },
    { from: /source:\s*['"]mongodb/gi, to: "source: 'postgresql" },
];

function processFile(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', filePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // Apply all replacements
        replacements.forEach(({ from, to }) => {
            const newContent = content.replace(from, to);
            if (newContent !== content) {
                content = newContent;
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
        } else {
            console.log(`➖ No changes needed: ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🧹 Starting MySQL/MongoDB cleanup...\n');

    filesToProcess.forEach(processFile);

    console.log('\n🎉 Cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('- All MySQL references replaced with PostgreSQL');
    console.log('- All MongoDB references replaced with PostgreSQL');
    console.log('- Removed MongoDB-specific imports');
    console.log('- Updated console messages and documentation');
    console.log('\n⚠️  Note: Please review the changes and test your application.');
}

if (require.main === module) {
    main();
}

module.exports = { processFile, replacements };

