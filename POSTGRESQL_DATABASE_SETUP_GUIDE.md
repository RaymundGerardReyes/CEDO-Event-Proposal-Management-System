# 🐘 **POSTGRESQL DATABASE SETUP GUIDE**

## 🚨 **PROBLEM IDENTIFIED:**
Your PostgreSQL server is running, but the database `cedo_auth` doesn't exist yet. The application tries to connect to a non-existent database.

## ✅ **SOLUTION PROVIDED:**

I've created a comprehensive database setup solution with the following components:

### **📁 New Files Created:**
1. **`backend/scripts/create-database.js`** - Creates the database first
2. **Updated `backend/package.json`** - Added new npm scripts

### **🔧 New NPM Scripts Available:**
- `npm run create-database` - Creates the `cedo_auth` database
- `npm run init-postgres` - Initializes tables and data
- `npm run setup-postgres` - Runs both commands in sequence

---

## 🚀 **STEP-BY-STEP SOLUTION:**

### **Step 1: Create Your Environment File**
Create `backend/.env` file with your PostgreSQL credentials:

```bash
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_NAME=cedo_auth

# Alternative PostgreSQL Environment Variables
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password_here
POSTGRES_DATABASE=cedo_auth

# Other required variables
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
MONGODB_URI=mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin
```

### **Step 2: Create the Database**
```bash
cd backend
npm run create-database
```

**Expected Output:**
```
🛠️  CEDO PostgreSQL Database Creator starting...
🔗 Connecting to PostgreSQL server at localhost:5432
👤 Using user: postgres
🎯 Target database: cedo_auth
🔌 Connecting to PostgreSQL server...
✅ Connected to PostgreSQL server
🔍 Checking if database 'cedo_auth' exists...
📝 Creating database 'cedo_auth'...
✅ Database 'cedo_auth' created successfully
🎉 Database creation completed successfully!
```

### **Step 3: Initialize Tables and Data**
```bash
npm run init-postgres
```

**Expected Output:**
```
🛠️  CEDO PostgreSQL Database Initializer starting...
🔗 Connecting to PostgreSQL at localhost:5432 with user postgres
📊 Target database: cedo_auth
🔌 Establishing database connection...
✅ Connected to PostgreSQL server
🔧 Creating required extensions...
✅ UUID extension enabled
📋 Creating core tables based on ERD model...
📝 Creating table: users
✅ Table 'users' created successfully
📝 Creating table: proposals
✅ Table 'proposals' created successfully
... (more tables)
👥 Creating production-ready user accounts...
✅ Head Admin user created
✅ System Manager user created
✅ Reviewer user created
✅ Demo Student user created
✅ Pending approval user created
🏢 Creating sample organizations...
✅ Organization 'City Economic Development Office' created
... (more organizations)
🎉 PostgreSQL Database initialization completed successfully!
```

### **Step 4: Start Your Application**
```bash
npm run start
```

**Expected Output:**
```
✅ Environment Variables Loaded
🐘 Using PostgreSQL database
✅ PostgreSQL connection established
✅ MongoDB connection established
✅ Server running on port 5000 in development mode
🎉 Server initialization complete! Ready to accept requests.
```

---

## 🔍 **TROUBLESHOOTING:**

### **If Database Creation Fails:**

#### **Error: `ECONNREFUSED`**
- **Cause**: PostgreSQL server is not running
- **Solution**: Start PostgreSQL service
  ```bash
  # Windows
  net start postgresql-x64-14
  
  # Linux/Mac
  sudo systemctl start postgresql
  ```

#### **Error: `28P01` (Authentication Failed)**
- **Cause**: Wrong username/password
- **Solution**: Check your `.env` file credentials

#### **Error: `42501` (Permission Denied)**
- **Cause**: User doesn't have CREATEDB privilege
- **Solution**: Grant privileges to your user:
  ```sql
  ALTER USER postgres CREATEDB;
  ```

### **If Initialization Fails:**

#### **Error: `relation already exists`**
- **Cause**: Tables already exist
- **Solution**: This is normal - the script handles existing tables gracefully

#### **Error: `permission denied for schema public`**
- **Cause**: User doesn't have schema permissions
- **Solution**: Grant permissions:
  ```sql
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
  ```

---

## 📊 **VERIFICATION:**

### **Check Database Connection:**
```bash
# Test connection
psql -h localhost -U postgres -d cedo_auth -c "SELECT version();"
```

### **Check Tables:**
```bash
# List all tables
psql -h localhost -U postgres -d cedo_auth -c "\dt"
```

### **Check Users:**
```bash
# List all users
psql -h localhost -U postgres -d cedo_auth -c "SELECT email, role, is_approved FROM users;"
```

---

## 🎯 **EXPECTED RESULTS:**

After successful setup, you should have:

### **✅ Database:**
- Database `cedo_auth` created
- All tables created with proper indexes
- Foreign key constraints established
- Triggers for `updated_at` timestamps

### **✅ Sample Data:**
- **Head Admin**: `admin@cedo.gov.ph` (Password: `CEDOAdmin2024!@#`)
- **System Manager**: `manager@cedo.gov.ph` (Password: `CEDOManager2024!@#`)
- **Reviewer**: `reviewer@cedo.gov.ph` (Password: `CEDOReviewer2024!@#`)
- **Demo Student**: `student@xu.edu.ph` (Password: `StudentDemo2024!`)
- **Pending User**: `pending@example.com` (Password: `PendingUser2024!`)

### **✅ Organizations:**
- City Economic Development Office
- Xavier University
- Cagayan de Oro Community Foundation

---

## 🚀 **QUICK START COMMANDS:**

```bash
# 1. Navigate to backend
cd backend

# 2. Create and setup database (one command)
npm run setup-postgres

# 3. Start the application
npm run start
```

Your PostgreSQL database will be fully configured and ready to use! 🎉
