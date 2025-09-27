/**
 * Simple Multer Test
 * Test if multer middleware is working correctly
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Test multer configuration
const testMulterConfig = () => {
    console.log('🧪 Testing multer configuration...');

    try {
        // Create storage configuration
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadDir = path.join(__dirname, 'uploads/proposals');
                try {
                    await fs.mkdir(uploadDir, { recursive: true });
                    cb(null, uploadDir);
                } catch (error) {
                    cb(error);
                }
            },
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                const ext = path.extname(file.originalname);
                const filename = `${file.fieldname}_${timestamp}${ext}`;
                cb(null, filename);
            }
        });

        // Create upload configuration
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
                    cb(new Error('Invalid file type. Only PDF, Word, and DOCX files are allowed.'));
                }
            }
        });

        console.log('✅ Multer configuration created successfully');
        console.log('📊 Storage:', typeof storage);
        console.log('📊 Upload:', typeof upload);
        console.log('📊 Fields method:', typeof upload.fields);

        // Test fields configuration
        const fieldsMiddleware = upload.fields([
            { name: 'gpoa', maxCount: 1 },
            { name: 'projectProposal', maxCount: 1 }
        ]);

        console.log('✅ Fields middleware created successfully');
        console.log('📊 Fields middleware type:', typeof fieldsMiddleware);

        return true;
    } catch (error) {
        console.error('❌ Multer configuration failed:', error.message);
        return false;
    }
};

// Test file creation
const testFileCreation = async () => {
    console.log('\n🧪 Testing file creation...');

    try {
        const testDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testDir)) {
            await fs.mkdir(testDir, { recursive: true });
        }

        const testFile = path.join(testDir, 'test.pdf');
        await fs.writeFile(testFile, 'Test PDF content');

        console.log('✅ Test file created:', testFile);
        return true;
    } catch (error) {
        console.error('❌ File creation failed:', error.message);
        return false;
    }
};

// Run tests
const runTests = async () => {
    console.log('🚀 Starting Simple Multer Tests...');
    console.log('='.repeat(50));

    try {
        const configTest = testMulterConfig();
        const fileTest = await testFileCreation();

        console.log('\n📊 Test Results:');
        console.log('  Multer Config:', configTest ? '✅ PASS' : '❌ FAIL');
        console.log('  File Creation:', fileTest ? '✅ PASS' : '❌ FAIL');

        const allPassed = configTest && fileTest;
        console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

        return allPassed;
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        return false;
    }
};

// Export for use in other scripts
module.exports = {
    testMulterConfig,
    testFileCreation,
    runTests
};

// Run if called directly
if (require.main === module) {
    runTests();
}
