# 🪟 Windows Compatible Debugging Guide

## ✅ **Issue Fixed: Windows Concurrently Compatibility**

The previous error was caused by trying to execute the `concurrently` shell script directly with Node.js on Windows. This has been fixed with a Windows-compatible approach.

## 🚀 **Corrected Workflow (Windows Compatible)**

### **Method 1: Manual Two-Step Process (Recommended)**

#### **Step 1: Start Frontend**
```bash
# In Terminal 1
npm run dev:frontend
```

#### **Step 2: Debug Backend**
1. **Press**: `Ctrl+Shift+D` in Cursor AI
2. **Select**: `🚀 Full Stack Debug (Manual)`
3. **Press**: `F5`
4. **Set breakpoints** in your backend code

### **Method 2: Using VS Code Tasks**

#### **Step 1: Start Frontend via Task**
1. **Press**: `Ctrl+Shift+P` → "Tasks: Run Task"
2. **Select**: `🌐 Start Frontend Only`
3. **Wait** for frontend to start

#### **Step 2: Debug Backend**
1. **Press**: `Ctrl+Shift+D` in Cursor AI
2. **Select**: `🚀 Full Stack Debug (Manual)`
3. **Press**: `F5`

### **Method 3: Compound Configuration**

#### **One-Click Full Stack Debugging**
1. **Press**: `Ctrl+Shift+D` in Cursor AI
2. **Select**: `🚀 Full Stack Debug` (Compound)
3. **Press**: `F5`
4. **Both frontend and backend** will start with debugging

## 🔧 **Available Debug Configurations**

| Configuration | Purpose | When to Use |
|---------------|---------|-------------|
| `🚀 Full Stack Debug (Coordinated)` | Backend + Frontend task | When you want frontend to start automatically |
| `🚀 Full Stack Debug (Manual)` | Backend only | When frontend is already running |
| `🔧 Backend Only (Debug)` | Backend debugging only | Backend API development |
| `🌐 Frontend Only (Chrome)` | Frontend debugging only | React component debugging |
| `🔗 Attach to Backend` | Attach to running backend | Backend already running |
| `🔗 Attach to Chrome` | Attach to running Chrome | Frontend already running |

## 📋 **Available VS Code Tasks**

| Task | Command | Purpose |
|------|---------|---------|
| `🚀 Start Full Stack` | `npm run dev` | Start both servers (use this first) |
| `🐛 Start with Backend Debug` | `npm run dev:debug` | Start with backend debugging |
| `🔧 Start Backend Only` | `npm run dev:backend` | Backend only |
| `🌐 Start Frontend Only` | `npm run dev:frontend` | Frontend only |
| `start-frontend` | `npm run dev:frontend` | Used by launch configurations |

## 🎯 **Recommended Workflow**

### **For Daily Development:**

#### **Option A: Use Your Package.json (Simplest)**
```bash
# Start both servers
npm run dev

# Then debug backend separately
# Press Ctrl+Shift+D → "🔧 Backend Only (Debug)" → F5
```

#### **Option B: Use VS Code Tasks**
1. **Press**: `Ctrl+Shift+P` → "Tasks: Run Task" → `🚀 Start Full Stack`
2. **Press**: `Ctrl+Shift+D` → `🔧 Backend Only (Debug)` → F5

#### **Option C: Use Compound Configuration**
1. **Press**: `Ctrl+Shift+D` → `🚀 Full Stack Debug` → F5
2. **Everything starts automatically**

## 🔍 **Port Configuration**

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js development server |
| Backend | 5000 | Express API server |
| Backend Debug | 9229 | Node.js debugger |
| Chrome Debug | 9222 | Chrome remote debugging |

## 🚨 **Troubleshooting**

### **If you get the concurrently error again:**
- **Don't use**: `🚀 Full Stack Debug (Coordinated)` 
- **Use instead**: `🚀 Full Stack Debug (Manual)` or `🔧 Backend Only (Debug)`

### **If frontend doesn't start:**
1. **Check**: `npm run dev:frontend` works in terminal
2. **Use**: `🌐 Start Frontend Only` task
3. **Then**: Use `🔧 Backend Only (Debug)` for backend

### **If debugging doesn't connect:**
1. **Check**: Backend is running on port 5000
2. **Check**: Debug port 9229 is available
3. **Use**: `🔗 Attach to Backend` instead

## 🎉 **Success Indicators**

- ✅ `npm run dev` starts both servers without errors
- ✅ Backend debugging connects on port 9229
- ✅ Frontend runs on port 3000
- ✅ Breakpoints are hit in backend code
- ✅ No concurrently shell script errors

## 🚀 **Quick Start Commands**

### **Start Development:**
```bash
npm run dev
```

### **Start with Backend Debugging:**
```bash
npm run dev:debug
```

### **Debug in Cursor AI:**
1. `Ctrl+Shift+D` → `🚀 Full Stack Debug` → F5
2. Or: `Ctrl+Shift+D` → `🔧 Backend Only (Debug)` → F5

---

**Your Windows-compatible debugging setup is now ready! 🎉**

