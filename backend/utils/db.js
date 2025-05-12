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

    console.log(`MongoDB Connected: ${conn.connection.host}`)

    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`)
    })

    // Handle when the connection is disconnected
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected")
    })

    // If the Node process ends, close the MongoDB connection
    process.on("SIGINT", async () => {
      await mongoose.connection.close()
      console.log("MongoDB connection closed due to app termination")
      process.exit(0)
    })

    return conn
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
