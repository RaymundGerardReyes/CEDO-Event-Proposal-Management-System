// Comprehensive script to fix all import and comment issues after folder rename
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all JS/JSX files
function findFiles(dir, extensions = ['.js', '.jsx']) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            // Skip node_modules and .next
            if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
                results = results.concat(findFiles(filePath, extensions));
            }
        } else {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                results.push(filePath);
            }
        }
    });

    return results;
}

// Function to fix imports and comments in a file
function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix import statements
        const importPatterns = [
            {
                from: /from\s+['"]@\/app\/\(main\)/g,
                to: "from '@/app/main"
            },
            {
                from: /from\s+['"]@\/app\/\(auth\)/g,
                to: "from '@/app/auth"
            },
            {
                from: /from\s+['"]\.\.\/\.\.\/app\/\(main\)/g,
                to: "from '../../app/main"
            },
            {
                from: /from\s+['"]\.\.\/\.\.\/app\/\(auth\)/g,
                to: "from '../../app/auth"
            },
            {
                from: /from\s+['"]\.\.\/app\/\(main\)/g,
                to: "from '../app/main"
            },
            {
                from: /from\s+['"]\.\.\/app\/\(auth\)/g,
                to: "from '../app/auth"
            }
        ];

        // Fix comments
        const commentPatterns = [
            {
                from: /\/\/.*frontend\/src\/app\/\(main\)/g,
                to: (match) => match.replace('(main)', 'main')
            },
            {
                from: /\/\/.*frontend\/src\/app\/\(auth\)/g,
                to: (match) => match.replace('(auth)', 'auth')
            },
            {
                from: /\/\/.*src\/app\/\(main\)/g,
                to: (match) => match.replace('(main)', 'main')
            },
            {
                from: /\/\/.*src\/app\/\(auth\)/g,
                to: (match) => match.replace('(auth)', 'auth')
            }
        ];

        // Apply import fixes
        importPatterns.forEach(pattern => {
            if (pattern.from.test(content)) {
                content = content.replace(pattern.from, pattern.to);
                modified = true;
            }
        });

        // Apply comment fixes
        commentPatterns.forEach(pattern => {
            if (pattern.from.test(content)) {
                content = content.replace(pattern.from, pattern.to);
                modified = true;
            }
        });

        // Write back if modified
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main execution
console.log('🔧 Starting comprehensive import and comment fix...');

const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`📁 Found ${files.length} files to process`);

let fixedCount = 0;
files.forEach(file => {
    if (fixFile(file)) {
        fixedCount++;
    }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('🎉 Comprehensive import and comment fix completed!'); 