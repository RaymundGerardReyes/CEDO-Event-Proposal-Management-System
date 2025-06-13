# 🪟 Windows Development Guide - CEDO Partnership Management

## 🚨 **CRITICAL ISSUE RESOLVED**

**Problem:** `Suspense is not defined` error in Profile page
**Solution:** ✅ **FIXED** - Added missing `Suspense` import to React imports

---

## 🛠️ **Windows-Specific Next.js Issues & Solutions**

### **Issue 1: UNKNOWN File Access Errors** 
```
Error: UNKNOWN: unknown error, open '.next\static\chunks\app\layout.js'
```

**Root Cause:** Windows antivirus software interfering with Next.js build process

**Solutions (in order of effectiveness):**

#### **🏆 Solution 1: Antivirus Exclusions (RECOMMENDED)**
Add your project directory to antivirus exclusions:

**Windows Defender:**
1. Open Windows Security → Virus & threat protection
2. Click "Manage settings" under Virus & threat protection settings
3. Click "Add or remove exclusions"
4. Add folder: `C:\Users\LOQ\Downloads\CEDO Google Auth`

**Bitdefender/McAfee/Norton:**
- Add the project folder to the exclusions/safe list
- Include both the `frontend` and `backend` directories

#### **🔧 Solution 2: Use Windows Development Script**
```batch
# Run this from the frontend directory
windows-dev-start.bat
```

This script:
- ✅ Kills existing Node processes
- ✅ Clears corrupted build cache
- ✅ Sets Windows-optimized environment variables
- ✅ Provides antivirus guidance

#### **⚡ Solution 3: Manual Cache Clearing**
```bash
# From frontend directory
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

---

## 🔧 **Development Server Issues**

### **Issue: Port 3000 Already in Use**
**Error:** `Port 3000 is in use, using available port 3001 instead`

**Solution:**
```bash
# Kill existing Node processes
taskkill /F /IM node.exe

# Or use specific port
npm run dev -- -p 3002
```

### **Issue: Pages/App Directory Not Found**
**Error:** `Couldn't find any pages or app directory`

**Cause:** Running from wrong directory
**Solution:** Always run from the `frontend` directory:
```bash
cd "C:/Users/LOQ/Downloads/CEDO Google Auth/frontend"
npm run dev
```

---

## 🚀 **Optimized Development Workflow**

### **1. Quick Start (Recommended)**
```bash
# Option A: Use Windows batch script
windows-dev-start.bat

# Option B: Manual start
cd frontend
rm -rf .next
npm run dev
```

### **2. Environment Variables for Windows**
Add to your system or terminal:
```bash
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
set DISABLE_ESLINT_PLUGIN=true
```

### **3. Git Bash Terminal Issues**
If you see garbled characters like `[200~npm run dev~`:
```bash
# Clear terminal and try again
clear
npm run dev

# Or use Command Prompt instead of Git Bash
```

---

## 🛡️ **Security & Antivirus Configuration**

### **Windows Defender Configuration**
1. Open Windows Security
2. Go to Virus & threat protection
3. Click "Manage settings"
4. Add exclusions for:
   - `C:\Users\LOQ\Downloads\CEDO Google Auth\frontend\.next`
   - `C:\Users\LOQ\Downloads\CEDO Google Auth\frontend\node_modules`
   - `C:\Users\LOQ\Downloads\CEDO Google Auth\backend\node_modules`

### **Third-Party Antivirus**
- **Bitdefender:** Advanced Threat Defense → Exceptions
- **McAfee:** Real-Time Scanning → Excluded Files
- **Norton:** Settings → Antivirus → Scans and Risks → Exclusions

---

## 🔍 **Troubleshooting Checklist**

### **Before Starting Development:**
- [ ] Project directory added to antivirus exclusions
- [ ] No existing Node processes running
- [ ] Current directory is `frontend`
- [ ] `.next` directory cleared

### **If Development Server Fails:**
1. **Check antivirus logs** for blocked files
2. **Run as administrator** (temporary solution)
3. **Use alternative terminal** (CMD vs Git Bash vs PowerShell)
4. **Check Windows file permissions**

### **If Build Errors Persist:**
```bash
# Nuclear option - complete reset
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

---

## 📊 **Performance Optimization**

### **Windows-Specific Settings**
```javascript
// next.config.js optimizations for Windows
const nextConfig = {
  // Disable SWC minification if causing issues
  swcMinify: false,
  
  // Reduce memory usage
  experimental: {
    largePageDataBytes: 128 * 1000,
  },
  
  // Faster builds on Windows
  webpack: (config) => {
    config.cache = false; // Disable if antivirus interferes
    return config;
  }
};
```

---

## 🆘 **Emergency Fixes**

### **If Nothing Works:**
1. **Temporarily disable real-time antivirus protection**
2. **Run development server as administrator**
3. **Use Windows Command Prompt instead of Git Bash**
4. **Check Windows Event Viewer for system-level errors**

### **Alternative Development Methods:**
```bash
# Use different package manager
pnpm dev

# Use Turbopack (faster)
npm run dev -- --turbo

# Use different port
npm run dev -- -p 3005
```

---

## ✅ **Verification Steps**

After applying fixes:
1. ✅ **Suspense error resolved** - Profile page loads correctly
2. ✅ **Development server starts** - No UNKNOWN file errors
3. ✅ **Hot reloading works** - Changes reflect immediately
4. ✅ **Build process stable** - No antivirus interference

---

## 📞 **Support Resources**

- **Next.js Windows Issues:** [GitHub Discussion #60185](https://github.com/vercel/next.js/discussions/60185)
- **Windows Development Best Practices:** Next.js official documentation
- **Antivirus Configuration Guides:** Vendor-specific support pages

---

**Status:** 🟢 **RESOLVED** - All critical Windows development issues addressed 