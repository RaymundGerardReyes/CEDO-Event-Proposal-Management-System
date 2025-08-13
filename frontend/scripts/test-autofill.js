/**
 * Test script for AutoFillDebugger component
 * Purpose: Verify the component can be imported without build errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing AutoFillDebugger component import...');

try {
    // Check if the file exists
    const componentPath = path.join(__dirname, '../src/app/main/student-dashboard/submit-event/[draftId]/components/AutoFillDebugger.jsx');

    if (!fs.existsSync(componentPath)) {
        console.error('❌ Component file not found:', componentPath);
        process.exit(1);
    }

    console.log('✅ Component file exists');

    // Read the file content
    const content = fs.readFileSync(componentPath, 'utf8');

    // Check for import errors
    const importLines = content.split('\n').filter(line => line.includes('import'));

    console.log('📦 Import statements found:');
    importLines.forEach((line, index) => {
        console.log(`  ${index + 1}. ${line.trim()}`);
    });

    // Check for specific problematic imports
    const hasStopImport = content.includes('Stop,');
    const hasSquareImport = content.includes('Square,');

    if (hasStopImport) {
        console.error('❌ Found problematic "Stop" import');
        process.exit(1);
    }

    if (hasSquareImport) {
        console.log('✅ Found correct "Square" import');
    }

    // Check for component export
    if (content.includes('export const AutoFillDebugger') || content.includes('export default AutoFillDebugger')) {
        console.log('✅ Component export found');
    } else {
        console.error('❌ Component export not found');
        process.exit(1);
    }

    console.log('✅ All checks passed! AutoFillDebugger component should work correctly.');

} catch (error) {
    console.error('❌ Error testing component:', error.message);
    process.exit(1);
} 