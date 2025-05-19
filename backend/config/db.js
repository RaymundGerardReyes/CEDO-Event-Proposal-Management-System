// backend/config/db.js
const mysql = require("mysql2") // Import the mysql2 library
require("dotenv").config() // Ensure environment variables are loaded

console.log("Attempting to setup MySQL connection pool...") // Log startup step
console.log("Database connection parameters:", {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
  user: process.env.DB_USER || process.env.MYSQL_USER || "root",
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "cedo_auth",
  // Not logging password for security reasons
})

// Create the connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
  user: process.env.DB_USER || process.env.MYSQL_USER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "cedo_auth", // Database name
  waitForConnections: true, // If true, the pool will queue requests when no connections are available.
  connectionLimit: 10, // The maximum number of connections to create at once.
  queueLimit: 0, // The maximum number of requests the pool will queue before returning an error. 0 = unlimited.
})

// Optional: Add event listeners for pool status (useful for debugging connection issues)
pool.on("connection", (connection) => {
  console.log("DB CONNECTION made on thread %d", connection.threadId)
})

pool.on("acquire", (connection) => {
  // console.log('DB CONNECTION %d acquired from pool', connection.threadId);
})

pool.on("release", (connection) => {
  // console.log('DB CONNECTION %d released back to pool', connection.threadId);
})

pool.on("error", (err) => {
  console.error("MySQL Pool Error:", err.code, err.message)
  // Log pool errors. The pool should attempt to recover, but persistent errors indicate a problem.
  // This is a critical application error, consider more robust handling like alerting.
})

console.log("MySQL pool setup attempt finished.") // Log setup completion attempt

// Export the promise-based pool for use with async/await
module.exports = {
  pool: pool.promise(), // Export the pool object under the 'pool' property
}
