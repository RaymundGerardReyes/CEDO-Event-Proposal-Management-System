# 🔧 Browser Debugging Troubleshooting Guide

## 🚨 "Unable to attach to browser" Error Solutions

This guide addresses the common "Unable to attach to browser" error and provides multiple solutions to get your frontend debugging working.

## 🎯 Quick Fixes (Try These First)

### 1. Use the New "Clean Chrome" Configuration
- Select **"🌐 Launch Frontend (Next.js) - Chrome (Clean)"** from the debug dropdown
- This configuration disables extensions and plugins that might interfere
- Uses a different port (9223) to avoid conflicts

### 2. Manual Browser Launch Method
If automatic launching fails, use the manual attach method:

#### For Chrome:
1. **Close all Chrome instances**
2. **Open Command Prompt/Terminal** and run:
   ```bash
   # Windows
   chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
   
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
   
   # Linux
   google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug"
   ```
3. **In Cursor AI**: Select **"🔗 Attach to Chrome (Manual Launch)"**
4. **Press F5** to attach

#### For Edge:
1. **Close all Edge instances**
2. **Open Command Prompt/Terminal** and run:
   ```bash
   # Windows
   msedge.exe --remote-debugging-port=9224 --user-data-dir="C:\temp\edge-debug"
   ```
3. **In Cursor AI**: Select **"🔗 Attach to Edge (Manual Launch)"**
4. **Press F5** to attach

## 🔍 Detailed Troubleshooting Steps

### Step 1: Check Prerequisites

#### Verify Frontend is Running
```bash
cd frontend
npm run dev
```
Ensure your Next.js app is running on `http://localhost:3000`

#### Check Browser Extensions
- Install **"Debugger for Chrome"** extension in Cursor AI
- Install **"Debugger for Edge"** extension if using Edge
- Disable other debugging extensions that might conflict

### Step 2: Port Conflicts

#### Check if Ports are in Use
```bash
# Windows
netstat -ano | findstr :9222
netstat -ano | findstr :9223
netstat -ano | findstr :9224

# macOS/Linux
lsof -i :9222
lsof -i :9223
lsof -i :9224
```

#### Kill Conflicting Processes
```bash
# Windows - Replace PID with actual process ID
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

### Step 3: Browser Path Issues

#### Find Chrome Installation Path
```bash
# Windows
where chrome
where chrome.exe

# macOS
which google-chrome
ls /Applications/Google\ Chrome.app/Contents/MacOS/

