# 🚀 Quick Reference Card - Refactored Configurations

## 🎯 **Primary Workflow (Use This Most of the Time)**

### **1. Start Development**
```bash
npm run dev
```

### **2. Debug in Cursor AI**
1. **Press**: `Ctrl+Shift+D`
2. **Select**: `🚀 Full Stack Debug (Coordinated)`
3. **Press**: `F5`
4. **Set breakpoints** in your code

---

## 🔧 **Alternative Workflows**

### **Backend Only Development**
```bash
npm run dev:backend
```
**Debug**: `🔧 Backend Only (Debug)` → F5

### **Frontend Only Development**
```bash
npm run dev:frontend
```
**Debug**: `🌐 Frontend Only (Chrome)` → F5

### **With Backend Debugging**
```bash
npm run dev:debug
```
**Debug**: `🚀 Full Stack Debug (Coordinated)` → F5

---

## 📋 **VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")**

| Task | Purpose |
|------|---------|
| `🚀 Start Full Stack` | Start both servers |
| `🐛 Start with Backend Debug` | Start with debugging |
| `🔧 Start Backend Only` | Backend only |
| `🌐 Start Frontend Only` | Frontend only |
| `📦 Install All Dependencies` | Install everything |
| `🧪 Run All Tests` | Run all tests |
| `🔨 Build Full Stack` | Build everything |
| `🧹 Clean All` | Clean everything |
| `🏥 Health Check` | Check server health |

---

## 🐛 **Debug Configurations (Ctrl+Shift+D)**

| Configuration | Purpose | When to Use |
|---------------|---------|-------------|
| `🚀 Full Stack Debug (Coordinated)` | **MAIN** - Both servers + debugging | **Most common use case** |
| `🔧 Backend Only (Debug)` | Backend debugging only | Backend API development |
| `🌐 Frontend Only (Chrome)` | Frontend debugging only | React component debugging |
| `🔗 Attach to Backend` | Attach to running backend | Backend already running |
| `🔗 Attach to Chrome` | Attach to running Chrome | Frontend already running |

---

## 🎯 **Port Configuration**

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js development server |
| Backend | 5000 | Express API server |
| Backend Debug | 9229 | Node.js debugger |
| Chrome Debug | 9222 | Chrome remote debugging |

---

## 🚨 **Troubleshooting**

### **If debugging fails:**
1. **Try**: `npm run dev:debug` first
2. **Then**: Select `🚀 Full Stack Debug (Coordinated)`
3. **If still fails**: Use `🔗 Attach to Backend` + `🔗 Attach to Chrome`

### **If servers don't start:**
1. **Check**: `npm run health`
2. **Install**: `npm run install:all`
3. **Clean**: `npm run clean`

---

## 🎉 **Success Indicators**

- ✅ Both servers start with `npm run dev`
- ✅ Debugging connects without timeout errors
- ✅ Breakpoints are hit in both frontend and backend
- ✅ Integrated terminal shows logs from both servers

---

**Your refactored configurations are optimized for efficient full stack JavaScript development! 🚀**

