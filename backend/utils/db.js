// utils/db.js
const mongoose = require("mongoose")

// MongoDB connection options
const options = {
  // These options are no longer needed in newer versions of Mongoose
  // but kept here for compatibility with older versions
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  // useCreateIndex: true,
  // useFindAndModify: false,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/partnership-proposals",
      options,
    )

    if (conn && conn.connection) {
      console.log(`MongoDB Connected: ${conn.connection.host}`)
    } else {
      // This log indicates the mock for mongoose.connect() didn't resolve to an object
      // with a 'connection' property.
      console.error("MongoDB connection failed: conn is undefined or does not have a connection property.")
    }

    // Ensure mongoose.connection is defined
    if (mongoose.connection) {
      mongoose.connection.on("error", (err) => {
        console.error(`MongoDB connection error: ${err}`)
      })

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected")
      })

      process.on("SIGINT", async () => {
        // This requires mongoose.connection to have a 'close' method.
        await mongoose.connection.close()
        console.log("MongoDB connection closed due to app termination")
        process.exit(0)
      })
    } else {
      console.error("Mongoose connection is not defined.")
    }

    return conn
  } catch (error) {
    // If the TypeError from `mongoose.connection.on` happens, it's caught here.
    // 'error.message' would then be "Cannot read properties of undefined (reading 'on')"
    console.error(`Error connecting to MongoDB: ${error.message}`)
    throw error
  }
}

module.exports = connectDB