# Linux
which google-chrome
which chromium-browser
```

#### Update VS Code Settings
Add to your VS Code settings.json:
```json
{
    "debug.chrome.executable": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "debug.edge.executable": "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
}
```

### Step 4: User Data Directory Issues

#### Clear Browser Profiles
The new configurations use dedicated debug profiles:
- Chrome: `${workspaceFolder}/.vscode/chrome-debug-profile`
- Edge: `${workspaceFolder}/.vscode/edge-debug-profile`

#### Manual Cleanup
```bash
# Delete debug profiles if they exist
rm -rf .vscode/chrome-debug-profile
rm -rf .vscode/edge-debug-profile
```

### Step 5: Windows-Specific Issues

#### Run as Standard User
- **Don't run Cursor AI as Administrator**
- This can cause permission issues with browser debugging

#### Windows Defender/Firewall
- Add Cursor AI to Windows Defender exclusions
- Allow Chrome/Edge through Windows Firewall

#### Antivirus Software
- Temporarily disable antivirus to test
- Add Cursor AI and browser executables to exclusions

## 🛠 Alternative Debugging Methods

### Method 1: Node.js Debugging (Backend Only)
If browser debugging continues to fail, focus on backend debugging:
1. Select **"🚀 Launch Backend Server (Node.js)"**
2. Set breakpoints in your API routes
3. Use Postman or browser to make API calls
4. Debug backend logic without frontend debugging

### Method 2: Console Debugging
Use browser developer tools for frontend debugging:
1. Open your app in browser normally
2. Press `F12` to open DevTools
3. Use `console.log()`, `debugger;` statements
4. Set breakpoints in Sources tab

### Method 3: React DevTools
Install React Developer Tools browser extension:
1. Install from Chrome Web Store
2. Open your React app
3. Use Components and Profiler tabs
4. Debug React state and props

### Method 4: Network Debugging
Monitor API calls without debugging:
1. Open DevTools → Network tab
2. Monitor all API requests
3. Check request/response data
4. Use Console tab for JavaScript errors

## 🔧 Advanced Configuration

### Custom Chrome Launch Arguments
If you need custom Chrome arguments, modify the launch.json:

```json
{
    "name": "🌐 Custom Chrome Debug",
    "type": "chrome",
    "request": "launch",
    "url": "http://localhost:3000",
    "webRoot": "${workspaceFolder}/frontend",
    "sourceMaps": true,
    "userDataDir": "${workspaceFolder}/.vscode/chrome-custom",
    "runtimeArgs": [
        "--remote-debugging-port=9225",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding"
    ],
    "timeout": 30000
}
```

### Environment-Specific Configurations

#### Development Environment
```json
{
    "name": "🌐 Dev Environment",
    "type": "chrome",
    "request": "launch",
    "url": "http://localhost:3000",
    "webRoot": "${workspaceFolder}/frontend",
    "sourceMaps": true,
    "env": {
        "NODE_ENV": "development"
    }
}
```

#### Staging Environment
```json
{
    "name": "🌐 Staging Environment",
    "type": "chrome",
    "request": "launch",
    "url": "http://localhost:3001",
    "webRoot": "${workspaceFolder}/frontend",
    "sourceMaps": true,
    "env": {
        "NODE_ENV": "staging"
    }
}
```

## 🚨 Emergency Fallback

If all debugging methods fail, use this minimal setup:

### 1. Backend-Only Debugging
```json
{
    "name": "🚀 Backend Only (Emergency)",
    "type": "node",
    "request": "launch",
    "program": "${workspaceFolder}/backend/server.js",
    "cwd": "${workspaceFolder}/backend",
    "console": "integratedTerminal",
    "env": {
        "NODE_ENV": "development"
    }
}
```

### 2. Console-Based Frontend Debugging
Add this to your React components:
```jsx
// Add to your component
useEffect(() => {
    console.log('Component mounted');
    console.log('Props:', props);
    console.log('State:', state);
}, []);

// Add to event handlers
const handleClick = () => {
    console.log('Button clicked');
    debugger; // This will pause execution if DevTools is open
    // Your code here
};
```

## 📋 Debugging Checklist

Before reporting issues, verify:

- [ ] Frontend server is running on port 3000
- [ ] Chrome/Edge is not already running
- [ ] No other processes using ports 9222, 9223, 9224
- [ ] Debugger extensions are installed
- [ ] Cursor AI is not running as Administrator
- [ ] Antivirus is not blocking the connection
- [ ] Browser executable path is correct
- [ ] User data directory is writable

## 🆘 Getting Help

### Cursor AI Features
- **Auto Terminal Debug**: Hover over terminal errors
- **AI Debug Support**: Enable in Command Palette
- **Error Analysis**: AI can analyze browser connection errors

### Community Resources
- [VS Code Chrome Debugging](https://code.visualstudio.com/docs/nodejs/browser-debugging)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Next.js Debugging](https://nextjs.org/docs/advanced-features/debugging)

### Common Error Messages and Solutions

| Error Message | Solution |
|---------------|----------|
| "Unable to attach to browser" | Use manual launch method |
| "Port already in use" | Kill conflicting processes |
| "Browser not found" | Check browser path in settings |
| "Permission denied" | Don't run as Administrator |
| "Timeout waiting for browser" | Increase timeout, check firewall |

## 🎉 Success Indicators

You'll know debugging is working when:
- ✅ Browser opens automatically with debugging enabled
- ✅ Breakpoints are hit when code executes
- ✅ Variables panel shows current scope
- ✅ Call stack shows function hierarchy
- ✅ Debug console accepts expressions

---

**Remember**: Browser debugging can be tricky, but with these multiple approaches, you should be able to get it working. Start with the "Clean Chrome" configuration and work through the troubleshooting steps if needed.

