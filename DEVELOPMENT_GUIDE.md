# 🚀 CEDO Development Guide - Testing Production Optimizations

## **Overview**
This guide helps you test all the production-ready performance optimizations in your development environment. You can safely experiment with Redis caching, database connection pooling, clustering, and monitoring without affecting your production setup.

## **🎯 What You Can Test in Development**

### **Performance Features Available:**
- ✅ **Redis Caching** with intelligent fallback to in-memory cache
- ✅ **MySQL Connection Pooling** with optimized settings
- ✅ **MongoDB Connection Optimization** with performance monitoring
- ✅ **Node.js Clustering** (optional - can be disabled for easier debugging)
- ✅ **Performance Monitoring** with Grafana dashboards
- ✅ **Database Admin Interfaces** for easy management
- ✅ **Enhanced Logging** and debugging capabilities

## **🚀 Quick Start**

### **Option 1: Automated Setup (Recommended)**
```bash
# Run the automated development setup
./scripts/setup-development.sh
```

### **Option 2: Manual Setup**
```bash
# 1. Copy environment file
cp env.development.example .env.development

# 2. Update with your Google OAuth credentials
# Edit .env.development file

# 3. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Start development services
docker-compose -f docker-compose.dev.yml up -d

# 5. Start applications
cd backend && npm run dev &
cd frontend && npm run dev &
```

## **🌐 Development URLs**

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:5001 | - |
| **MySQL Admin** | http://localhost:8080 | auto-login |
| **MongoDB Admin** | http://localhost:8081 | admin/admin123 |
| **Redis Admin** | http://localhost:8082 | admin/admin123 |
| **Grafana Dashboard** | http://localhost:3002 | admin/admin123 |

## **🧪 Testing Performance Features**

### **1. Redis Caching Test**
```bash
# Test Redis caching
curl http://localhost:5001/api/proposals/1
# First call - cache miss
# Second call - cache hit (should be faster)

# Check cache status in Redis Commander
# Visit: http://localhost:8082
```

### **2. Database Connection Pooling Test**
```bash
# Monitor database connections in phpMyAdmin
# Visit: http://localhost:8080
# Go to Status > Processes to see active connections

# Run multiple concurrent requests to test pooling
for i in {1..10}; do
  curl http://localhost:5001/api/proposals &
done
```

### **3. Performance Monitoring Test**
```bash
# View performance metrics in Grafana
# Visit: http://localhost:3002
# Default dashboard shows:
# - Response times
# - Memory usage
# - Database query performance
# - Cache hit rates
```

### **4. File Upload Performance Test**
```bash
# Test file upload with performance monitoring
curl -X POST -F "file=@test-file.pdf" http://localhost:5001/api/upload

# Monitor in Grafana for:
# - Upload time
# - Memory usage during upload
# - Database write performance
```

## **📊 Performance Monitoring**

### **Key Metrics to Watch:**
- **Response Time**: Should be < 200ms for cached requests
- **Memory Usage**: Should remain stable during load
- **Cache Hit Rate**: Should be > 80% after warming up
- **Database Connections**: Should pool efficiently
- **File Upload Speed**: Should handle large files smoothly

### **Grafana Dashboards:**
1. **Application Overview**: General performance metrics
2. **Database Performance**: Query times, connection pools
3. **Cache Performance**: Redis hit rates, memory usage
4. **System Resources**: CPU, memory, disk usage

## **🔧 Development Configuration**

### **Environment Differences:**
| Feature | Development | Production |
|---------|-------------|------------|
| **Clustering** | Disabled (easier debugging) | Enabled (all cores) |
| **Cache Size** | 256MB Redis | 512MB Redis |
| **Database Pool** | 100 connections | 200 connections |
| **Logging** | Enhanced debugging | Optimized performance |
| **SSL** | HTTP only | HTTPS required |

### **Database Ports (to avoid conflicts):**
- MySQL: `3307` (instead of 3306)
- MongoDB: `27018` (instead of 27017)  
- Redis: `6380` (instead of 6379)

## **🐛 Debugging Features**

