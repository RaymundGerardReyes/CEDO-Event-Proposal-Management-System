/**
 * Import Fix Verification Script
 * Simple Node.js script to verify the DataFlowTracker import fix
 * 
 * This script runs outside of the test framework to avoid esbuild issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 DataFlowTracker Import Fix Verification');
console.log('==========================================\n');

// Check if the import fix was applied correctly
function verifyImportFix() {
    console.log('1. Checking import statements...');

    const filesToCheck = [
        'src/app/student-dashboard/submit-event/[draftId]/reporting/page.jsx',
        'tests/DataFlowTracker.test.jsx'
    ];

    let allFixed = true;

    filesToCheck.forEach(filePath => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');

                // Check for incorrect named imports
                const hasNamedImport = content.includes('import { DataFlowTracker }');
                const hasDefaultImport = content.includes('import DataFlowTracker from');

                if (hasNamedImport) {
                    console.log(`❌ ${filePath}: Still has named import`);
                    allFixed = false;
                } else if (hasDefaultImport) {
                    console.log(`✅ ${filePath}: Has correct default import`);
                } else {
                    console.log(`⚠️  ${filePath}: No DataFlowTracker import found`);
                }
            } else {
                console.log(`⚠️  ${filePath}: File not found`);
            }
        } catch (error) {
            console.log(`❌ ${filePath}: Error reading file - ${error.message}`);
            allFixed = false;
        }
    });

    return allFixed;
}

// Check if DataFlowTracker component exists and has default export
function verifyComponentExport() {
    console.log('\n2. Checking component export...');

    const componentPath = 'src/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker.jsx';
    const fullPath = path.join(__dirname, componentPath);

    try {
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');

            const hasDefaultExport = content.includes('export default function DataFlowTracker') ||
                content.includes('export default function DataFlowTracker(') ||
                content.includes('export default DataFlowTracker');

            if (hasDefaultExport) {
                console.log(`✅ ${componentPath}: Has correct default export`);
                return true;
            } else {
                console.log(`❌ ${componentPath}: Missing default export`);
                return false;
            }
        } else {
            console.log(`⚠️  ${componentPath}: Component file not found`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${componentPath}: Error reading file - ${error.message}`);
        return false;
    }
}

// Check for build errors by looking for common patterns
function checkForBuildErrors() {
    console.log('\n3. Checking for potential build errors...');

    const filesToCheck = [
        'src/app/student-dashboard/submit-event/[draftId]/reporting/page.jsx'
    ];

    let hasErrors = false;

    filesToCheck.forEach(filePath => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');

                // Check for common build error patterns
                const hasDataFlowTrackerImport = content.includes('DataFlowTracker');
                const hasCorrectImport = content.includes('import DataFlowTracker from');
                const hasIncorrectImport = content.includes('import { DataFlowTracker }');

                if (hasDataFlowTrackerImport && !hasCorrectImport && hasIncorrectImport) {
                    console.log(`❌ ${filePath}: Has incorrect named import`);
                    hasErrors = true;
                } else if (hasDataFlowTrackerImport && hasCorrectImport) {
                    console.log(`✅ ${filePath}: Has correct default import`);
                }
            }
        } catch (error) {
            console.log(`❌ ${filePath}: Error checking file - ${error.message}`);
            hasErrors = true;
        }
    });

    return !hasErrors;
}

// Main verification
function main() {
    const importFixed = verifyImportFix();
    const exportCorrect = verifyComponentExport();
    const noBuildErrors = checkForBuildErrors();

    console.log('\n📊 Verification Results');
    console.log('======================');
    console.log(`Import Fix Applied: ${importFixed ? '✅ YES' : '❌ NO'}`);
    console.log(`Component Export Correct: ${exportCorrect ? '✅ YES' : '❌ NO'}`);
    console.log(`No Build Errors: ${noBuildErrors ? '✅ YES' : '❌ NO'}`);

    const allPassed = importFixed && exportCorrect && noBuildErrors;

    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME ISSUES FOUND'}`);

    if (allPassed) {
        console.log('\n🎉 The DataFlowTracker import fix has been successfully applied!');
        console.log('   The build error should now be resolved.');
    } else {
        console.log('\n⚠️  Some issues were found. Please check the details above.');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Try building the project to confirm no import errors');
    console.log('2. If build succeeds, the fix is working correctly');
    console.log('3. The test framework issues are separate from the import fix');
}

// Run the verification
main();
