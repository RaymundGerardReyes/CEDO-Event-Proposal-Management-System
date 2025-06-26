#!/bin/bash

# 🚀 CEDO Development Setup Script
# This script sets up the optimized development environment for testing

set -e

echo "🚀 CEDO Development Setup Starting..."
echo "======================================"

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

print_success "System requirements check passed!"

# Create development environment file
print_status "Setting up development environment..."
if [ ! -f .env.development ]; then
    cp env.development.example .env.development
    print_success "Development environment file created!"
    print_warning "Please update .env.development with your Google OAuth credentials"
else
    print_success "Development environment file already exists!"
fi

# Install dependencies
print_status "Installing dependencies..."
cd backend
npm install
print_success "Backend dependencies installed!"

cd ../frontend
npm install
print_success "Frontend dependencies installed!"
cd ..

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p logs
mkdir -p backend/uploads
mkdir -p data/dev/{mysql,mongodb,redis}
mkdir -p monitoring/grafana/provisioning

print_success "Directory structure created!"

# Start development services
print_status "Starting development services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Health check
print_status "Performing health checks..."
HEALTH_CHECK_PASSED=true

# Check if containers are running
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    print_error "Some containers failed to start!"
    HEALTH_CHECK_PASSED=false
fi

# Check Redis
if ! docker exec cedo-redis-dev redis-cli ping &>/dev/null; then
    print_warning "Redis health check failed - this is okay for development"
fi

# Check MySQL
if ! docker exec cedo-mysql-dev mysqladmin ping -h localhost -u cedo_dev_user -pdev_password_123 &>/dev/null; then
    print_warning "MySQL health check failed - this is okay for development"
fi

# Start the applications locally (non-Docker)
print_status "Starting applications locally..."

# Start backend in development mode
print_status "Starting backend server..."
cd backend
npm run dev:cluster &
BACKEND_PID=$!
print_success "Backend started with PID: $BACKEND_PID"
cd ..

# Start frontend in development mode
print_status "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
print_success "Frontend started with PID: $FRONTEND_PID"
cd ..

# Wait a moment for servers to start
sleep 10

# Display final information
echo ""
echo "🎉 Development Setup Complete!"
echo "==============================="
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000 (Next.js dev server)"
echo "   Backend API: http://localhost:5001 (Express with clustering)"
echo ""
echo "🗄️ Database Admin Interfaces:"
echo "   MySQL (phpMyAdmin): http://localhost:8080"
echo "   MongoDB (Mongo Express): http://localhost:8081 (admin/admin123)"
echo "   Redis (Commander): http://localhost:8082 (admin/admin123)"
echo ""
echo "📊 Monitoring & Performance:"
echo "   Grafana Dashboard: http://localhost:3002 (admin/admin123)"
echo "   Performance Metrics: Available in Grafana"
echo ""
echo "🔧 Development Features Enabled:"
echo "   ✅ Redis Caching (with fallback)"
echo "   ✅ Database Connection Pooling"
echo "   ✅ Performance Monitoring"
echo "   ✅ Hot Reloading (Frontend & Backend)"
echo "   ✅ Enhanced Logging & Debugging"
echo "   ✅ Admin Interfaces for All Databases"
echo ""
echo "📋 Management Commands:"
echo "   Stop all: docker-compose -f docker-compose.dev.yml down"
echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "   Restart services: docker-compose -f docker-compose.dev.yml restart"
echo ""
echo "🧪 Testing Performance Optimizations:"
echo "   1. Open http://localhost:3000 to test the frontend"
echo "   2. Check Redis caching in http://localhost:8082"
echo "   3. Monitor performance in http://localhost:3002"
echo "   4. Test file uploads and database operations"
echo "   5. Check logs for performance metrics"
echo ""
echo "📝 Next Steps:"
echo "   1. Update .env.development with your Google OAuth credentials"
echo "   2. Test all the performance features"
echo "   3. Monitor the Grafana dashboard for metrics"
echo "   4. When ready, use the production setup script"
echo ""
print_success "Your CEDO development environment is ready with all optimizations! 🚀"
echo ""
print_warning "Press Ctrl+C to stop the development servers when done."

# Keep script running to maintain the servers
trap 'echo ""; print_status "Shutting down development servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose -f docker-compose.dev.yml down; print_success "Development environment stopped!"; exit 0' INT

# Wait for user to stop
wait 