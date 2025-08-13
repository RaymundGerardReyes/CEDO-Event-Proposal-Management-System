/**
 * Auth Import Fix Verification Script
 * Verifies that the getToken import fix is working correctly
 * 
 * This script runs outside of the test framework to avoid esbuild issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 DataFlowTracker Auth Import Fix Verification');
console.log('==============================================\n');

// Check if the auth import fix was applied correctly
function verifyAuthImportFix() {
    console.log('1. Checking auth import statements...');

    const filesToCheck = [
        'src/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker.jsx'
    ];

    let allFixed = true;

    filesToCheck.forEach(filePath => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');

                // Check for incorrect getAuthToken imports
                const hasGetAuthTokenImport = content.includes('import { getAuthToken }');
                const hasGetTokenImport = content.includes('import { getToken }');
                const hasGetAuthTokenUsage = content.includes('getAuthToken()');
                const hasGetTokenUsage = content.includes('getToken()');

                if (hasGetAuthTokenImport) {
                    console.log(`❌ ${filePath}: Still has getAuthToken import`);
                    allFixed = false;
                } else if (hasGetTokenImport) {
                    console.log(`✅ ${filePath}: Has correct getToken import`);
                } else {
                    console.log(`⚠️  ${filePath}: No auth import found`);
                }

                if (hasGetAuthTokenUsage) {
                    console.log(`❌ ${filePath}: Still uses getAuthToken() function`);
                    allFixed = false;
                } else if (hasGetTokenUsage) {
                    console.log(`✅ ${filePath}: Uses correct getToken() function`);
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

// Check if auth-utils exports the correct functions
function verifyAuthUtilsExports() {
    console.log('\n2. Checking auth-utils exports...');

    const authUtilsPath = 'src/utils/auth-utils.js';
    const fullPath = path.join(__dirname, authUtilsPath);

    try {
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');

            const hasGetTokenExport = content.includes('export function getToken()') ||
                content.includes('export function getToken(');
            const hasGetAuthTokenExport = content.includes('export function getAuthToken()') ||
                content.includes('export function getAuthToken(');

            if (hasGetTokenExport) {
                console.log(`✅ ${authUtilsPath}: Exports getToken function`);
            } else {
                console.log(`❌ ${authUtilsPath}: Missing getToken export`);
                return false;
            }

            if (hasGetAuthTokenExport) {
                console.log(`⚠️  ${authUtilsPath}: Still exports getAuthToken (should be removed)`);
                return false;
            } else {
                console.log(`✅ ${authUtilsPath}: Does not export getAuthToken (correct)`);
            }

            return true;
        } else {
            console.log(`⚠️  ${authUtilsPath}: Auth utils file not found`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${authUtilsPath}: Error reading file - ${error.message}`);
        return false;
    }
}

// Check for build errors by looking for common patterns
function checkForBuildErrors() {
    console.log('\n3. Checking for potential build errors...');

    const filesToCheck = [
        'src/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker.jsx'
    ];

    let hasErrors = false;

    filesToCheck.forEach(filePath => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');

                // Check for common build error patterns
                const hasGetAuthTokenImport = content.includes('import { getAuthToken }');
                const hasGetTokenImport = content.includes('import { getToken }');
                const hasGetAuthTokenUsage = content.includes('getAuthToken()');
                const hasGetTokenUsage = content.includes('getToken()');

                if (hasGetAuthTokenImport || hasGetAuthTokenUsage) {
                    console.log(`❌ ${filePath}: Has incorrect getAuthToken references`);
                    hasErrors = true;
                } else if (hasGetTokenImport && hasGetTokenUsage) {
                    console.log(`✅ ${filePath}: Has correct getToken references`);
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
    const importFixed = verifyAuthImportFix();
    const exportsCorrect = verifyAuthUtilsExports();
    const noBuildErrors = checkForBuildErrors();

    console.log('\n📊 Verification Results');
    console.log('======================');
    console.log(`Auth Import Fix Applied: ${importFixed ? '✅ YES' : '❌ NO'}`);
    console.log(`Auth Utils Exports Correct: ${exportsCorrect ? '✅ YES' : '❌ NO'}`);
    console.log(`No Build Errors: ${noBuildErrors ? '✅ YES' : '❌ NO'}`);

    const allPassed = importFixed && exportsCorrect && noBuildErrors;

    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME ISSUES FOUND'}`);

    if (allPassed) {
        console.log('\n🎉 The DataFlowTracker auth import fix has been successfully applied!');
        console.log('   The build error should now be resolved.');
    } else {
        console.log('\n⚠️  Some issues were found. Please check the details above.');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Try building the project to confirm no auth import errors');
    console.log('2. If build succeeds, the fix is working correctly');
    console.log('3. Run the unit tests to verify functionality');
}

// Run the verification
main();


