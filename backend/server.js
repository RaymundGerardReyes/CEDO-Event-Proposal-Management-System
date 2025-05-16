const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("path")
require("dotenv").config() // Load environment variables

// Require database config and routes from the root backend directory
const { pool } = require("./config/db") // Path adjusted based on your structure
const authRoutes = require("./routes/auth") // Path adjusted based on your structure
const userRoutes = require("./routes/users") // Path adjusted based on your structure
const proposalRoutes = require("./routes/proposals") // Path adjusted based on your structure
const errorHandler = require('./middleware/error-handler');

const app = express()
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend
  credentials: true
})) // Enables CORS for all origins (adjust in production)
app.use(express.json()) // Parses JSON bodies
app.use(morgan("dev")) // Logs HTTP requests in development mode

// Test DB connection
async function testConnection() {
  // Explicitly check if pool was successfully imported and is not undefined
  // This helps catch issues in config/db.js itself if it fails before exporting
  if (!pool) {
    console.error("MySQL connection failed: Database pool is undefined after require.");
    console.log("\nTroubleshooting tips:");
    console.log("Ensure backend/config/db.js is correctly setting up and exporting the pool.");
    // If pool isn't even defined, we cannot proceed
    process.exit(1);
  }

  try {
    // Use pool.query from the promise-based pool
    await pool.query("SELECT 1"); // Simple query to test the connection
    console.log("MySQL database connected successfully");
  } catch (err) {
    console.error("MySQL connection failed:", err.message); // Log the specific error message
    console.log("\nTroubleshooting tips:");
    console.log("1. Make sure MySQL server is running.");
    console.log("2. Check your MySQL credentials (MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD) in the .env file.");
    console.log(`3. Ensure the database "${process.env.MYSQL_DATABASE || 'cedo_auth'}" exists (run 'npm run init-db').`);
    console.log('4. If using "localhost", try using "127.0.0.1" instead in .env.');
    console.log("5. Check your MySQL user privileges (needs SELECT on the database).");
    console.log("6. See the full error details above for more clues.");

    // Exit only in production or if database is critical and cannot connect at all
    // Keeping it running in dev might allow you to fix and hot-reload,
    // but routes interacting with the DB will fail.
    // A more robust app might defer starting the server until the DB is ready.
    if (process.env.NODE_ENV === "production") {
      console.error("Exiting process due to critical database connection failure in production.");
      process.exit(1);
    } else {
      console.warn("Continuing in development mode despite database connection failure. API routes requiring the DB will fail.");
    }
  }
}

// Run database connection test immediately on server start
// Consider awaiting this in production if the server MUST NOT start without a DB connection
testConnection();


// Define routes
app.use("/api/auth", authRoutes) // Use the imported auth router
app.use("/api/users", userRoutes) // Use the imported users router
app.use("/api/proposals", proposalRoutes) // Use the imported proposals router


// Add other routes here if you have more (e.g., app.use("/api/uploads", uploadRoutes))

// Error handling middleware
// This should be the last middleware added
app.use(errorHandler);

// Serve static assets in production
// Assumes 'backend' and 'frontend' are sibling directories
if (process.env.NODE_ENV === "production") {
  // Serve the frontend's build folder
  app.use(express.static(path.join(__dirname, "../frontend/build"))); // Path from backend/ to frontend/build

  // For any other GET request not handled by the API, serve the frontend's index.html
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html")); // Path from backend/ to index.html
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
  console.log(`API base URL: http://localhost:${PORT}/api`)

  if (process.env.NODE_ENV === "development") {
    // Listing routes can be helpful in dev
    console.log("\nConfigured API Routes:");
    console.log(`- /api/auth: Authentication & User management via Auth`);
    console.log(`- /api/users: User data access`);
    console.log(`- /api/proposals: Proposal management`);
    // Add other routes here
    console.log("\nAccess the API endpoints using tools like Postman or your frontend application.");
  }
})

module.exports = app // Export the express app instance (useful for testing)