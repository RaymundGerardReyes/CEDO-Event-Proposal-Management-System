const fs = require('fs');
const path = require('path');

// Files that need to be updated
const filesToUpdate = [
    'src/contexts/auth-context.js',
    'src/app/api/admin/stats/route.js',
    'src/app/api/test-proposals/route.js',
    'src/app/main/student-dashboard/submit-event/api/proposalAPI.js',
    'src/app/main/student-dashboard/submit-event/draftId/reporting/utils/helpers.js',
    'src/app/main/admin-dashboard/settings/api/user-api.js'
];

function updateFile(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  File not found: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');

        // Replace the import
        content = content.replace(
            /import\s+\{\s*config\s*\}\s+from\s+['"]@\/lib\/utils['"];?/g,
            "import { getAppConfig } from '@/lib/utils';"
        );

        // Replace config usage with getAppConfig()
        content = content.replace(/\bconfig\./g, 'getAppConfig().');

        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

// Update all files
console.log('🔧 Fixing config imports...');
filesToUpdate.forEach(updateFile);
console.log('✅ Import fixes completed!'); 