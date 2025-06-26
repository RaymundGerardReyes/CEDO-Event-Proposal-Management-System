# 🪟 **Windows Command Reference for CEDO Production**

## **🚀 Quick Start Commands (Windows)**

### **Start/Stop Production Environment**
```bash
# Start everything
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Stop everything  
docker-compose -f docker-compose.prod.yml --env-file .env.prod down

# Restart specific service
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart frontend
```

### **✅ Windows Equivalents for Missing Commands**

#### **Instead of `open` (macOS) - use:**
```bash
start http://localhost:3000      # Open frontend
start http://localhost:3001      # Open Grafana
start http://localhost:9090      # Open Prometheus
```

#### **Instead of `watch` (Linux) - use:**
```bash
# Continuous monitoring (press Ctrl+C to stop)
while true; do clear; docker-compose -f docker-compose.prod.yml --env-file .env.prod ps; sleep 5; done

# Or simple one-time check:
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
```

## **🔍 Status & Monitoring Commands**

### **Service Status**
```bash
# Check all services
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

# Check only healthy services
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps | findstr healthy

# Check service logs
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs frontend --tail 20
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs backend --tail 20
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs nginx --tail 20
```

### **Health Check Testing**
```bash
# Test endpoints directly
curl http://localhost/health           # Nginx health
curl http://localhost:3000            # Frontend
curl http://localhost:5000/health     # Backend
curl http://localhost:9090/-/healthy  # Prometheus
```

## **🛠️ Troubleshooting Commands**

### **Container Management**
```bash
# Restart unhealthy services
docker-compose -f docker-compose.prod.yml --env-file .env.prod restart frontend nginx grafana prometheus

# Force rebuild corrupted service
docker-compose -f docker-compose.prod.yml --env-file .env.prod stop frontend
docker-compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache frontend  
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d frontend

# Remove and recreate everything (nuclear option)
docker-compose -f docker-compose.prod.yml --env-file .env.prod down -v
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### **Log Analysis**
```bash
# Follow logs in real-time
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f frontend

# Check for errors
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs frontend | findstr ERROR
docker-compose -f docker-compose.prod.yml --env-file .env.prod logs backend | findstr ERROR
```

## **💻 Windows PowerShell Alternatives**

If you prefer **PowerShell** over Git Bash:

```powershell
# Open in browser
Start-Process "http://localhost:3000"

# Continuous monitoring
while ($true) { Clear-Host; docker-compose -f docker-compose.prod.yml --env-file .env.prod ps; Start-Sleep 5 }

# Check health status
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps | Select-String "healthy"
```

## **🎯 Production Access Points**

- **🌐 Frontend**: http://localhost:3000
- **🔧 Admin Dashboard**: http://localhost:3000/admin-dashboard  
- **📊 Grafana**: http://localhost:3001 (admin/admin123)
- **📈 Prometheus**: http://localhost:9090
- **🗄️ MySQL**: localhost:3307 (root/rootPassword123!)
- **📄 MongoDB**: localhost:27018 (root/mongoPassword123!)
- **⚡ Redis**: localhost:6379

## **📝 Helpful Aliases (Add to .bashrc)**

```bash
# Add these to your ~/.bashrc file for shortcuts:
alias prod-up='docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d'
alias prod-down='docker-compose -f docker-compose.prod.yml --env-file .env.prod down'
alias prod-status='docker-compose -f docker-compose.prod.yml --env-file .env.prod ps'
alias prod-logs='docker-compose -f docker-compose.prod.yml --env-file .env.prod logs'
alias prod-frontend='start http://localhost:3000'
alias prod-monitor='start http://localhost:3001'
```

## **⚠️ Emergency Commands**

### **If Everything is Broken:**
```bash
# Nuclear reset (WARNING: Destroys all data!)
docker-compose -f docker-compose.prod.yml --env-file .env.prod down -v --remove-orphans
docker system prune -f
docker volume prune -f
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### **If Single Service is Stuck:**
```bash
# Force kill and restart specific service
docker kill cedo-nginx-prod
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d nginx
```

---

**🎉 Your CEDO Production Environment is now Windows-ready!** 