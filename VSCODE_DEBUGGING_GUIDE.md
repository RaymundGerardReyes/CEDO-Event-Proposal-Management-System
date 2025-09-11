# 🚀 VS Code JavaScript Debugging Configuration Guide

## 📋 Overview
This guide provides a complete JavaScript debugging setup for your CEDO Google Auth full-stack application with:
- **Frontend**: Next.js on port 3000
- **Backend**: Express.js on port 5000
- **Debug Port**: 9229 (Node.js Inspector)

## 🛠️ Configuration Files Created

### 1. `.vscode/tasks.json`
- **Start Frontend Server**: Runs Next.js dev server
- **Start Backend Server**: Runs Express.js dev server
- **Start Backend Server (Debug)**: Runs with Node.js inspector
- **Start Full Stack (Debug)**: Runs both with debugging enabled
- **Install All Dependencies**: Installs all project dependencies
- **Setup Databases**: Initializes database connections
- **Health Check**: Verifies server status
- **Run Tests**: Executes test suites
- **Lint Code**: Code quality checks
- **Build Project**: Production build

### 2. `.vscode/launch.json`
- **🚀 Launch Frontend (Chrome)**: Debug frontend in Chrome
- **🔧 Attach to Backend (Node.js)**: Attach to running backend
- **🎯 Debug Backend Only**: Launch backend with debugging
- **🌐 Full Stack Debug**: Debug both frontend and backend
- **🧪 Debug Frontend Tests**: Debug frontend test suite
- **🔬 Debug Backend Tests**: Debug backend test suite
- **📊 Debug with Performance Profiling**: Performance analysis
- **🔍 Debug with Memory Analysis**: Memory profiling

### 3. `.vscode/settings.json`
- Debug console configuration
- File associations
- ESLint integration
- Search exclusions
- Terminal configuration for Windows

## 🎯 How to Use

### Quick Start
1. **Open VS Code** in your project root
2. **Press F5** or go to Run and Debug view (`Ctrl+Shift+D`)
3. **Select a configuration** from the dropdown
4. **Click the play button** or press F5

### Recommended Debug Configurations

#### 🚀 For Frontend Development
```
🚀 Launch Frontend (Chrome)
```
- Automatically starts frontend server
- Opens Chrome with debugging enabled
- Breakpoints work in React/Next.js components
- Hot reloading enabled

#### 🔧 For Backend Development
```
🔧 Attach to Backend (Node.js)
```
- Attaches to running backend server
- Set breakpoints in Express.js routes
- Debug API endpoints
- Monitor database queries

#### 🌐 For Full Stack Development
```
🌐 Full Stack Debug (Frontend + Backend)
```
- Debugs both frontend and backend simultaneously
- Perfect for API integration testing
- End-to-end debugging experience

### Advanced Debugging

#### 🧪 Testing
```
🧪 Debug Frontend Tests
🔬 Debug Backend Tests
```
- Debug individual test cases
- Step through test logic
- Identify test failures

#### 📊 Performance Analysis
```
📊 Debug with Performance Profiling
```
- CPU profiling enabled
- Memory usage monitoring
- Performance bottleneck identification

## 🔧 Debugging Features

### Breakpoints
- **Line Breakpoints**: Click in gutter or press F9
- **Conditional Breakpoints**: Right-click → "Add Conditional Breakpoint"
- **Logpoints**: Right-click → "Add Logpoint" (no stop, just log)
- **Inline Breakpoints**: Set breakpoints in complex expressions

### Debug Console
- **Evaluate Expressions**: Type JavaScript expressions
- **Inspect Variables**: Hover over variables
- **Call Stack**: Navigate through function calls
- **Watch Variables**: Add variables to watch panel

### Step Controls
- **F10**: Step Over (next line)
- **F11**: Step Into (enter function)
- **Shift+F11**: Step Out (exit function)
- **F5**: Continue execution
- **Shift+F5**: Stop debugging

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill processes on ports 3000, 5000, 9229
npx kill-port 3000 5000 9229
```

#### 2. Backend Not Attaching
- Ensure backend is running with `--inspect=9229`
- Check if port 9229 is available
- Verify Node.js version (>=18.17.0)

#### 3. Frontend Not Loading
- Check if Next.js dev server is running
- Verify port 3000 is available
- Clear browser cache

#### 4. Breakpoints Not Working
- Ensure source maps are enabled
- Check file paths match exactly
- Restart debug session

### Debug Commands
```bash
# Start with debugging
npm run dev:full-debug

# Backend only with debugging
npm run debug:backend-only

# Backend with breakpoint on start
npm run debug:backend-wait

# Frontend with debugging
npm run debug:frontend-only
```

## 📁 Project Structure
```
CEDO Google Auth/
├── .vscode/
│   ├── tasks.json          # Build and run tasks
│   ├── launch.json         # Debug configurations
│   └── settings.json       # VS Code settings
├── frontend/               # Next.js app (port 3000)
├── backend/                # Express.js API (port 5000)
└── package.json           # Root package with debug scripts
```

## 🎉 Success Indicators

### Frontend Debugging
- ✅ Chrome opens with your app
- ✅ Breakpoints hit in React components
- ✅ Variables show in debug panel
- ✅ Console shows debug output

### Backend Debugging
- ✅ Backend starts with inspector
- ✅ Breakpoints hit in API routes
- ✅ Database queries visible
- ✅ Request/response data inspectable

### Full Stack Debugging
- ✅ Both frontend and backend debug simultaneously
- ✅ API calls traceable from frontend to backend
- ✅ State changes visible across stack
- ✅ Error handling debuggable end-to-end

## 🔗 Useful Extensions
- **Debugger for Chrome**: Frontend debugging
- **Node.js Debug**: Backend debugging
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Thunder Client**: API testing
- **GitLens**: Git integration

## 📞 Support
If you encounter issues:
1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Ensure ports 3000, 5000, and 9229 are available
4. Check VS Code console for error messages
5. Restart VS Code and try again

Happy Debugging! 🐛✨
