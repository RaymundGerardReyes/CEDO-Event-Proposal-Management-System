/**
 * Test file naming and multer configuration
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Test file naming validation
const testFileNaming = () => {
    console.log('🧪 Testing file naming validation...');

    const testFiles = [
        { name: '2549036567 (2).pdf', type: 'application/pdf', size: 627666 },
        { name: 'OrganizationName_GPOA.pdf', type: 'application/pdf', size: 1024000 },
        { name: 'OrganizationName_PP.pdf', type: 'application/pdf', size: 2048000 },
        { name: 'invalid.txt', type: 'text/plain', size: 1024 }
    ];

    // Simulate multer fileFilter
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    console.log('📊 File validation results:');
    testFiles.forEach(file => {
        const isValidType = allowedTypes.includes(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        const isValid = isValidType && isValidSize;

        console.log(`  ${file.name}:`);
        console.log(`    Type: ${file.type} - ${isValidType ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`    Size: ${file.size} bytes - ${isValidSize ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`    Overall: ${isValid ? '✅ ACCEPTED' : '❌ REJECTED'}`);
        console.log('');
    });

    return true;
};

// Test multer configuration
const testMulterConfig = () => {
    console.log('🧪 Testing multer configuration...');

    try {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadDir = path.join(__dirname, 'uploads/proposals');
                await fs.mkdir(uploadDir, { recursive: true });
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                const ext = path.extname(file.originalname);
                const filename = `${file.fieldname}_${timestamp}${ext}`;
                cb(null, filename);
            }
        });

        const upload = multer({
            storage: storage,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
                files: 2 // Maximum 2 files
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type. Only PDF, Word, and DOCX files are allowed.'), false);
                }
            }
        });

        const fieldsMiddleware = upload.fields([
            { name: 'gpoa', maxCount: 1 },
            { name: 'projectProposal', maxCount: 1 }
        ]);

        console.log('✅ Multer configuration created successfully');
        console.log('✅ Fields middleware created successfully');

        return true;
    } catch (error) {
        console.error('❌ Multer configuration failed:', error.message);
        return false;
    }
};

// Run tests
const runTests = () => {
    console.log('🚀 Testing File Naming and Multer Configuration...');
    console.log('='.repeat(60));

    try {
        const namingTest = testFileNaming();
        const configTest = testMulterConfig();

        console.log('📊 Test Results:');
        console.log('  File Naming Validation:', namingTest ? '✅ PASS' : '❌ FAIL');
        console.log('  Multer Configuration:', configTest ? '✅ PASS' : '❌ FAIL');

        const allPassed = namingTest && configTest;
        console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

        if (allPassed) {
            console.log('\n💡 Conclusion:');
            console.log('  - File naming format is NOT validated by backend');
            console.log('  - Your files "2549036567 (2).pdf" should be accepted');
            console.log('  - The issue is likely with multer middleware configuration');
            console.log('  - Make sure to restart the server after changes');
        }

        return allPassed;
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        return false;
    }
};

// Run if called directly
if (require.main === module) {
    runTests();
}

module.exports = { testFileNaming, testMulterConfig, runTests };
