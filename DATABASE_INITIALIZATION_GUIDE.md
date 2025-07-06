# CEDO Database Initialization Guide

## Overview

This guide covers the comprehensive database initialization system for the CEDO Event Management System, implementing a **hybrid database architecture** based on the specifications in `CEDO_ERD_Data_Model.md`.

## Architecture Overview

The CEDO system uses a **hybrid database approach**:

- **MySQL**: Relational data (users, simplified proposals, audit logs, sessions)
- **MongoDB**: Document-based data (complex proposals, file metadata, GridFS storage)

## Database Initializers

### 1. MySQL Initializer (`backend/scripts/init-db.js`)

#### Features
- ✅ Production-ready user management with comprehensive roles
- ✅ Simplified proposal metadata storage for fast queries
- ✅ Comprehensive audit logging with triggers
- ✅ Database views for common query patterns
- ✅ Stored procedures for complex operations
- ✅ Performance-optimized indexes
- ✅ Sample data with secure default accounts

#### Tables Created

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts and authentication | RBAC, approval workflow, OAuth support |
| `proposals` | Simplified proposal metadata | Fast queries, status tracking, file references |
| `audit_logs` | System activity tracking | Comprehensive logging, IP tracking, JSON data |
| `organizations` | Organization management | Contact info, type classification |
| `sessions` | Session management | Secure session tracking, expiration |

#### Default Accounts Created

| Role | Email | Password | Status |
|------|-------|----------|--------|
| Head Admin | admin@cedo.gov.ph | CEDOAdmin2024!@# | Approved |
| Manager | manager@cedo.gov.ph | CEDOManager2024!@# | Approved |
| Reviewer | reviewer@cedo.gov.ph | CEDOReviewer2024!@# | Approved |
| Student | student@xu.edu.ph | StudentDemo2024! | Approved |
| Pending User | pending@example.com | PendingUser2024! | **Pending Approval** |

### 2. MongoDB Initializer (`backend/scripts/init-mongodb.js`)

#### Features
- ✅ Document validation schemas for data integrity
- ✅ Comprehensive indexing for performance
- ✅ GridFS bucket setup for file storage
- ✅ Sample organizations and proposals
- ✅ Production-ready connection handling with retry logic
- ✅ Health check integration

#### Collections Created

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| `proposals` | Complex proposal documents | Full event details, embedded documents, validation |
| `organizations` | Organization master data | Contact management, type classification |
| `proposal_files` | File metadata | GridFS integration, upload tracking |
| `accomplishment_reports` | Event completion reports | Detailed outcomes, financial summaries |
| `file_uploads` | File operation audit | Upload/download tracking, security logging |
| `proposal_files.files` | GridFS file storage | Large file handling, metadata |
| `proposal_files.chunks` | GridFS chunk storage | Efficient file streaming |

## Installation and Setup

### Prerequisites

1. **Node.js** 18+ with npm/yarn
2. **MySQL** 8.0+ server running
3. **MongoDB** 4.4+ server running
4. **Environment variables** configured

### Environment Configuration

Create a `.env` file in the backend directory:

```bash
# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cedo_auth

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=cedo_db

# MongoDB Authentication (if MongoDB requires authentication)
MONGODB_USER=your_mongo_username
MONGODB_PASSWORD=your_mongo_password
MONGODB_AUTH_DB=admin

# Optional: Connection retry settings
DB_CONNECT_RETRIES=5
DB_CONNECT_DELAY_MS=3000
```

### Running the Initializers

#### Option 1: Individual Initialization

```bash
# Initialize MySQL database
cd backend
node scripts/init-db.js

# Initialize MongoDB database
node scripts/init-mongodb.js
```

#### Option 2: Combined Initialization

```bash
# Run both initializers sequentially
cd backend
npm run init-databases
```

**Note**: The `init-databases` script runs MySQL initialization first, then MongoDB initialization. If MySQL fails, MongoDB initialization will not run.

#### Option 3: MongoDB Development Setup

If you encounter MongoDB authentication issues, use the development setup helper:

```bash
# Setup MongoDB for development (no authentication)
cd backend
npm run setup-mongodb-dev
```

This script will:
- Check if MongoDB is running
- Create development configuration files
- Generate environment variables
- Provide step-by-step instructions

#### Option 4: Docker Environment

```bash
# Using docker-compose with database services
docker-compose up -d mysql mongodb
npm run init-databases
```

## Production Deployment

### Security Considerations

