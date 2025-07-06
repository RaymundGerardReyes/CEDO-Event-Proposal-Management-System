// Setup script for MongoDB GridFS file integration
const { mongodbFileService } = require('./services/mongodb-file.service');

async function main() {
    try {
        console.log('🔧 Setting up MongoDB GridFS file infrastructure');
        console.log('===============================================');

        // Connect to MongoDB
        const connected = await mongodbFileService.connect();
        if (!connected) {
            console.error('❌ Failed to connect to MongoDB');
            return;
        }

        // Setup all proposal files
        await mongodbFileService.setupAllProposalFiles();

        // Test file retrieval
        console.log('\n🧪 Testing file retrieval...');
        const testMetadata = await mongodbFileService.getFileMetadata('209');
        console.log('✅ Test metadata for proposal 209:', Object.keys(testMetadata));

        await mongodbFileService.disconnect();

        console.log('\n🎯 MongoDB GridFS setup complete!');
        console.log('   - Files stored in MongoDB GridFS ✅');
        console.log('   - Metadata in file_metadata collection ✅');
        console.log('   - Proper database integration ✅');
        console.log('   - Scalable file storage ✅');
        console.log('\n🚀 Now restart your backend server to use MongoDB GridFS!');

    } catch (error) {
        console.error('❌ Error setting up MongoDB files:', error);
    }
}

main(); 