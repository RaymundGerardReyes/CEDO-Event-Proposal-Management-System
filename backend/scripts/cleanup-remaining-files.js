#!/usr/bin/env node

/**
 * CLEANUP REMAINING MYSQL/MONGODB REFERENCES
 * ==========================================
 * 
 * This script cleans up the remaining files that still contain
 * MySQL/MongoDB references.
 */

const fs = require('fs');
const path = require('path');

// Remaining files to process
const remainingFiles = [
    'middleware/db-check.js',
    'server.js',
    'scripts/check-environment.js',
    'scripts/create-admin.js',
    'scripts/fix-database-issues.js',
    'scripts/fix-proposal-statuses.js',
    'scripts/init-db.js',
    'scripts/insert-test-proposal.js',
    'scripts/test-api-endpoint.js',
    'scripts/test-connection-strings.js',
    'scripts/test-users.js',
    'scripts/verify-render-config.js',
    'tests/connection-resilience.test.js',
    'tests/init-db.test.js',
    'tests/middleware/db-check.middleware.test.js',
    'tests/routes/database-api.routes.test.js',
    'tests/routes/db-check.routes.test.js',
    'tests/routes/organizations.routes.test.js',
    'tests/routes/profile.routes.test.js',
    'tests/routes/proposals.routes.simple.test.js',
    'tests/routes/proposals.routes.test.js',
    'tests/server.test.js',
    'tests/services/proposal.service.isolated.test.js',
    'tests/services/proposal.service.simple.test.js',
    'tests/services/proposal.service.test.js',
    'tests/setup.js',
    'tests/simple-connection.test.js'
];

// Extended replacement mappings for remaining files
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
    { from: /require\(['"]mongoose['"]\);\s*/g, to: '' },
    { from: /require\(['"]mongodb['"]\);\s*/g, to: '' },

    // Update console.log messages
    { from: /from MySQL/gi, to: 'from PostgreSQL' },
    { from: /to MySQL/gi, to: 'to PostgreSQL' },
    { from: /in MySQL/gi, to: 'in PostgreSQL' },
    { from: /MySQL query/gi, to: 'PostgreSQL query' },
    { from: /MySQL Error/gi, to: 'PostgreSQL Error' },
    { from: /MySQL: /gi, to: 'PostgreSQL: ' },
    { from: /MySQL connection/gi, to: 'PostgreSQL connection' },
    { from: /MySQL database/gi, to: 'PostgreSQL database' },

    // Update source references
    { from: /source:\s*['"]mysql/gi, to: "source: 'postgresql" },
    { from: /source:\s*['"]mongodb/gi, to: "source: 'postgresql" },

    // Update test descriptions
    { from: /MySQL test/gi, to: 'PostgreSQL test' },
    { from: /MongoDB test/gi, to: 'PostgreSQL test' },
    { from: /testing MySQL/gi, to: 'testing PostgreSQL' },
    { from: /testing MongoDB/gi, to: 'testing PostgreSQL' },

    // Update connection strings and environment variables
    { from: /MYSQL_HOST/gi, to: 'POSTGRES_HOST' },
    { from: /MYSQL_PORT/gi, to: 'POSTGRES_PORT' },
    { from: /MYSQL_USER/gi, to: 'POSTGRES_USER' },
    { from: /MYSQL_PASSWORD/gi, to: 'POSTGRES_PASSWORD' },
    { from: /MYSQL_DATABASE/gi, to: 'POSTGRES_DATABASE' },
    { from: /MONGODB_URI/gi, to: 'POSTGRES_URI' },

    // Update comments
    { from: /\/\/ MySQL/gi, to: '// PostgreSQL' },
    { from: /\/\/ MongoDB/gi, to: '// PostgreSQL' },
    { from: /\* MySQL/gi, to: '* PostgreSQL' },
    { from: /\* MongoDB/gi, to: '* PostgreSQL' },
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
    console.log('🧹 Cleaning up remaining MySQL/MongoDB references...\n');

    remainingFiles.forEach(processFile);

    console.log('\n🎉 Remaining cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('- Processed all remaining files with MySQL/MongoDB references');
    console.log('- Updated scripts, tests, and middleware files');
    console.log('- Replaced environment variable references');
    console.log('- Updated comments and documentation');
    console.log('\n⚠️  Note: Please test your application thoroughly after these changes.');
}

if (require.main === module) {
    main();
}

module.exports = { processFile, replacements };

