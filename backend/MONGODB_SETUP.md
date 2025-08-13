# 🍃 MongoDB Setup Guide for CEDO Backend

## Overview
This guide helps you set up MongoDB for the CEDO Partnership Management System. MongoDB is used for file storage (GridFS) and some advanced features.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
cd backend
npm run setup-mongodb
```

### Option 2: Manual Setup
Follow the step-by-step instructions below.

## 📋 Prerequisites

- Node.js 18+ installed
- Administrative access to your system
- Internet connection for MongoDB download

## 🔧 Installation by Operating System

### Windows
1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Download the latest version for Windows
   - Run the installer as Administrator

2. **Installation Options**
   - Choose "Complete" installation
   - Install MongoDB Compass (recommended for GUI)
   - Install MongoDB as a Service (recommended)

3. **Start MongoDB Service**
   - Open Services (Win + R, type `services.msc`)
   - Find "MongoDB" service
   - Right-click → Start
   - Set Startup Type to "Automatic"

### macOS
```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Verify installation
mongod --version
```

### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongod --version
```

## 🗄️ Database Setup

### Automated Setup
The setup script will automatically:
1. Create the `cedo_db` database
2. Create user `cedo_admin` with password `Raymund-Estaca01`
3. Create necessary collections
4. Test the connection

### Manual Setup
If you prefer manual setup:

1. **Start MongoDB Shell**
   ```bash
   mongosh
   ```

2. **Create Database and User**
   ```javascript
   use cedo_db
   
   db.createUser({
     user: "cedo_admin",
     pwd: "Raymund-Estaca01",
     roles: [
       { role: "readWrite", db: "cedo_db" },
       { role: "dbAdmin", db: "cedo_db" }
     ]
   })
   
   // Create collections
   db.createCollection("proposals")
   db.createCollection("users")
   db.createCollection("events")
   db.createCollection("files")
   ```

3. **Test Connection**
   ```javascript
   use cedo_db
   db.runCommand({ping: 1})
   ```

## 🔧 Environment Configuration

### Update .env File
Add the following to your `backend/.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin

# Other required variables
NODE_ENV=development
PORT=5000
JWT_SECRET=your-development-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
```

## 🧪 Testing the Setup

### Quick Status Check
```bash
cd backend
npm run check-mongodb
```

### Test Connection in Application
```bash
cd backend
npm run dev
```

Look for these success messages:
```
✅ MongoDB: Connection established successfully
✅ MongoDB: Client connection established
✅ Mongoose: Connected for legacy support
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "MongoDB is not installed"
**Solution:**
- Follow the installation instructions for your OS above
- Verify installation: `mongod --version`

#### 2. "MongoDB service is not running"
**Windows:**
- Open Services (services.msc)
- Find "MongoDB" service
- Right-click → Start
- Set Startup Type to "Automatic"

**macOS:**
```bash
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 3. "Authentication failed"
**Solution:**
- Ensure the user exists: `db.auth("cedo_admin", "Raymund-Estaca01")`
- Check authSource: Use `?authSource=admin` in connection string
- Recreate user if needed (see manual setup above)

#### 4. "Connection timeout"
**Solutions:**
- Check if MongoDB is running on port 27017
- Verify firewall settings
- Try using `127.0.0.1` instead of `localhost`
- Check MongoDB logs for errors

#### 5. "Port already in use"
**Solution:**
- Check what's using port 27017: `netstat -an | grep 27017`
- Stop conflicting service or change MongoDB port

### Debug Commands

#### Check MongoDB Status
```bash
# Windows
sc query MongoDB

# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod
```

#### View MongoDB Logs
```bash
# Windows
# Check Event Viewer → Windows Logs → Application

# macOS
tail -f /usr/local/var/log/mongodb/mongo.log

# Linux
sudo journalctl -u mongod -f
```

#### Test Connection Manually
```bash
mongosh "mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin"
```

## 🔄 Fallback Mode

If MongoDB is not available, the application will run in **demo mode**:
- ✅ Core functionality (MySQL) continues to work
- ✅ Authentication and user management work
- ✅ Proposal management works
- ❌ File upload/storage features disabled
- ❌ GridFS features disabled

## 📊 MongoDB Features in CEDO

### Collections Used
- `proposals`: Event proposals and metadata
- `users`: User profiles and preferences
- `events`: Event details and schedules
- `files`: File storage (GridFS)

### GridFS Integration
- File uploads for proposals
- Document storage
- Image and PDF handling

## 🔒 Security Considerations

### Production Setup
For production environments:
1. Use strong passwords
2. Enable SSL/TLS
3. Configure network access
4. Set up proper authentication
5. Regular backups
6. Monitor logs

### Development Setup
The current setup is for development only:
- Default credentials for easy setup
- Local-only access
- No SSL required

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)
- [GridFS Documentation](https://docs.mongodb.com/manual/core/gridfs/)

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Run `npm run check-mongodb` for diagnostics
3. Check MongoDB logs
4. Verify environment variables
5. Test connection manually

---

**Last Updated:** $(date)
**Status:** ✅ Ready for development
**MongoDB Version:** 7.0+ 