### **Enhanced Logging:**
```bash
# Backend logs with performance metrics
cd backend && npm run dev

# Check logs for:
# - Cache hit/miss information
# - Database query performance
# - Memory usage warnings
# - Slow request alerts
```

### **Database Query Monitoring:**
```sql
-- Check slow queries in MySQL
SELECT * FROM information_schema.processlist;

-- View query cache status
SHOW STATUS LIKE 'Qcache%';
```

### **Redis Cache Inspection:**
```bash
# Connect to Redis CLI
docker exec -it cedo-redis-dev redis-cli

# Check cache keys
KEYS cedo:*

# Get cache statistics
INFO stats
```

## **🧪 Performance Testing Scenarios**

### **Scenario 1: Cache Performance**
```bash
# Test cache warming
for i in {1..50}; do
  curl http://localhost:5001/api/proposals/$i
done

# Check cache hit rate in Redis Commander
# Should see increasing hit rate over time
```

### **Scenario 2: Database Load Testing**
```bash
# Simulate concurrent users
ab -n 100 -c 10 http://localhost:5001/api/proposals

# Monitor in phpMyAdmin:
# - Active connections
# - Query cache usage
# - Performance schema data
```

### **Scenario 3: File Upload Stress Test**
```bash
# Test multiple file uploads
for i in {1..5}; do
  curl -X POST -F "file=@large-test-file.pdf" \
    http://localhost:5001/api/upload &
done

# Monitor in Grafana:
# - Memory usage spikes
# - Upload completion times
# - Database write performance
```

## **🔍 Troubleshooting**

### **Common Issues:**

**Redis Connection Failed:**
```bash
# Check Redis container
docker logs cedo-redis-dev

# Restart Redis
docker-compose -f docker-compose.dev.yml restart redis-dev
```

**Database Connection Issues:**
```bash
# Check database containers
docker-compose -f docker-compose.dev.yml ps

# View database logs
docker logs cedo-mysql-dev
docker logs cedo-mongodb-dev
```

**Performance Issues:**
```bash
# Check system resources
docker stats

# Monitor application logs
tail -f backend/logs/app.log
```

## **📈 Performance Benchmarks**

### **Expected Development Performance:**
| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| **API Response** | < 500ms | < 200ms | < 100ms |
| **Cache Hit Rate** | > 60% | > 80% | > 90% |
| **Database Query** | < 100ms | < 50ms | < 20ms |
| **File Upload** | < 5s | < 2s | < 1s |
| **Memory Usage** | < 512MB | < 256MB | < 128MB |

## **🚀 Moving to Production**

### **When You're Ready:**
1. **Test all features** in development environment
2. **Monitor performance** metrics for stability
3. **Verify cache hit rates** are consistently high
4. **Test file uploads** with large files
5. **Run load tests** to ensure scalability

### **Production Deployment:**
```bash
# Switch to production setup
./scripts/setup-production.sh
```

## **📚 Additional Resources**

### **Development Tools:**
- **Artillery**: Load testing (`npm install -g artillery`)
- **k6**: Performance testing (`brew install k6`)
- **Redis CLI**: Cache debugging (`docker exec -it cedo-redis-dev redis-cli`)

### **Monitoring Queries:**
```sql
-- MySQL Performance
SHOW STATUS LIKE 'Slow_queries';
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Qcache_hits';

-- Check connection pool usage
SHOW PROCESSLIST;
```

### **Redis Monitoring:**
```bash
# Redis performance info
redis-cli INFO stats
redis-cli INFO memory
redis-cli MONITOR  # Watch real-time commands
```

## **🎉 Success Indicators**

Your development environment is optimized when you see:
- ✅ **Sub-second response times** for cached requests
- ✅ **90%+ cache hit rate** after warm-up
- ✅ **Stable memory usage** under load
- ✅ **Efficient database connection pooling**
- ✅ **Smooth file uploads** without timeouts
- ✅ **Real-time performance monitoring** in Grafana

## **🔄 Next Steps**

1. **Test all features** thoroughly in development
2. **Monitor performance** metrics regularly  
3. **Optimize based on** real usage patterns
4. **Document any issues** or improvements needed
5. **Prepare for production** deployment when ready

Your CEDO application is now ready for high-performance testing in development! 🚀 