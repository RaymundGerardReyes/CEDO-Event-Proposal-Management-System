const { exec } = require("child_process")
const os = require("os")

// Get the port from command line arguments or use default
const port = process.argv[2] || 5000

// Determine the command based on the operating system
const command =
  os.platform() === "win32" ? `netstat -ano | findstr :${port} | findstr LISTENING` : `lsof -i :${port} | grep LISTEN`

console.log(`Attempting to find and kill processes on port ${port}...`)

// Execute the command to find processes
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.log(`No processes found on port ${port}`)
    return
  }

  if (stderr) {
    console.error(`Error: ${stderr}`)
    return
  }

  // Parse the output to get PIDs
  let pids = []

  if (os.platform() === "win32") {
    // Windows format: parse the last column for PID
    pids = stdout
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const parts = line.trim().split(/\s+/)
        return parts[parts.length - 1]
      })
  } else {
    // Unix format: parse the second column for PID
    pids = stdout
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.trim().split(/\s+/)[1])
  }

  // Remove duplicates
  pids = [...new Set(pids)]

  if (pids.length === 0) {
    console.log(`No processes found on port ${port}`)
    return
  }

  console.log(`Found processes on port ${port}: ${pids.join(", ")}`)

  // Kill each process
  pids.forEach((pid) => {
    const killCommand = os.platform() === "win32" ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`

    exec(killCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to kill process ${pid}: ${error}`)
        return
      }

      if (stderr) {
        console.error(`Error killing process ${pid}: ${stderr}`)
        return
      }

      console.log(`Successfully killed process ${pid}`)
    })
  })
})