1. **Change Default Passwords**: All default passwords must be changed in production
2. **Environment Variables**: Use secure secret management (AWS Secrets Manager, Azure Key Vault)
3. **Network Security**: Configure firewalls and VPCs appropriately
4. **SSL/TLS**: Enable encryption in transit for both databases
5. **Backup Strategy**: Implement automated backups for both systems

### Performance Optimization

#### MySQL Optimizations
```sql
-- Recommended MySQL configuration
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
```

#### MongoDB Optimizations
```javascript
// Recommended MongoDB connection options
{
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000
}
```

### Monitoring and Health Checks

#### MySQL Health Check
```sql
-- Basic health check query
SELECT 1 as health_check;

-- Performance monitoring
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
```

#### MongoDB Health Check
```javascript
// Health check function
await db.admin().ping();

// Performance monitoring
db.runCommand({ serverStatus: 1 });
db.stats();
```

## Data Models and Relationships

### Cross-Database Relationships

The hybrid architecture maintains logical relationships between MySQL and MongoDB:

```
MySQL Users ←→ MongoDB Proposals (via submitter field)
MySQL Proposals ←→ MongoDB Proposals (via UUID sync)
MySQL Audit ←→ MongoDB File Operations (via audit trail)
```

### Data Flow Patterns

1. **User Authentication**: MySQL (fast relational queries)
2. **Proposal Metadata**: MySQL (reporting and dashboards)
3. **Complex Proposals**: MongoDB (flexible document structure)
4. **File Storage**: MongoDB GridFS (large file handling)
5. **Audit Trail**: MySQL (ACID compliance for critical logs)

## Troubleshooting

### Common Issues

#### Foreign Key Data Type Mismatch
**Error**: `Referencing column 'reviewed_by_admin_id' and referenced column 'id' in foreign key constraint are incompatible`

**Solution**: This error occurred when foreign key columns had mismatched data types. The issue has been fixed by ensuring all foreign key references use consistent data types (INT for user IDs).

#### Invalid MySQL2 Configuration Options
**Error**: `Ignoring invalid configuration option passed to Connection`

**Solution**: Removed deprecated/invalid options (`collation`, `acquireTimeout`, `timeout`, `reconnect`) from the connection configuration. These warnings are now eliminated.

#### Missing npm Scripts
**Error**: `npm error Missing script: "init-databases"`

**Solution**: Added the missing scripts to package.json:
- `init-mongodb`: Initialize MongoDB only
- `init-databases`: Initialize both MySQL and MongoDB sequentially

#### MongoDB Authentication Error
**Error**: `Command listCollections requires authentication`

**Solution**: Your MongoDB instance requires authentication. Configure authentication in one of these ways:

1. **Using Environment Variables**:
   ```bash
   export MONGODB_USER=your_username
   export MONGODB_PASSWORD=your_password
   export MONGODB_AUTH_DB=admin
   ```

2. **Using Complete Connection String**:
   ```bash
   export MONGODB_URI=mongodb://username:password@localhost:27017?authSource=admin
   ```

3. **Disable Authentication** (development only):
   ```bash
   # Edit MongoDB config file (usually /etc/mongod.conf)
   # Comment out or remove the security section:
   # security:
   #   authorization: enabled
   ```

#### MySQL Connection Issues
```bash
# Check MySQL service status
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1;"

# Check user privileges
SHOW GRANTS FOR 'your_user'@'localhost';
```

#### MongoDB Connection Issues
```bash
# Check MongoDB service status
sudo systemctl status mongod

# Test connection (no auth)
mongosh --eval "db.adminCommand('ping')"

# Test connection (with auth)
mongosh --authenticationDatabase admin -u your_username -p your_password --eval "db.adminCommand('ping')"

# Check authentication
mongosh --authenticationDatabase admin -u admin -p
```

#### Permission Issues
```bash
# MySQL user creation
CREATE USER 'cedo_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON cedo_auth.* TO 'cedo_user'@'localhost';
FLUSH PRIVILEGES;

# MongoDB user creation
use cedo_db
db.createUser({
  user: "cedo_user",
  pwd: "secure_password",
  roles: ["readWrite", "dbAdmin"]
});
```

### Error Codes and Solutions

| Error | Database | Solution |
|-------|----------|----------|
| ER_ACCESS_DENIED_ERROR | MySQL | Check credentials and user privileges |
| ECONNREFUSED | Both | Verify database service is running |
| MongoServerSelectionError | MongoDB | Check connection string and network |
| ER_BAD_DB_ERROR | MySQL | Ensure database exists or auto-create enabled |
| Command listCollections requires authentication | MongoDB | Configure MongoDB authentication credentials |

