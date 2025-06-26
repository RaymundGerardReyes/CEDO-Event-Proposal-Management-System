#!/bin/bash

# ========================================
# CEDO Backend Docker Build Script
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
IMAGE_NAME="cedo-backend"
TAG="latest"
STAGE="production"
BUILD_VERSION="0.4.0"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Function to print colored output
print_info() {
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

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -n, --name NAME        Image name (default: cedo-backend)"
    echo "  -t, --tag TAG          Image tag (default: latest)"
    echo "  -s, --stage STAGE      Build stage (production|development|testing) (default: production)"
    echo "  -v, --version VERSION  Build version (default: 0.4.0)"
    echo "  --no-cache             Build without cache"
    echo "  --push                 Push image to registry after build"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Build production image"
    echo "  $0 -s development                     # Build development image"
    echo "  $0 -s testing -t test                 # Build testing image with 'test' tag"
    echo "  $0 --no-cache --push                  # Build and push without cache"
}

# Parse command line arguments
CACHE_OPTION=""
PUSH_IMAGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -s|--stage)
            STAGE="$2"
            shift 2
            ;;
        -v|--version)
            BUILD_VERSION="$2"
            shift 2
            ;;
        --no-cache)
            CACHE_OPTION="--no-cache"
            shift
            ;;
        --push)
            PUSH_IMAGE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate stage
if [[ ! "$STAGE" =~ ^(production|development|testing)$ ]]; then
    print_error "Invalid stage: $STAGE. Must be one of: production, development, testing"
    exit 1
fi

# Build the Docker image
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

print_info "Building Docker image..."
print_info "Image: $FULL_IMAGE_NAME"
print_info "Stage: $STAGE"
print_info "Version: $BUILD_VERSION"
print_info "Build Date: $BUILD_DATE"
print_info "Git Commit: $GIT_COMMIT"

# Build command
BUILD_CMD="docker build $CACHE_OPTION \
    --target $STAGE \
    --build-arg BUILD_VERSION=$BUILD_VERSION \
    --build-arg BUILD_DATE=$BUILD_DATE \
    --build-arg GIT_COMMIT=$GIT_COMMIT \
    -t $FULL_IMAGE_NAME \
    ."

print_info "Executing: $BUILD_CMD"

if eval $BUILD_CMD; then
    print_success "Docker image built successfully: $FULL_IMAGE_NAME"
    
    # Show image info
    print_info "Image details:"
    docker images $IMAGE_NAME:$TAG --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    if [ "$PUSH_IMAGE" = true ]; then
        print_info "Pushing image to registry..."
        if docker push $FULL_IMAGE_NAME; then
            print_success "Image pushed successfully: $FULL_IMAGE_NAME"
        else
            print_error "Failed to push image"
            exit 1
        fi
    fi
    
    print_success "Build completed successfully!"
    
    # Show usage examples
    echo ""
    print_info "Run the container with:"
    echo "  docker run -d -p 5000:5000 --name cedo-backend $FULL_IMAGE_NAME"
    echo ""
    print_info "Or use with docker-compose:"
    echo "  Update your docker-compose.yml to use: $FULL_IMAGE_NAME"
    
else
    print_error "Docker build failed!"
    exit 1
fi 