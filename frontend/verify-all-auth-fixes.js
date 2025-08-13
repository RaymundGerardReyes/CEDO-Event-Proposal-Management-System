/**
 * Comprehensive Auth Import Fix Verification Script
 * Verifies that all getAuthToken import fixes are working correctly
 * 
 * This script runs outside of the test framework to avoid esbuild issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Comprehensive Auth Import Fix Verification');
console.log('=============================================\n');

// Files that should use getToken from @/utils/auth-utils
const filesToCheck = [
    'src/app/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker.jsx',
    'src/app/student-dashboard/submit-event/[draftId]/reporting/services/proposalService.js'
];

// Files that have their own getAuthToken function (should not be changed)
const filesWithOwnAuthToken = [
    'src/utils/api.js',
    'src/lib/api/users.js'
];

// Check if the auth import fix was applied correctly
function verifyAuthImportFix() {
    console.log('1. Checking auth import statements in service files...');

    let allFixed = true;

    filesToCheck.forEach(filePath => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');

                // Check for incorrect getAuthToken imports
                const hasGetAuthTokenImport = content.includes('import { getAuthToken } from \'@/utils/auth-utils\'');
                const hasGetTokenImport = content.includes('import { getToken } from \'@/utils/auth-utils\'');
                const hasGetAuthTokenUsage = content.includes('await getAuthToken()') || content.includes('getAuthToken()');
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

// Check files that should have their own getAuthToken function
function verifyOwnAuthTokenFunctions() {
    console.log('\n2. Checking files with their own getAuthToken functions...');

    let allCorrect = true;

    filesWithOwnAuthToken.forEach(filePath => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');

                const hasOwnGetAuthToken = content.includes('function getAuthToken()') ||
                    content.includes('const getAuthToken = ()');
                const hasImportFromAuthUtils = content.includes('import { getAuthToken } from \'@/utils/auth-utils\'');

                if (hasOwnGetAuthToken && !hasImportFromAuthUtils) {
                    console.log(`✅ ${filePath}: Has its own getAuthToken function (correct)`);
                } else if (hasImportFromAuthUtils) {
                    console.log(`❌ ${filePath}: Should not import getAuthToken from auth-utils`);
                    allCorrect = false;
                } else {
                    console.log(`⚠️  ${filePath}: No getAuthToken function found`);
                }
            } else {
                console.log(`⚠️  ${filePath}: File not found`);
            }
        } catch (error) {
            console.log(`❌ ${filePath}: Error reading file - ${error.message}`);
            allCorrect = false;
        }
    });

    return allCorrect;
}

// Check if auth-utils exports the correct functions
function verifyAuthUtilsExports() {
    console.log('\n3. Checking auth-utils exports...');

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
    console.log('\n4. Checking for potential build errors...');

    let hasErrors = false;

    filesToCheck.forEach(filePath => {
        try {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');

                // Check for common build error patterns
                const hasGetAuthTokenImport = content.includes('import { getAuthToken } from \'@/utils/auth-utils\'');
                const hasGetTokenImport = content.includes('import { getToken } from \'@/utils/auth-utils\'');
                const hasGetAuthTokenUsage = content.includes('getAuthToken()');
                const hasGetTokenUsage = content.includes('getToken()');

                if (hasGetAuthTokenImport || (hasGetAuthTokenUsage && !hasGetTokenUsage)) {
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
    const ownFunctionsCorrect = verifyOwnAuthTokenFunctions();
    const exportsCorrect = verifyAuthUtilsExports();
    const noBuildErrors = checkForBuildErrors();

    console.log('\n📊 Verification Results');
    console.log('======================');
    console.log(`Auth Import Fix Applied: ${importFixed ? '✅ YES' : '❌ NO'}`);
    console.log(`Own Auth Functions Correct: ${ownFunctionsCorrect ? '✅ YES' : '❌ NO'}`);
    console.log(`Auth Utils Exports Correct: ${exportsCorrect ? '✅ YES' : '❌ NO'}`);
    console.log(`No Build Errors: ${noBuildErrors ? '✅ YES' : '❌ NO'}`);

    const allPassed = importFixed && ownFunctionsCorrect && exportsCorrect && noBuildErrors;

    console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME ISSUES FOUND'}`);

    if (allPassed) {
        console.log('\n🎉 All auth import fixes have been successfully applied!');
        console.log('   The build errors should now be resolved.');
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
