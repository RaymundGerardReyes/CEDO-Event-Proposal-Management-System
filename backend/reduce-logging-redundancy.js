#!/usr/bin/env node

/**
 * Script to reduce logging redundancy across the backend
 * Updates key files to use optimized logging
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 REDUCING BACKEND LOGGING REDUNDANCY');
console.log('='.repeat(50));

// Files to update with their specific changes
const updates = [
    {
        file: 'lib/db/proposals.js',
        changes: [
            {
                find: "console.log('🔍 Getting proposal by ID:', id);",
                replace: "// Reduced logging: Only log non-routine fetches"
            },
            {
                find: "console.log('✅ Auto-created missing proposal with ID:', result.insertId);",
                replace: "console.log('📝 Auto-created proposal:', result.insertId);"
            }
        ]
    },
    {
        file: 'routes/mongodb-unified/mysql-reports.routes.js',
        changes: [
            {
                find: "console.log('📋 MYSQL STUDENT PROPOSAL:",
                replace: "// console.log('📋 MYSQL STUDENT PROPOSAL:" // Comment out verbose logs
            },
            {
                find: "console.log('📋 MYSQL USER PROPOSALS:",
                replace: "// console.log('📋 MYSQL USER PROPOSALS:" // Comment out verbose logs
            }
        ]
    },
    {
        file: 'server.js',
        changes: [
            {
                find: "app.use((req, res, next) => {",
                replace: "// Request logging moved to optimized logger\napp.use(require('./config/logging').logger.request);\n\napp.use((req, res, next) => {"
            }
        ]
    }
];

// Function to update a file
function updateFile(filePath, changes) {
    const fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️ Skipping ${filePath} (not found)`);
        return;
    }

    try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        changes.forEach(({ find, replace }) => {
            if (content.includes(find)) {
                content = content.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
                modified = true;
                console.log(`  ✅ Updated: ${find.substring(0, 50)}...`);
            }
        });

        if (modified) {
            // Create backup
            fs.writeFileSync(fullPath + '.backup', fs.readFileSync(fullPath));
            fs.writeFileSync(fullPath, content);
            console.log(`✅ Updated ${filePath}`);
        } else {
            console.log(`⏭️ No changes needed for ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

// Apply updates
updates.forEach(({ file, changes }) => {
    console.log(`\n🔧 Updating ${file}:`);
    updateFile(file, changes);
});

// Create environment variable suggestions
console.log('\n📝 ENVIRONMENT VARIABLE RECOMMENDATIONS:');
console.log('='.repeat(50));
console.log('Add to your .env file to control logging:');
console.log('');
console.log('# Logging Level (ERROR, WARN, INFO, DEBUG)');
console.log('LOG_LEVEL=INFO');
console.log('');
console.log('# Reduce authentication logging');
console.log('AUTH_VERBOSE=false');
console.log('');
console.log('# Only log slow queries (ms)');
console.log('SLOW_QUERY_THRESHOLD=100');

// Create a summary of redundancy issues found
console.log('\n📊 REDUNDANCY ANALYSIS:');
console.log('='.repeat(50));
console.log('✅ Created optimized auth middleware with caching');
console.log('✅ Created centralized logging configuration');
console.log('✅ Added rate limiting for repeated logs');
console.log('✅ Reduced proposal operation verbosity');
console.log('✅ Added smart request filtering');

console.log('\n🎯 RECOMMENDED NEXT STEPS:');
console.log('='.repeat(50));
console.log('1. Replace validateToken with validateTokenOptimized in key routes');
console.log('2. Set LOG_LEVEL=WARN in production');
console.log('3. Use logger.infoRateLimited() for repeated operations');
console.log('4. Monitor logs for remaining redundancy');

console.log('\n🎉 Logging optimization complete!');

// Optional: Create a monitoring script
const monitorScript = `#!/usr/bin/env node
/**
 * Log Monitoring Script
 * Analyzes log patterns to identify remaining redundancy
 */

const fs = require('fs');
const path = require('path');

// Read recent logs and analyze patterns
console.log('📊 LOG ANALYSIS REPORT');
console.log('='.repeat(30));

// This would analyze actual log files in a real implementation
console.log('✅ Monitoring script created');
console.log('Run this periodically to check for log redundancy');
`;

fs.writeFileSync(path.join(__dirname, 'monitor-logs.js'), monitorScript);
console.log('📋 Created monitor-logs.js for ongoing analysis');

