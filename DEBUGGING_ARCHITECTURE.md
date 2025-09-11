# 🏗️ Debugging Architecture Overview

## Project Structure
```
CEDO Google Auth/
├── .vscode/
│   ├── launch.json          # Debug configurations
│   └── tasks.json           # Development tasks
├── backend/                 # Node.js/Express API
│   ├── server.js           # Main entry point
│   ├── controllers/        # API controllers
│   ├── routes/            # API routes
│   └── middleware/        # Express middleware
├── frontend/              # Next.js React App
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # React components
│   │   └── pages/        # Next.js pages
│   └── next.config.js    # Next.js configuration
└── DEBUGGING_GUIDE.md    # Comprehensive guide
```

## Debugging Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CURSOR AI DEBUGGER                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEBUG CONFIGURATIONS                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   🚀 BACKEND    │  │   🌐 FRONTEND   │  │  🚀 FULL STACK  │ │
│  │   Node.js       │  │   Next.js       │  │   Both Apps     │ │
│  │   Port: 5000    │  │   Port: 3000    │  │   Combined      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEBUGGING TARGETS                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                BACKEND DEBUGGING                        │   │
│  │                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   server.js │    │ controllers │    │ middleware  │  │   │
│  │  │   (Entry)   │───▶│   (API)     │───▶│ (Auth, etc) │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  │         │                   │                   │        │   │
│  │         ▼                   ▼                   ▼        │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   Routes    │    │   Models    │    │   Utils     │  │   │
│  │  │   (Express) │    │ (Database)  │    │ (Helpers)   │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                FRONTEND DEBUGGING                       │   │
│  │                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   Pages     │    │ Components  │    │   Hooks     │  │   │
│  │  │ (Next.js)   │───▶│  (React)    │───▶│ (Custom)    │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  │         │                   │                   │        │   │
│  │         ▼                   ▼                   ▼        │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │   │
│  │  │   API Calls │    │   State     │    │   Utils     │  │   │
│  │  │ (Axios)     │    │ (React)     │    │ (Helpers)   │  │   │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEBUGGING TOOLS                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Breakpoints │  │   Variables │  │ Call Stack  │            │
│  │   (F9)      │  │   Panel     │  │   Panel     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Watch     │  │   Console   │  │   Network   │            │
│  │ Expressions │  │   Output    │  │   Tab       │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Debugging Configurations Explained

### 🚀 Backend Configurations
1. **Launch Backend Server (Node.js)**
   - Directly launches `server.js` with debugging
   - Best for: General API development
   - Port: 5000 (backend), 9229 (debugger)

2. **Launch Backend with Nodemon**
   - Uses nodemon for auto-restart
   - Best for: Development with frequent changes
   - Auto-restarts on file changes

3. **Attach to Backend Process**
   - Attaches to already running backend
   - Best for: When backend is already running
   - Useful for production debugging

### 🌐 Frontend Configurations
1. **Launch Frontend (Next.js) - Chrome**
   - Launches Chrome with debugging enabled
   - Best for: General frontend development
   - Port: 3000 (frontend), 9222 (debugger)

2. **Launch Frontend (Next.js) - Edge**
   - Launches Edge with debugging enabled
   - Best for: Cross-browser testing
   - Alternative to Chrome

3. **Attach to Frontend Process**
   - Attaches to already running frontend
   - Best for: When frontend is already running

### 🚀 Full Stack Configuration
- **Debug Full Stack Application**
  - Launches both frontend and backend
  - Best for: End-to-end debugging
  - Compound configuration

## Debugging Workflow

### 1. Setting Up Breakpoints
```
Backend (server.js):
app.get('/api/users', (req, res) => {
    // 🔴 Set breakpoint here
    const users = await User.find();
    res.json(users);
});

Frontend (component):
function UserList() {
    // 🔴 Set breakpoint here
    const [users, setUsers] = useState([]);
    
    useEffect(() => {
        // 🔴 Set breakpoint here
        fetchUsers();
    }, []);
}
```

### 2. Starting Debug Session
1. Open Debug Panel (`Ctrl+Shift+D`)
2. Select configuration from dropdown
3. Press `F5` to start debugging
4. Set breakpoints in your code
5. Trigger the code execution

### 3. Debugging Session
- **Variables Panel**: Inspect current scope variables
- **Watch Panel**: Monitor specific expressions
- **Call Stack**: Navigate through function calls
- **Debug Console**: Execute expressions
- **Network Tab**: Monitor API calls

## Port Configuration

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 5000 | Main API server |
| Frontend | 3000 | Next.js development server |
| Backend Debugger | 9229 | Node.js debugger |
| Frontend Debugger | 9222 | Chrome/Edge debugger |

## Common Debugging Scenarios

### Scenario 1: API Route Debugging
```
1. Set breakpoint in route handler
2. Use Postman/browser to make request
3. Debugger pauses at breakpoint
4. Inspect req, res, and variables
5. Step through code execution
```

### Scenario 2: Component State Debugging
```
1. Set breakpoint in component
2. Trigger component re-render
3. Debugger pauses at breakpoint
4. Inspect props, state, and hooks
5. Step through component logic
```

### Scenario 3: Full Stack Flow Debugging
```
1. Set breakpoints in both frontend and backend
2. Use compound configuration
3. Trigger action from frontend
4. Debug frontend code first
5. Follow API call to backend
6. Debug backend code
7. Follow response back to frontend
```

## Tips for Effective Debugging

1. **Start with the Error**: Begin debugging where the error occurs
2. **Use Conditional Breakpoints**: Set breakpoints that only trigger under specific conditions
3. **Log Important Values**: Use console.log for quick debugging
4. **Step Through Code**: Use F10 (step over) and F11 (step into)
5. **Inspect Variables**: Use the Variables panel to understand data flow
6. **Use Watch Expressions**: Monitor specific variables or expressions
7. **Debug in Layers**: Start with the surface issue and work deeper

## Troubleshooting

### Common Issues
- **Breakpoints not hitting**: Ensure code is actually executing
- **Source maps not found**: Check if source maps are enabled
- **Cannot connect to debugger**: Verify ports are available
- **Chrome debugging fails**: Install "Debugger for Chrome" extension

### Solutions
- Restart the debugger
- Check file paths in launch.json
- Verify dependencies are installed
- Ensure servers are running on correct ports

