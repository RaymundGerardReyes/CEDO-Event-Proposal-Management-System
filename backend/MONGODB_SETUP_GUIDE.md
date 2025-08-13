# MongoDB Setup Guide for CEDO Project

## 🎯 **Problem Analysis**

The CEDO project is experiencing "MongoDB not connected" errors because MongoDB is not properly installed or configured on your system.

## 🔧 **Solution: Complete MongoDB Setup**

### **Step 1: Install MongoDB Community Server**

1. **Download MongoDB Community Server**:
   - Go to: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Version: 7.0 or later
   - Package: MSI
   - Click "Download"

2. **Install MongoDB**:
   - Run the downloaded MSI file
   - Choose "Complete" installation
   - Install MongoDB Compass (GUI tool) when prompted
   - Complete the installation

### **Step 2: Start MongoDB Service**

**Option A: Windows Service (Recommended)**
```bash
# MongoDB should start automatically as a Windows service
# Check if it's running:
services.msc
# Look for "MongoDB" service and ensure it's "Running"
```

**Option B: Manual Start**
```bash
# Create data directory
mkdir C:\data\db

# Start MongoDB manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath C:\data\db
```

### **Step 3: Create MongoDB User and Database**

1. **Open MongoDB Shell**:
   ```bash
   # Open Command Prompt as Administrator
   "C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe"
   ```

2. **Switch to Admin Database**:
   ```javascript
   use admin
   ```

3. **Create User**:
   ```javascript
   db.createUser({
     user: "cedo_admin",
     pwd: "Raymund-Estaca01",
     roles: [
       { role: "readWrite", db: "cedo_db" },
       { role: "dbAdmin", db: "cedo_db" }
     ]
   })
   ```

4. **Create Database**:
   ```javascript
   use cedo_db
   db.createCollection("test")
   ```

5. **Test Connection**:
   ```javascript
   db.runCommand({ ping: 1 })
   ```

### **Step 4: Update Environment Variables**

Create or update your `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin
MONGODB_DB_NAME=cedo_db

# Other configurations...
NODE_ENV=development
PORT=5000
```

### **Step 5: Initialize MongoDB Database**

Run the initialization script:

```bash
cd backend
node scripts/init-mongodb.js
```

### **Step 6: Test Connection**

Run the connection test:

```bash
node test-mongodb-connection.js
```

## 🚀 **Alternative: Quick Setup with Docker**

If you prefer using Docker:

### **Step 1: Install Docker Desktop**
- Download from: https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop

### **Step 2: Run MongoDB with Docker**
```bash
# Create MongoDB container
docker run -d \
  --name cedo-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=cedo_admin \
  -e MONGO_INITDB_ROOT_PASSWORD=Raymund-Estaca01 \
  -e MONGO_INITDB_DATABASE=cedo_db \
  mongo:7.0

# Create user and database
docker exec -it cedo-mongodb mongosh --eval "
  use admin;
  db.createUser({
    user: 'cedo_admin',
    pwd: 'Raymund-Estaca01',
    roles: [
      { role: 'readWrite', db: 'cedo_db' },
      { role: 'dbAdmin', db: 'cedo_db' }
    ]
  });
  use cedo_db;
  db.createCollection('test');
"
```

### **Step 3: Update Environment Variables**
```env
MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin
```

## 🔍 **Troubleshooting**

### **Common Issues and Solutions**

1. **"MongoDB not connected" Error**:
   - Check if MongoDB service is running
   - Verify connection string in .env file
   - Test connection with mongosh

2. **Authentication Failed**:
   - Ensure user exists in admin database
   - Check password spelling
   - Verify authSource parameter

3. **Port Already in Use**:
   - Check if another MongoDB instance is running
   - Kill existing process: `taskkill /f /im mongod.exe`

4. **Permission Denied**:
   - Run Command Prompt as Administrator
   - Check folder permissions for data directory

### **Verification Commands**

```bash
# Check if MongoDB is running
netstat -an | findstr 27017

# Check MongoDB service status
sc query MongoDB

# Test connection with mongosh
"C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe" "mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin"
```

## 📊 **Expected Database Structure**

After running `init-mongodb.js`, you should have:

### **Collections Created**:
- `proposals` - Event proposals
- `organizations` - Organization information
- `proposal_files` - File metadata
- `accomplishment_reports` - Event reports
- `file_uploads` - Upload audit trail
- `proposal_files.files` - GridFS files
- `proposal_files.chunks` - GridFS chunks

### **Sample Data**:
- 4 sample organizations
- 3 sample proposals
- 1 sample accomplishment report

## ✅ **Success Indicators**

When MongoDB is properly set up, you should see:

1. **Connection Test Success**:
   ```
   ✅ Successfully connected to MongoDB!
   ✅ Database ping successful!
   ✅ Connection test completed successfully!
   ```

2. **Server Startup Success**:
   ```
   ✅ MongoDB connection established
   MongoDB: ✅ Connected
   ```

3. **API Endpoints Working**:
   - POST `/api/mongodb-unified/proposals/community-events` - 200 OK
   - POST `/api/mongodb-unified/proposals/school-events` - 200 OK

## 🎉 **Next Steps**

After successful MongoDB setup:

1. **Test the Frontend**:
   - Navigate to event submission forms
   - Try submitting school and community events
   - Verify data is saved to MongoDB

2. **Monitor Logs**:
   - Check server logs for successful connections
   - Monitor database operations

3. **Backup Strategy**:
   - Set up regular MongoDB backups
   - Document backup and restore procedures

## 📞 **Support**

If you encounter issues:

1. Check MongoDB logs: `C:\Program Files\MongoDB\Server\7.0\log\mongod.log`
2. Verify environment variables
3. Test connection manually with mongosh
4. Check Windows Event Viewer for service errors

---

**Status**: 🔧 **SETUP REQUIRED** - MongoDB needs to be installed and configured

**Priority**: 🔴 **HIGH** - Required for event submission functionality 