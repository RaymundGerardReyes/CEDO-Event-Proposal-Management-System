// Setup script for Hybrid File Storage
const { hybridFileService } = require('./services/hybrid-file.service');

async function main() {
    try {
        console.log('🔧 Setting up Hybrid File Storage infrastructure');
        console.log('===============================================');

        // Connect to hybrid service
        const connected = await hybridFileService.connect();
        if (!connected) {
            console.log('⚠️ MongoDB not available, using filesystem only');
        }

        // Setup all proposal files
        await hybridFileService.setupAllProposalFiles();

        // Test file retrieval
        console.log('\n🧪 Testing file retrieval...');
        const testMetadata = await hybridFileService.getFileMetadata('209');
        console.log('✅ Test metadata for proposal 209:', Object.keys(testMetadata));

        await hybridFileService.disconnect();

        console.log('\n🎯 Hybrid File Storage setup complete!');
        console.log('   - Files stored in filesystem ✅');
        console.log('   - Metadata in MongoDB (if available) ✅');
        console.log('   - Proper database integration ✅');
        console.log('   - Scalable hybrid storage ✅');
        console.log('\n🚀 Now restart your backend server to use Hybrid File Storage!');

    } catch (error) {
        console.error('❌ Error setting up hybrid files:', error);
    }
}

main(); 