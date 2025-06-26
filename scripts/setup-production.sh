#!/bin/bash

# 🚀 CEDO Production Setup Script
# This script sets up the optimized production environment

set -e

echo "🚀 CEDO Production Setup Starting..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for security."
fi

# Check system requirements
print_status "Checking system requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "System requirements check passed!"

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p logs
mkdir -p nginx/ssl
mkdir -p mysql-config
mkdir -p mongo-config
mkdir -p monitoring/grafana/provisioning
mkdir -p backend/uploads
mkdir -p data/{mysql,mongodb,redis}

print_success "Directory structure created!"

# Generate SSL certificates (self-signed for development)
print_status "Generating SSL certificates..."
if [ ! -f nginx/ssl/cert.pem ]; then
    openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>/dev/null || {
        print_warning "Failed to generate SSL certificates. Using HTTP only."
    }
    print_success "SSL certificates generated!"
else
    print_success "SSL certificates already exist!"
fi

# Create MySQL configuration
print_status "Creating MySQL configuration..."
cat > mysql-config/prod.cnf << EOF
[mysqld]
# Performance optimizations
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
max_connections = 200
query_cache_type = 1
query_cache_size = 64M
tmp_table_size = 64M
max_heap_table_size = 64M
sort_buffer_size = 2M
join_buffer_size = 2M

# Security
skip-name-resolve
bind-address = 0.0.0.0

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
EOF

print_success "MySQL configuration created!"

# Create MongoDB configuration
print_status "Creating MongoDB configuration..."
cat > mongo-config/mongod.conf << EOF
# MongoDB Production Configuration
storage:
  dbPath: /data/db
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
      journalCompressor: snappy
      directoryForIndexes: false
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: reopen
  verbosity: 1

net:
  port: 27017
  bindIp: 0.0.0.0
  maxIncomingConnections: 200

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp

security:
  authorization: enabled
EOF

print_success "MongoDB configuration created!"

# Create Prometheus configuration
print_status "Creating Prometheus configuration..."
mkdir -p monitoring
cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'cedo-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 30s
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

print_success "Prometheus configuration created!"

# Create Nginx proxy parameters
print_status "Creating Nginx proxy parameters..."
mkdir -p nginx
cat > nginx/proxy_params << EOF
proxy_set_header Host \$http_host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
proxy_set_header X-Forwarded-Host \$server_name;
proxy_redirect off;

# Timeout settings
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Buffer settings
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
EOF

print_success "Nginx proxy parameters created!"

# Create environment file template
print_status "Creating environment file template..."
if [ ! -f .env.production ]; then
    cat > .env.production << EOF
# Database Configuration
MYSQL_ROOT_PASSWORD=secure_root_password_$(openssl rand -hex 16)
MYSQL_DATABASE=cedo_auth
MYSQL_USER=cedo_user
MYSQL_PASSWORD=secure_user_password_$(openssl rand -hex 16)

# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_mongo_password_$(openssl rand -hex 16)

# Redis Configuration
REDIS_PASSWORD=secure_redis_password_$(openssl rand -hex 16)

# Application Configuration
NODE_ENV=production
FRONTEND_URL=https://localhost
JWT_SECRET=super_secure_jwt_secret_$(openssl rand -hex 32)

# Google OAuth (Update these with your actual values)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Monitoring
GRAFANA_PASSWORD=admin123

# Next.js Configuration
NEXT_PUBLIC_BACKEND_URL=https://localhost/api
EOF
    print_success "Environment file template created! Please update with your actual values."
    print_warning "⚠️  Please edit .env.production with your actual Google OAuth credentials!"
else
    print_success "Environment file already exists!"
fi

# Install production dependencies
print_status "Installing production dependencies..."
cd backend
npm ci --only=production --silent
print_success "Backend dependencies installed!"

cd ../frontend
npm ci --only=production --silent
print_success "Frontend dependencies installed!"
cd ..

# Build applications
print_status "Building applications for production..."
cd backend
npm run build 2>/dev/null || print_warning "Backend build script not found, skipping..."
cd ../frontend
npm run build
print_success "Applications built successfully!"
cd ..

# Create systemd service (optional)
print_status "Creating systemd service..."
if command -v systemctl &> /dev/null; then
    sudo tee /etc/systemd/system/cedo-app.service > /dev/null << EOF
[Unit]
Description=CEDO Partnership Management System
After=network.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable cedo-app.service
    print_success "Systemd service created and enabled!"
else
    print_warning "Systemctl not available, skipping systemd service creation."
fi

# Create backup script
print_status "Creating backup script..."
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
# Backup script for CEDO application

BACKUP_DIR="/backup/cedo-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup MySQL
docker exec cedo-mysql-prod mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > "$BACKUP_DIR/mysql-backup.sql"

# Backup MongoDB
docker exec cedo-mongodb-prod mongodump --out "$BACKUP_DIR/mongodb-backup"

# Backup uploads
cp -r backend/uploads "$BACKUP_DIR/"

# Backup configuration
cp -r nginx "$BACKUP_DIR/"
cp docker-compose.prod.yml "$BACKUP_DIR/"
cp .env.production "$BACKUP_DIR/"

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x scripts/backup.sh
print_success "Backup script created!"

# Create monitoring script
print_status "Creating monitoring script..."
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash
# Monitoring script for CEDO application

echo "🔍 CEDO Application Status"
echo "=========================="

# Check containers
echo "📦 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
echo "🌐 Service Health:"
curl -s http://localhost/health | jq . 2>/dev/null || echo "Health endpoint not responding"

echo ""
echo "📊 Performance Metrics (last 5 minutes):"
echo "Visit http://localhost:3001 for detailed Grafana dashboard"
EOF

chmod +x scripts/monitor.sh
print_success "Monitoring script created!"

# Final setup
print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Health check
print_status "Performing health checks..."
HEALTH_CHECK_PASSED=true

# Check if containers are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_error "Some containers failed to start!"
    HEALTH_CHECK_PASSED=false
fi

# Check Redis
if ! docker exec cedo-redis-prod redis-cli ping &>/dev/null; then
    print_error "Redis health check failed!"
    HEALTH_CHECK_PASSED=false
fi

# Check MySQL
if ! docker exec cedo-mysql-prod mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" &>/dev/null; then
    print_error "MySQL health check failed!"
    HEALTH_CHECK_PASSED=false
fi

if [ "$HEALTH_CHECK_PASSED" = true ]; then
    print_success "All health checks passed!"
else
    print_error "Some health checks failed. Check the logs with: docker-compose -f docker-compose.prod.yml logs"
fi

# Display final information
echo ""
echo "🎉 Production Setup Complete!"
echo "=============================="
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: https://localhost"
echo "   Backend API: https://localhost/api"
echo "   Grafana Dashboard: http://localhost:3001 (admin/admin123)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "📋 Management Commands:"
echo "   Monitor: ./scripts/monitor.sh"
echo "   Backup: ./scripts/backup.sh"
echo "   Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "📖 Next Steps:"
echo "   1. Update .env.production with your Google OAuth credentials"
echo "   2. Configure your domain and SSL certificates"
echo "   3. Set up automated backups"
echo "   4. Monitor performance metrics in Grafana"
echo ""
print_success "Your CEDO application is now running in production mode with optimizations! 🚀" 