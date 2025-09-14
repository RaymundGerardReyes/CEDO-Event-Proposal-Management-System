# 🚀 **RENDER ENVIRONMENT SETUP GUIDE**

## 🎯 **CRITICAL: Database Connection Issues Fixed**

Your Render deployment is failing because the databases are trying to connect to `localhost` instead of Render's provided database services.

---

## 📋 **REQUIRED RENDER ENVIRONMENT VARIABLES**

### **🔧 Backend Service Environment Variables:**

#### **Database Configuration:**
```bash
# PostgreSQL Database (Primary)
DB_TYPE=postgresql
DB_HOST=your-postgres-host.onrender.com
DB_PORT=5432
DB_USER=your-postgres-username
DB_PASSWORD=your-postgres-password
DB_NAME=your-postgres-database

# Alternative PostgreSQL Environment Variables (for compatibility)
POSTGRES_HOST=your-postgres-host.onrender.com
POSTGRES_PORT=5432
POSTGRES_USER=your-postgres-username
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DATABASE=your-postgres-database
POSTGRES_DB=your-postgres-database
POSTGRES_HOSTNAME=your-postgres-host.onrender.com
POSTGRES_USERNAME=your-postgres-username

# MongoDB Database
MONGODB_URI=mongodb+srv://your-mongodb-connection-string

# Application Configuration
NODE_ENV=production
PORT=10000
RENDER=true

# Frontend URL (your frontend service URL)
FRONTEND_URL=https://your-frontend-service.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api

# Security
JWT_SECRET=your-super-secure-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-service.onrender.com
```

#### **Frontend Service Environment Variables:**
```bash
# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# Application Configuration
NODE_ENV=production
```

---

## 🗄️ **DATABASE SETUP ON RENDER**

### **1. Create PostgreSQL Database:**
1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `cedo-postgres`
   - **Database**: `cedo_auth`
   - **User**: `cedo_user`
   - **Region**: Choose closest to your users
4. **Copy the connection details** (you'll need these for environment variables)

### **2. Create MongoDB Database:**
1. Go to Render Dashboard
2. Click "New +" → "MongoDB"
3. Configure:
   - **Name**: `cedo-mongodb`
   - **Database**: `cedo_db`
   - **User**: `cedo_admin`
4. **Copy the connection string** (you'll need this for MONGODB_URI)

---

## ⚙️ **RENDER SERVICE CONFIGURATION**

### **Backend Service Settings:**
- **Build Command**: `npm install; npm run build`
- **Start Command**: `npm run start`
- **Environment**: `Node`
- **Node Version**: `18.20.8` or higher
- **Root Directory**: `backend`

### **Frontend Service Settings:**
- **Build Command**: `npm install; npm run build`
- **Start Command**: `npm run start`
- **Environment**: `Node`
- **Node Version**: `18.20.8` or higher
- **Root Directory**: `frontend`

---

## 🔗 **SERVICE CONNECTIONS**

### **Database Connections:**
1. In your backend service settings
2. Go to "Environment" tab
3. Add "Database" connection:
   - **PostgreSQL**: Select your `cedo-postgres` database
   - **MongoDB**: Select your `cedo-mongodb` database

### **Service Connections:**
1. In your frontend service settings
2. Go to "Environment" tab
3. Add "Service" connection:
   - **Backend Service**: Select your backend service
   - This will auto-populate `NEXT_PUBLIC_BACKEND_URL`

---

## 🚀 **DEPLOYMENT STEPS**

### **1. Set Up Databases:**
```bash
# After creating databases on Render, run these commands locally:
npm run create-postgres-db
npm run init-postgres
```

### **2. Configure Environment Variables:**
- Copy the environment variables from above
- Paste them into your Render service environment settings
- **Replace placeholder values** with your actual database credentials

### **3. Deploy Services:**
1. **Backend First**: Deploy backend service
2. **Frontend Second**: Deploy frontend service
3. **Test Connections**: Verify both services are running

---

## 🔍 **TROUBLESHOOTING**

### **Database Connection Issues:**
- ✅ **Fixed**: Updated database config to use Render's environment variables
- ✅ **Fixed**: Added support for multiple PostgreSQL environment variable names
- ✅ **Fixed**: Proper fallback chain for database credentials

### **Frontend Serving Issues:**
- ✅ **Fixed**: Updated server to serve from `.next` directory instead of `build`
- ✅ **Fixed**: Proper error handling for Render deployment

### **Common Issues:**
1. **"Database does not exist"**: Run `npm run create-postgres-db` first
2. **"Connection refused"**: Check environment variables are set correctly
3. **"404 on frontend"**: Ensure frontend service is deployed and running

---

## 📊 **VERIFICATION CHECKLIST**

### **Backend Service:**
- [ ] PostgreSQL connection successful
- [ ] MongoDB connection successful
- [ ] API endpoints responding
- [ ] Health check passing

### **Frontend Service:**
- [ ] Build successful
- [ ] Backend API connection working
- [ ] Authentication flow working
- [ ] All pages loading correctly

---

## 🎉 **EXPECTED RESULTS**

After proper configuration:
- ✅ **Backend**: Connected to PostgreSQL and MongoDB
- ✅ **Frontend**: Successfully built and deployed
- ✅ **Database**: All tables created and accessible
- ✅ **API**: All endpoints responding correctly
- ✅ **Authentication**: Google OAuth and JWT working

Your application will be fully functional on Render! 🚀
