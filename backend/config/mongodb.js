const mongoose = require('mongoose');

const connectMongoDB = async () => {
    try {
        // MongoDB connection string
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cedo-partnership';

        console.log(`Connecting to MongoDB: ${mongoURI}`);

        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            // Remove deprecated options that are now defaults in newer versions
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log('✅ MongoDB connected successfully');

        // List collections for debugging
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available MongoDB collections:');
        if (collections.length === 0) {
            console.log('  No collections found (database may be empty)');
        } else {
            collections.forEach(collection => {
                console.log(`  - ${collection.name}`);
            });
        }

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('\nMongoDB Troubleshooting tips:');
        console.log('1. Make sure MongoDB service is running');
        console.log('2. Check if the connection string is correct');
        console.log('3. Verify MongoDB is installed');
        console.log('4. Try: mongod --dbpath ./data/db');

        // Don't exit in development, but log the error
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.warn('Continuing without MongoDB in development mode');
        }
    }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected to database');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

module.exports = { connectMongoDB, mongoose }; 