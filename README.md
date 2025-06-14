# 🎓 CEDO Partnership Management System

## 🌟 Overview

The **CEDO Partnership Management System** is a comprehensive full-stack application designed for educational partnership management, event proposal submissions, and administrative oversight. Built with modern technologies and featuring a hybrid database architecture for optimal performance and scalability.

### 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    CEDO PARTNERSHIP SYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 15.3.2)  │  Backend (Express.js + APIs)  │
│  ├─ Student Dashboard       │  ├─ Hybrid Database API       │
│  ├─ Admin Dashboard         │  ├─ Authentication System     │
│  ├─ Manager Interface       │  ├─ File Upload Management    │
│  └─ Authentication          │  └─ Admin Panel Interface     │
├─────────────────────────────┼─────────────────────────────────┤
│        DATABASE LAYER       │     EXTERNAL SERVICES         │
│  ├─ MySQL (Relational)      │  ├─ Google OAuth              │
│  ├─ MongoDB (Documents)     │  ├─ reCAPTCHA                 │
│  └─ GridFS (File Storage)   │  └─ Email Services            │
└─────────────────────────────────────────────────────────────┘
```

## ✨ **Key Features**

### 🎯 **Multi-Role System**
- **👨‍🎓 Students**: Submit proposals, track status, manage drafts
- **👨‍💼 Managers**: Review proposals, manage users, generate reports
- **👨‍💻 Admins**: Full system control, user management, system monitoring

### 🗄️ **Hybrid Database Architecture**
- **MySQL**: Structured data (users, proposals, relationships)
- **MongoDB**: File metadata, complex documents, flexible schemas
- **GridFS**: Large file storage and retrieval
- **Real-time sync** between databases for optimal performance

### 🖥️ **Django Admin-like Interface**
- **Web-based database management** at `http://localhost:5000/api/admin`
- **Real-time database monitoring** and health checks
- **Interactive table browsers** for both MySQL and MongoDB
- **Complete CRUD operations** via web interface

### 🔐 **Advanced Security**
- **bcrypt password hashing** with 12 salt rounds
- **JWT token-based authentication**
- **Role-based access control (RBAC)**
- **Google OAuth integration**
- **reCAPTCHA protection**
- **Secure file upload validation**

## 🚀 **Quick Start**

### Prerequisites
- **Node.js** v20.19.1 (64-bit) *(recommended for stability)*
- **MySQL** v8.0 or higher
- **MongoDB** v4.4 or higher
- **Git** for version control

### 1. **Clone & Setup**
```bash
# Clone the repository
git clone https://github.com/2402-XU-CSCC22A/groupI
cd CEDO-Admin-Manager-Student

# Install dependencies for both frontend and backend
cd frontend && npm install
cd ../backend && npm install
```

### 2. **Database Configuration**

#### **MySQL Setup** (Required)
```sql
-- Connect to MySQL and run these commands:
CREATE DATABASE cedo_auth;
USE cedo_auth;

-- Fix authentication for Node.js compatibility
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
```

#### **MongoDB Setup** (Required)
```bash
# Start MongoDB service
# Windows: Start MongoDB service from Services
# macOS: brew services start mongodb/brew/mongodb-community  
# Linux: sudo systemctl start mongod

# MongoDB will auto-create 'cedo-partnership' database
```

### 3. **Environment Configuration**

   
Create `backend/.env`:
```env
# ✅ Database Configuration (FIXED)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cedo_auth

# ✅ MySQL Alternative Variables
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=cedo_auth

# ✅ MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cedo-partnership

# ✅ Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# ✅ Authentication (Add your own keys)
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```
### 4. **Initialize Databases**
```bash
cd backend
npm run init-db
```

### 5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🔗 **System Access Points**

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend App** | `http://localhost:3000` | Main application interface |
| **Admin Dashboard** | `http://localhost:5000/api/admin` | Django-like admin interface |
| **API Endpoints** | `http://localhost:5000/api/` | RESTful API access |
| **Health Check** | `http://localhost:5000/health` | System status monitoring |

## 📊 **API Documentation**

### **Database Admin APIs**
```http
GET  /api/admin                        # Web-based admin dashboard
GET  /api/admin/mysql/status           # MySQL connection status  
GET  /api/admin/mysql/tables           # List all MySQL tables
GET  /api/admin/mongodb/status         # MongoDB connection status
GET  /api/admin/mongodb/collections    # List all MongoDB collections
```

### **Database CRUD Operations**
```http
# MySQL Operations
GET    /api/db/mysql/:table            # List records with pagination
POST   /api/db/mysql/:table            # Create new record
PUT    /api/db/mysql/:table/:id        # Update existing record
DELETE /api/db/mysql/:table/:id        # Delete record

# MongoDB Operations
GET    /api/db/mongodb/:collection     # List documents with pagination
POST   /api/db/mongodb/:collection     # Create new document
PUT    /api/db/mongodb/:collection/:id # Update document
DELETE /api/db/mongodb/:collection/:id # Delete document
```

### **Hybrid Architecture Endpoints**
```http
POST /api/proposals/section2-organization  # Save to MySQL
POST /api/proposals/files                  # Save files to MongoDB (linked to MySQL)
GET  /api/proposals/admin/proposals-hybrid # Combined MySQL + MongoDB data
```

