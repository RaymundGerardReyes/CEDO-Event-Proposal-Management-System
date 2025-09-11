# 🐛 Complete Debugging Guide for CEDO Google Auth Project

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Backend Debugging](#backend-debugging)
3. [Frontend Debugging](#frontend-debugging)
4. [Full Stack Debugging](#full-stack-debugging)
5. [Testing Debugging](#testing-debugging)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Advanced Debugging Techniques](#advanced-debugging-techniques)

## 🚀 Quick Start

### Prerequisites
- **Cursor AI** with debugging extensions installed
- **Chrome/Edge** browser for frontend debugging
- **Node.js** (v18.17.0+) installed
- Project dependencies installed (`npm install` in both frontend and backend)

### Basic Setup
1. **Open Debug Panel**: Press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
2. **Select Configuration**: Choose from the dropdown menu
3. **Set Breakpoints**: Click on line numbers to set breakpoints
4. **Start Debugging**: Press `F5` or click the green play button

## 🔧 Backend Debugging

### Available Configurations

#### 1. 🚀 Launch Backend Server (Node.js)
- **Purpose**: Debug the main server.js file
- **Entry Point**: `backend/server.js`
- **Port**: 5000 (default)
- **Best For**: General backend development and API debugging

**How to Use:**
1. Set breakpoints in your backend code
2. Select "🚀 Launch Backend Server (Node.js)" from debug dropdown
3. Press `F5` to start debugging
4. Server will start with debugging enabled

#### 2. 🔧 Launch Backend with Nodemon
- **Purpose**: Debug with auto-restart on file changes
- **Entry Point**: Uses nodemon for hot reloading
- **Best For**: Development with frequent code changes

**How to Use:**
1. Select "🔧 Launch Backend with Nodemon"
2. Press `F5` to start
3. Code will auto-restart when you save files

#### 3. 🔗 Attach to Backend Process
- **Purpose**: Attach debugger to already running backend
- **Port**: 9229
- **Best For**: When backend is already running

**How to Use:**
1. Start backend manually: `cd backend && npm run dev`
2. Select "🔗 Attach to Backend Process"
3. Press `F5` to attach

### Backend Debugging Tips

#### Setting Breakpoints
```javascript
// In your backend code (e.g., controllers, routes, middleware)
app.get('/api/users', (req, res) => {
    // Set breakpoint here by clicking on line number
    const users = await User.find();
    res.json(users);
});
```

#### Debugging API Routes
1. Set breakpoints in route handlers
2. Use Postman or browser to make requests
3. Debugger will pause at breakpoints
4. Inspect `req`, `res`, and variables in Variables panel

#### Environment Variables
- Debug configurations include `NODE_ENV=development`
- Check `.env` files in backend directory
- Use Debug Console to inspect environment variables

## 🌐 Frontend Debugging

### Available Configurations

#### 1. 🌐 Launch Frontend (Next.js) - Chrome
- **Purpose**: Debug Next.js application in Chrome
- **URL**: http://localhost:3000
- **Best For**: General frontend development

**How to Use:**
1. Ensure frontend is running: `cd frontend && npm run dev`
2. Select "🌐 Launch Frontend (Next.js) - Chrome"
3. Press `F5` to launch Chrome with debugging
4. Set breakpoints in your React components

#### 2. 🌐 Launch Frontend (Next.js) - Edge
- **Purpose**: Debug Next.js application in Edge
- **URL**: http://localhost:3000
- **Best For**: Cross-browser testing

#### 3. 🔗 Attach to Frontend Process
- **Purpose**: Attach to already running frontend
- **Port**: 9222
- **Best For**: When frontend is already running

### Frontend Debugging Tips

#### Setting Breakpoints in React Components
```jsx
// In your React components
function UserProfile({ user }) {
    // Set breakpoint here
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (data) => {
        // Set breakpoint here to debug form submission
        setLoading(true);
        try {
            const response = await api.updateUser(data);
            // Debug response here
        } catch (error) {
            // Debug error handling here
        }
    };
    
    return (
        <div>
            {/* Component JSX */}
        </div>
    );
}
```

#### Debugging API Calls
1. Set breakpoints in API call functions
2. Use Network tab in browser dev tools
3. Inspect request/response data in Variables panel

#### State Debugging
- Use React DevTools extension
- Set breakpoints in state setters
- Inspect component props and state in Variables panel

## 🚀 Full Stack Debugging

### Compound Configuration
- **Name**: "🚀 Debug Full Stack Application"
- **Purpose**: Debug both frontend and backend simultaneously
- **Best For**: End-to-end debugging

**How to Use:**
1. Select "🚀 Debug Full Stack Application"
2. Press `F5`
3. Both frontend and backend will start with debugging enabled
4. Set breakpoints in both frontend and backend code

### Full Stack Debugging Workflow
1. **Start Full Stack Debug**: Use compound configuration
2. **Set Backend Breakpoints**: In API routes, controllers, middleware
3. **Set Frontend Breakpoints**: In components, hooks, API calls
4. **Trigger Actions**: Use the frontend to trigger backend calls
5. **Debug Flow**: Step through both frontend and backend code

## 🧪 Testing Debugging

### Backend Tests
- **Configuration**: "🧪 Debug Backend Tests"
- **Test Runner**: Vitest
- **Best For**: Debugging test failures

**How to Use:**
1. Set breakpoints in test files
2. Select "🧪 Debug Backend Tests"
3. Press `F5` to run tests with debugging

### Frontend Tests
- **Configuration**: "🧪 Debug Frontend Tests"
- **Test Runner**: Vitest
- **Best For**: Debugging component tests

## 🔍 Common Issues & Solutions

### Issue 1: "Cannot connect to runtime process"
**Solution:**
1. Ensure backend is running on correct port (5000)
2. Check if port 9229 is available
3. Restart the debugger

### Issue 2: "Source maps not found"
**Solution:**
1. Ensure `sourceMaps: true` in launch.json
2. Check if Next.js is generating source maps
3. Restart the frontend development server

### Issue 3: "Breakpoints not hitting"
**Solution:**
1. Ensure code is actually executing
2. Check if breakpoints are set in correct files
3. Verify file paths in launch.json

### Issue 4: "Chrome debugging not working"
**Solution:**
1. Install "Debugger for Chrome" extension
2. Ensure Chrome is not already running
3. Check if port 3000 is available

## 🛠 Advanced Debugging Techniques

### 1. Conditional Breakpoints
- Right-click on breakpoint
- Add condition (e.g., `user.id === 123`)
- Breakpoint will only trigger when condition is true

### 2. Logpoints
- Right-click on line number
- Select "Add Logpoint"
- Add expression to log (e.g., `User: {user.name}`)
- No need to modify code

### 3. Watch Expressions
- Add variables to Watch panel
- Monitor values as you step through code
- Useful for complex objects

### 4. Call Stack Navigation
- Use Call Stack panel to navigate through function calls
- Click on different stack frames to inspect variables
- Understand execution flow

### 5. Debug Console
- Use Debug Console to evaluate expressions
- Test code snippets during debugging
- Inspect variables and objects

## 📝 Debugging Best Practices

### 1. Start Simple
- Begin with basic breakpoints
- Gradually add more complex debugging techniques
- Don't over-debug - focus on the problem

### 2. Use Descriptive Breakpoint Names
- Add comments near breakpoints
- Use conditional breakpoints for specific scenarios
- Remove breakpoints when done

### 3. Debug in Layers
- Start with the error/issue
- Work backwards through the call stack
- Debug one layer at a time

### 4. Use Console Logging
- Add strategic console.log statements
- Use different log levels (info, warn, error)
- Remove logs when debugging is complete

### 5. Test Edge Cases
- Debug with different input values
- Test error conditions
- Verify both success and failure paths

## 🎯 Quick Reference

### Keyboard Shortcuts
- `F5`: Start debugging
- `F10`: Step over
- `F11`: Step into
- `Shift+F11`: Step out
- `Ctrl+Shift+F5`: Restart debugging
- `Shift+F5`: Stop debugging

### Debug Panel Sections
- **Variables**: Current scope variables
- **Watch**: Custom expressions to monitor
- **Call Stack**: Function call hierarchy
- **Breakpoints**: List of all breakpoints
- **Debug Console**: Execute expressions

### Useful VS Code Extensions
- **Debugger for Chrome**: Chrome debugging
- **Debugger for Edge**: Edge debugging
- **Node.js Debug**: Enhanced Node.js debugging
- **React Developer Tools**: React component debugging

## 🆘 Getting Help

### Cursor AI Features
- **Auto Terminal Debug**: Hover over terminal errors and click "Auto debug"
- **AI Debug Support**: Enable in Command Palette (`Ctrl+Shift+P`)
- **Error Analysis**: AI can analyze errors and suggest fixes

### Community Resources
- [Cursor AI Documentation](https://docs.cursor.com/)
- [VS Code Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)

---

## 🎉 You're Ready to Debug!

With this setup, you can now debug both your frontend and backend JavaScript code effectively in Cursor AI. Start with the basic configurations and gradually explore the advanced features as you become more comfortable with debugging.

Remember: **Debugging is a skill that improves with practice**. Don't hesitate to experiment with different debugging techniques and configurations!
