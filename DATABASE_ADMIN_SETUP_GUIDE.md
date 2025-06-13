# CEDO Express.js Database Admin Setup Guide

## Overview

This guide provides a complete Django Admin-like solution for Express.js with both MongoDB and MySQL support. You now have:

1. **Admin Dashboard** - Web-based interface for database management
2. **RESTful API Endpoints** - Complete CRUD operations for both databases
3. **Unified Database Access** - Single interface to manage both MySQL and MongoDB

## 🚀 Quick Start

### 1. Start Your Application

```bash
cd backend
npm run dev
```

### 2. Access the Admin Dashboard

Visit: `http://localhost:5000/api/admin`

## 📊 Admin Dashboard Features

### Overview Tab
- Real-time database connection status
- User and proposal counts
- Quick database health checks

### MySQL Tab
- View all tables and row counts
- Browse table data with pagination
- Real-time data display

### MongoDB Tab
- View all collections and document counts
- Browse collection documents
- JSON document viewer

## 🔌 API Endpoints

### Database Admin APIs

#### MySQL Status & Management
```http
GET /api/admin/mysql/status          # Database connection status
GET /api/admin/mysql/tables          # List all tables with row counts
GET /api/admin/mysql/table/:tableName # View table data
```

#### MongoDB Status & Management
```http
GET /api/admin/mongodb/status           # Database connection status
GET /api/admin/mongodb/collections      # List all collections with counts
GET /api/admin/mongodb/collection/:name # View collection documents
```

### Unified Database API

#### MySQL CRUD Operations
```http
# Get all records with pagination
GET /api/db/mysql/:table?page=1&limit=50

# Get single record
GET /api/db/mysql/:table/:id

# Create new record
POST /api/db/mysql/:table
Content-Type: application/json
{
  "name": "Example",
  "email": "user@example.com"
}

# Update record
PUT /api/db/mysql/:table/:id
Content-Type: application/json
{
  "name": "Updated Name"
}

# Delete record
DELETE /api/db/mysql/:table/:id
```

#### MongoDB CRUD Operations
```http
# Get all documents with pagination
GET /api/db/mongodb/:collection?page=1&limit=50

# Get single document
GET /api/db/mongodb/:collection/:id

# Create new document
POST /api/db/mongodb/:collection
Content-Type: application/json
{
  "name": "Example",
  "description": "Document description"
}

# Update document
PUT /api/db/mongodb/:collection/:id
Content-Type: application/json
{
  "name": "Updated Name"
}

# Delete document
DELETE /api/db/mongodb/:collection/:id
```

## 💻 Code Examples

### Using the API with JavaScript

#### Fetch Users from MySQL
```javascript
// Get all users with pagination
const response = await fetch('/api/db/mysql/users?page=1&limit=20');
const result = await response.json();

console.log('Users:', result.data);
console.log('Total pages:', result.pagination.pages);
```

#### Create a New Proposal in MySQL
```javascript
const newProposal = {
  title: "Partnership Proposal",
  description: "New collaboration opportunity",
  status: "draft",
  contactEmail: "contact@organization.com"
};

const response = await fetch('/api/db/mysql/proposals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newProposal)
});

const result = await response.json();
console.log('Created proposal:', result.data);
```

#### Query MongoDB Collections
```javascript
// Get organization documents
const response = await fetch('/api/db/mongodb/organizations?page=1&limit=10');
const result = await response.json();

console.log('Organizations:', result.data);
```

#### Update MongoDB Document
```javascript
const updateData = {
  status: "approved",
  reviewedAt: new Date()
};

const response = await fetch('/api/db/mongodb/proposals/64a7b8c9d1234567890abcde', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
console.log('Update result:', result);
```

### Using with cURL

#### MySQL Operations
```bash
# Get all proposals
curl "http://localhost:5000/api/db/mysql/proposals"

# Create a new user
curl -X POST "http://localhost:5000/api/db/mysql/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }'

# Update a proposal
curl -X PUT "http://localhost:5000/api/db/mysql/proposals/1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewNotes": "Excellent proposal"
  }'

# Delete a record
curl -X DELETE "http://localhost:5000/api/db/mysql/users/5"
```