## 🔧 **Advanced Features**

### **Manager Password System**
- **🔐 Automatic password generation** for manager accounts
- **🔄 Forced password change** on first login
- **🛡️ bcrypt encryption** with 12 salt rounds
- **👁️ Password visibility controls** in admin interface

### **Real-time Monitoring**
- **📊 Database health checks** and connection status
- **📈 Real-time data counts** for tables and collections
- **🚨 Error tracking** and logging system
- **⚡ Performance monitoring** for API endpoints

### **File Management System**
- **📁 GridFS integration** for large file storage
- **🔗 MySQL-MongoDB linking** for file metadata
- **📋 File type validation** and security checks
- **💾 Efficient file retrieval** and streaming

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

#### **Port 5000 Already in Use**
```bash
# Windows: Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Alternative: Use different port in backend/.env
PORT=5001
```

#### **MySQL Connection Failed**
```bash
# Check MySQL is running
net start mysql80

# Test connection manually
mysql -u root -h 127.0.0.1 -P 3306

# Run connection test
cd backend && node test-connection-fix.js
```

#### **MongoDB Connection Error**
```bash
# Check MongoDB status
mongod --version

# Start MongoDB service
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

#### **Admin Dashboard Not Loading**
```bash
# Run connection test
cd frontend && node test-admin-api-connection.js

# Check backend health
curl http://localhost:5000/health

# Verify environment variables
cd frontend && node check-environment.js
```

### **Debug Commands**
```bash
# Test all endpoints
curl http://localhost:5000/api/admin/mysql/status
curl http://localhost:5000/api/admin/mongodb/status
curl http://localhost:5000/api/db/mysql/users?limit=5

# Run comprehensive tests
cd backend && npm run test-hybrid
```

## 🧪 **Testing & Verification**

### **API Testing**
```bash
# Test MySQL endpoints
curl "http://localhost:5000/api/db/mysql/users?page=1&limit=5"

# Test MongoDB endpoints
curl "http://localhost:5000/api/db/mongodb/proposal_files?page=1&limit=5"

# Test hybrid admin dashboard
curl "http://localhost:5000/api/proposals/admin/proposals-hybrid"
```

### **Integration Testing**
```bash
# Run full integration tests
cd backend
npm run test-hybrid-verbose

# Test specific components
node test-mysql-connection.js
node test-mongodb-connection.js
```

## 📚 **Documentation References**

- **📖 API Endpoint Testing**: `API_ENDPOINT_TESTING_GUIDE.md`
- **🛠️ Database Admin Setup**: `DATABASE_ADMIN_SETUP_GUIDE.md`
- **🏗️ Hybrid Architecture**: `HYBRID_ARCHITECTURE_README.md`
- **🔐 Manager Password System**: `MANAGER_PASSWORD_SYSTEM.md`
- **🚨 Troubleshooting Guide**: `ADMIN_CONNECTION_TROUBLESHOOTING.md`
- **⚡ Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

## 🔐 **Security Best Practices**

1. **🔒 Never commit `.env` files** to version control
2. **🌐 Use HTTPS** in production environments
3. **🔑 Rotate JWT secrets** regularly
4. **👥 Implement role-based access** for sensitive operations
5. **📝 Monitor and log** all administrative actions
6. **🛡️ Validate all inputs** on both client and server side

## 🚀 **Production Deployment**

### **Environment Setup**
```env
NODE_ENV=production
DB_HOST=your_production_mysql_host
MONGODB_URI=mongodb://your_production_mongodb_connection
FRONTEND_URL=https://your-domain.com
```

### **Build Commands**
```bash
# Frontend production build
cd frontend
npm run build
npm run start

# Backend production
cd backend
npm run start
```

## 🎉 **System Capabilities**

✅ **Multi-Database Support**: MySQL + MongoDB hybrid architecture  
✅ **Real-time Admin Dashboard**: Django-like web interface  
✅ **Advanced Authentication**: JWT + OAuth + RBAC  
✅ **File Management**: GridFS + metadata linking  
✅ **API-First Design**: RESTful endpoints for all operations  
✅ **Cross-Platform**: Windows, macOS, Linux compatible  
✅ **Production Ready**: Error handling, logging, monitoring  
✅ **Scalable Architecture**: Modular design for easy expansion  

## 🆘 **Support**

For technical support:
1. **📋 Check the troubleshooting guides** in the documentation
2. **🧪 Run the provided test scripts** to identify issues
3. **📊 Use the admin dashboard** for real-time system monitoring
4. **📝 Review server logs** for detailed error information

## 🔄 **System Status**

Current implementation includes:
- ✅ **Hybrid Database Architecture** (MySQL + MongoDB)
- ✅ **Complete Admin Dashboard** with real-time monitoring
- ✅ **Manager Password Management System**
- ✅ **RESTful API Endpoints** for all operations
- ✅ **Production-Ready Security** with encryption and validation
- ✅ **Cross-Platform Compatibility** with comprehensive guides

---

**The CEDO Partnership Management System is now ready for development and production use!** 🚀
