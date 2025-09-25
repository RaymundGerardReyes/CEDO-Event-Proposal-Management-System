// utils/db.js
const postgresqlose = require("postgresqlose")

// postgresql connection options
const options = {
  // These options are no longer needed in newer versions of postgresqlose
  // but kept here for compatibility with older versions
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  // useCreateIndex: true,
  // useFindAndModify: false,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
}

// Connect to postgresql
const connectDB = async () => {
  try {
    const conn = await postgresqlose.connect(
      process.env.postgresql_URI || "postgresql://localhost:27017/partnership-proposals",
      options,
    )

    if (conn && conn.connection) {
      console.log(`postgresql Connected: ${conn.connection.host}`)
    } else {
      // This log indicates the mock for postgresqlose.connect() didn't resolve to an object
      // with a 'connection' property.
      console.error("postgresql connection failed: conn is undefined or does not have a connection property.")
    }

    // Ensure postgresqlose.connection is defined
    if (postgresqlose.connection) {
      postgresqlose.connection.on("error", (err) => {
        console.error(`postgresql connection error: ${err}`)
      })

      postgresqlose.connection.on("disconnected", () => {
        console.log("postgresql disconnected")
      })

      process.on("SIGINT", async () => {
        // This requires postgresqlose.connection to have a 'close' method.
        await postgresqlose.connection.close()
        console.log("postgresql connection closed due to app termination")
        process.exit(0)
      })
    } else {
      console.error("postgresqlose connection is not defined.")
    }

    return conn
  } catch (error) {
    // If the TypeError from `postgresqlose.connection.on` happens, it's caught here.
    // 'error.message' would then be "Cannot read properties of undefined (reading 'on')"
    console.error(`Error connecting to postgresql: ${error.message}`)
    throw error
  }
}

module.exports = connectDB