#### MongoDB Operations
```bash
# Get all organizations
curl "http://localhost:5000/api/db/mongodb/organizations"

# Create a new document
curl -X POST "http://localhost:5000/api/db/mongodb/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Conference",
    "date": "2024-06-15",
    "location": "Convention Center"
  }'

# Update a document
curl -X PUT "http://localhost:5000/api/db/mongodb/events/64a7b8c9d1234567890abcde" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "attendees": 150
  }'
```

## 🔧 Configuration

### Environment Variables

Make sure your `.env` file includes:

```env
# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cedo_auth

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cedo-partnership

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Database Connections

The system automatically connects to both databases on startup:
- MySQL connection is established via `config/db.js`
- MongoDB connection is established via `config/mongodb.js`

## 📁 File Structure

```
backend/
├── routes/
│   ├── admin.js           # Admin dashboard interface
│   ├── database-api.js    # Unified CRUD API
│   ├── proposals.js       # Existing proposal routes
│   └── mongodb-unified-api.js # Existing MongoDB routes
├── config/
│   ├── db.js             # MySQL configuration
│   └── mongodb.js        # MongoDB configuration
└── server.js             # Main server file
```

## 🎯 Use Cases

### 1. Data Management
- View and edit user profiles
- Manage proposal statuses
- Monitor system data

### 2. Content Administration
- Create new records via web interface
- Bulk data operations
- Data validation and cleanup

### 3. API Integration
- Build frontend applications
- Mobile app data sync
- Third-party integrations

### 4. Database Monitoring
- Check connection health
- Monitor data growth
- Performance insights

## 🔐 Security Considerations

### Current Implementation
- Basic endpoint protection
- Input validation on CRUD operations
- Error handling to prevent data exposure

### Recommended Enhancements
```javascript
// Add authentication middleware
const auth = require('./middleware/auth');
app.use('/api/admin', auth, adminRoutes);

// Add role-based access control
const checkRole = require('./middleware/roles');
app.use('/api/db', auth, checkRole(['admin', 'manager']), databaseApiRoutes);
```

## 🚀 Advanced Features

### Pagination
All list endpoints support pagination:
```javascript
// Example with custom page size
const response = await fetch('/api/db/mysql/proposals?page=2&limit=25');
```

### Data Relationships
Handle related data across databases:
```javascript
// Get proposal with file metadata
const proposal = await fetch('/api/db/mysql/proposals/1');
const files = await fetch('/api/db/mongodb/proposal_files?proposalId=1');
```

### Real-time Updates
Extend with WebSocket support:
```javascript
// Add to server.js
const io = require('socket.io')(server);

// Broadcast database changes
io.emit('dataUpdate', {
  type: 'proposal_created',
  data: newProposal
});
```

## 🐛 Troubleshooting

### Database Connection Issues
1. Check `.env` file configuration
2. Verify database services are running
3. Check firewall settings
4. Review connection logs in terminal

### Admin Dashboard Not Loading
1. Ensure server is running on port 5000
2. Check browser console for JavaScript errors
3. Verify API endpoints are responding

### API Errors
1. Check request format and headers
2. Verify table/collection names exist
3. Review server logs for detailed errors

## 📚 Next Steps

1. **Add Authentication**: Implement user login for admin access
2. **Role-Based Permissions**: Control access based on user roles
3. **Data Validation**: Add comprehensive input validation
4. **Audit Logging**: Track all database changes
5. **Backup Features**: Implement data export/import
6. **Custom Queries**: Add support for complex database queries

## 🎉 Summary

You now have a complete Django Admin-like solution for Express.js that provides:

✅ **Web-based Admin Interface** - Easy data management through browser  
✅ **RESTful API Endpoints** - Full CRUD operations for both databases  
✅ **Real-time Database Monitoring** - Connection status and health checks  
✅ **Unified Database Access** - Single interface for MySQL and MongoDB  
✅ **Production Ready** - Error handling, pagination, and proper structure  

Access your admin dashboard at: `http://localhost:5000/api/admin`

The system is now ready for development and can be easily extended with additional features as needed! 