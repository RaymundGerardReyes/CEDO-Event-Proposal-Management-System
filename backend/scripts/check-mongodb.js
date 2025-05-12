const mongoose = require("mongoose")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

// Get MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/partnership-proposals"

console.log(`Attempting to connect to MongoDB at: ${mongoURI}`)

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB connection successful!")

    // List all collections
    mongoose.connection.db
      .listCollections()
      .toArray()
      .then((collections) => {
        console.log("Available collections:")
        if (collections.length === 0) {
          console.log("  No collections found (database may be empty)")
        } else {
          collections.forEach((collection) => {
            console.log(`  - ${collection.name}`)
          })
        }

        // Close connection
        mongoose.connection.close()
        console.log("Connection closed")
      })
      .catch((err) => {
        console.error("Error listing collections:", err)
        mongoose.connection.close()
      })
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message)

    // Provide troubleshooting tips
    console.log("\nTroubleshooting tips:")
    console.log("1. Make sure MongoDB is running")
    console.log("2. Check if the connection string is correct")
    console.log("3. Verify network connectivity")
    console.log("4. Check if authentication credentials are correct (if applicable)")

    process.exit(1)
  })
