# Admin Dashboard Connection Troubleshooting Guide

## ❌ Issue: "Failed to connect to server"

This error occurs when the frontend admin dashboard cannot connect to the backend API. Here's how to fix it:

## 🔧 Step-by-Step Debugging

### 1. **Check if Backend is Running**
```bash
# Navigate to backend directory
cd backend

# Start the backend server
npm start

# You should see:
# ✅ Connected to MongoDB for unified file metadata approach
# ✅ MySQL database connected successfully
# Server running on port 5000 in development mode
```

### 2. **Check if Frontend is Running**
```bash
# Navigate to frontend directory
cd frontend

# Start the frontend server
npm run dev

# You should see:
# ✅ Local: http://localhost:3000
```

### 3. **Test Backend Health**
Open your browser or use curl:
```bash
# Test backend health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"...","env":"development"}
```

### 4. **Test MongoDB Connection**
```bash
# Test MongoDB connection
curl http://localhost:5000/api/proposals/admin/proposals

# Should return proposals data or empty array
```

### 5. **Run Environment Check**
```bash
cd frontend
node check-environment.js
```

### 6. **Run Connection Test**
```bash
cd frontend
npm install node-fetch  # If needed
node test-admin-api-connection.js
```

## 🌐 Environment Variables

### Frontend (.env.local)
Create `frontend/.env.local` with:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### Backend (.env)
Ensure `backend/.env` has:
```env
MONGODB_URI=mongodb://localhost:27017/cedo_app
PORT=5000
# ... other variables
```

## 🚫 Common Issues & Solutions

### Issue 1: Port Conflicts
**Error:** `EADDRINUSE: address already in use`
**Solution:**
```bash
# Kill processes on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in backend/.env
PORT=5001
```

### Issue 2: MongoDB Not Connected
**Error:** `MongoDB connection error`
**Solution:**
```bash
# Start MongoDB service
# On macOS: brew services start mongodb/brew/mongodb-community
# On Windows: Start MongoDB service
# On Linux: sudo systemctl start mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cedo_app
```

### Issue 3: CORS Issues
**Symptoms:** Network errors, blocked requests
**Solution:** Backend server.js already has CORS configured:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}))
```

### Issue 4: Route Not Found
**Error:** `404 Not Found`
**Check:**
1. Backend routes are registered in `server.js`
2. MongoDB unified router is imported and used
3. Path matches: `/api/proposals/admin/proposals`

## 🐛 Debug Mode

### Enable Verbose Logging
Add to `frontend/.env.local`:
```env
DEBUG=true
NEXT_PUBLIC_DEBUG=true
```

### Check Browser Console
1. Open admin dashboard: `http://localhost:3000/admin-dashboard/proposals`
2. Open Developer Tools (F12)
3. Check Console tab for errors
4. Check Network tab for failed requests

### Check Backend Logs
Look for these messages in backend terminal:
```
✅ Connected to MongoDB for unified file metadata approach
Server running on port 5000 in development mode
📋 Admin: Fetching proposals with filters: {...}
```

## 🔄 API Endpoint Flow

The request flow should be:
```
Frontend Component (ProposalTable)
  ↓
Frontend API Route (/api/admin/proposals)
  ↓
Backend Server (http://localhost:5000)
  ↓
Backend Route (/api/proposals/admin/proposals)
  ↓
MongoDB Database
```

## ✅ Expected Working State

When everything is working, you should see:

### Browser Console:
```
📋 Fetching proposals from frontend API: /api/admin/proposals?page=1&limit=10
🏥 Backend health check: 200 true
📡 Backend response status: 200 OK
✅ Proposals fetched successfully: 0
```

### Backend Console:
```
📋 Admin: Fetching proposals with filters: {status: null, page: 1, limit: 10}
🔍 MongoDB query filter: {}
✅ Admin: Successfully fetched proposals: {count: 0, pagination: {...}}
```

## 🆘 Still Not Working?

If you're still getting "Failed to connect to server":

1. **Restart both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

2. **Clear Next.js cache:**
   ```bash
   cd frontend
   rm -rf .next
   npm run dev
   ```

3. **Check for firewall/antivirus blocking:**
   - Temporarily disable firewall
   - Add exception for ports 3000 and 5000

4. **Use network debugging:**
   ```bash
   # Test with curl
   curl -v http://localhost:5000/health
   curl -v http://localhost:3000/api/admin/proposals
   ```

5. **Check if processes are actually running:**
   ```bash
   # Check what's running on your ports
   lsof -i :3000  # Frontend
   lsof -i :5000  # Backend
   ```

## 📞 Get Help

If none of these solutions work:
1. Run all the test scripts provided
2. Copy the output
3. Check the full error messages in browser console and backend logs
4. Look for any additional error details in the Network tab

The issue is most likely one of:
- Backend not running on port 5000
- MongoDB not connected
- Environment variables not set correctly
- Port conflicts
- Route registration issues 