## Maintenance and Updates

### Regular Maintenance Tasks

#### Daily
- Monitor connection pool usage
- Check error logs
- Verify backup completion

#### Weekly
- Review audit logs
- Update statistics
- Check index performance

#### Monthly
- Security patches
- Performance tuning
- Capacity planning

### Database Migrations

#### MySQL Schema Changes
```javascript
// Example migration script
async function migrateSchema() {
  await connection.query(`
    ALTER TABLE proposals 
    ADD COLUMN new_field VARCHAR(255) 
    AFTER existing_field
  `);
}
```

#### MongoDB Schema Updates
```javascript
// Example validation update
await db.runCommand({
  collMod: "proposals",
  validator: newValidationSchema
});
```

## Integration with Application

### Service Layer Integration

```javascript
// Hybrid service example
class ProposalService {
  async createProposal(data) {
    // 1. Store metadata in MySQL
    const mysqlResult = await mysql.query(
      'INSERT INTO proposals SET ?', 
      metadata
    );
    
    // 2. Store full document in MongoDB
    const mongoResult = await mongodb
      .collection('proposals')
      .insertOne(fullDocument);
    
    // 3. Return unified response
    return { mysqlId: mysqlResult.insertId, mongoId: mongoResult.insertedId };
  }
}
```

### API Integration

```javascript
// Health check endpoint
app.get('/health/databases', async (req, res) => {
  const mysqlHealth = await checkMySQLHealth();
  const mongoHealth = await checkMongoDBHealth();
  
  res.json({
    mysql: mysqlHealth ? 'healthy' : 'unhealthy',
    mongodb: mongoHealth ? 'healthy' : 'unhealthy',
    overall: mysqlHealth && mongoHealth ? 'healthy' : 'degraded'
  });
});
```

## Security Best Practices

### Authentication and Authorization
- Use strong passwords (12+ characters, mixed case, numbers, symbols)
- Implement role-based access control (RBAC)
- Regular password rotation
- Multi-factor authentication for admin accounts

### Network Security
- Use private networks/VPCs
- Configure firewalls (only necessary ports)
- Enable SSL/TLS encryption
- VPN access for remote administration

### Data Protection
- Encrypt sensitive data at rest
- Implement field-level encryption for PII
- Regular security audits
- Compliance with data protection regulations

### Backup and Recovery
- Automated daily backups
- Test restore procedures monthly
- Offsite backup storage
- Point-in-time recovery capability

## Performance Benchmarks

### Expected Performance Metrics

| Operation | MySQL | MongoDB | Target Response Time |
|-----------|-------|---------|---------------------|
| User Login | ✅ | - | < 100ms |
| Proposal List | ✅ | - | < 200ms |
| Proposal Details | ✅ | ✅ | < 300ms |
| File Upload | - | ✅ | < 2s |
| Search Proposals | ✅ | ✅ | < 500ms |

### Scaling Recommendations

#### Small Deployment (< 1000 users)
- Single MySQL instance
- Single MongoDB instance
- Basic monitoring

#### Medium Deployment (1000-10000 users)
- MySQL master-slave replication
- MongoDB replica set
- Connection pooling
- Enhanced monitoring

#### Large Deployment (10000+ users)
- MySQL cluster/sharding
- MongoDB sharded cluster
- Load balancers
- Advanced monitoring and alerting

## Support and Resources

### Documentation Links
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Node.js MySQL2 Driver](https://github.com/sidorares/node-mysql2)
- [Node.js MongoDB Driver](https://mongodb.github.io/node-mongodb-native/)

### Community Resources
- [MySQL Community Forums](https://forums.mysql.com/)
- [MongoDB Community Forums](https://developer.mongodb.com/community/forums/)
- [Stack Overflow Tags: mysql, mongodb, node.js](https://stackoverflow.com/)

### Professional Support
- MySQL Enterprise Support
- MongoDB Atlas/Enterprise Support
- Third-party database consulting services

---

## Conclusion

This hybrid database initialization system provides a robust foundation for the CEDO Event Management System, combining the strengths of both relational and document databases while maintaining data integrity, performance, and scalability.

The system is designed to handle the complex requirements of event management while providing flexibility for future enhancements and growth.

For additional support or questions, please refer to the troubleshooting section or contact the development team. 