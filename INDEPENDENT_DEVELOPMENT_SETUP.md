# Independent Frontend & Backend Development Setup

## Overview
This guide explains how to run your CEDO Google Auth application with independent frontend and backend services, using the updated VS Code debugging configuration.

## Prerequisites
- Node.js >= 18.20.8
- npm >= 10.9.3
- VS Code with Debugger for Chrome extension
- PostgreSQL database (for backend)

## Quick Start

### 1. Independent Backend Development
```bash
# Start backend only
npm run dev:backend-only

# Or debug backend only
# Use VS Code: "Debug Backend Only" configuration
```

### 2. Independent Frontend Development
```bash
# Start frontend only
npm run dev:frontend-only

# Or debug frontend only
# Use VS Code: "Start Frontend Only" then "Debug Frontend Only"
```

### 3. Full Stack Development
```bash
# Start both services
npm run dev

# Or debug both
# Use VS Code: "Debug Full Stack (Independent)" configuration
```

## VS Code Debugging Configurations

### Available Configurations:

1. **Debug Backend Only**
   - Runs backend server with debugging enabled
   - Port: 5000
   - Debug port: 9229

2. **Debug Backend (Wait)**
   - Waits for debugger to attach before starting
   - Useful for debugging startup code

3. **Start Frontend Only**
   - Starts Next.js development server
   - Port: 3000
   - Prevents browser auto-open

4. **Debug Frontend Only**
   - Attaches Chrome debugger to running frontend
   - Requires frontend to be running first

5. **Debug Frontend (Production)**
   - Debugs production build of frontend

### Compound Configurations:

1. **Debug Full Stack (Independent)**
   - Starts backend, frontend, and attaches debugger
   - Best for full-stack debugging

2. **Debug Backend + Frontend (Sequential)**
   - Starts both services without debugger attachment

3. **Start Both Services**
   - Simple startup for both services

## Development Workflow

### Option 1: Independent Development
1. Start backend: `npm run dev:backend-only`
2. Start frontend: `npm run dev:frontend-only`
3. Debug as needed using VS Code configurations

### Option 2: VS Code Debugging
1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select desired configuration:
   - "Debug Backend Only" for backend debugging
   - "Start Frontend Only" + "Debug Frontend Only" for frontend debugging
   - "Debug Full Stack (Independent)" for both

### Option 3: Docker Independent Deployment
```bash
# Start independent services with Docker
docker-compose -f docker-compose.independent.yml up

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

## API Proxy Configuration

The frontend is configured with API proxy to communicate with the backend:

- `/api/*` → `http://localhost:5000/api/*`
- `/auth/*` → `http://localhost:5000/auth/*`
- `/uploads/*` → `http://localhost:5000/uploads/*`

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=cedo_auth
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
CORS_ORIGIN=http://localhost:3000
```

### Frontend (next.config.js)
```javascript
BACKEND_URL=http://localhost:5000
API_URL=http://localhost:5000/api
```

## Troubleshooting

### Frontend Debug Issues
1. Ensure frontend is running on port 3000
2. Check that Chrome debugger extension is installed
3. Verify source maps are enabled
4. Try "Start Frontend Only" first, then "Debug Frontend Only"

### Backend Debug Issues
1. Ensure backend is running on port 5000
2. Check database connection
3. Verify environment variables are set
4. Check console for error messages

### API Connection Issues
1. Verify backend is running
2. Check CORS configuration
3. Verify API proxy settings in next.config.js
4. Check network tab in browser dev tools

## Port Configuration
- Backend: 5000 (configurable via PORT env var)
- Frontend: 3000 (configurable via NEXT_PUBLIC_PORT env var)
- Database: 5432 (PostgreSQL)

## Development Commands

### Root Level Commands
```bash
npm run dev                    # Start both services
npm run dev:frontend-only       # Start frontend only
npm run dev:backend-only        # Start backend only
npm run debug:backend-only      # Debug backend only
npm run debug:frontend-only     # Debug frontend only
```

### Backend Commands
```bash
cd backend
npm run dev                    # Start backend
npm run start                  # Start production backend
npm run test                   # Run backend tests
npm run health                 # Check backend health
```

### Frontend Commands
```bash
cd frontend
npm run dev                    # Start frontend
npm run start                  # Start production frontend
npm run test                   # Run frontend tests
npm run build                  # Build for production
```

## Production Deployment

### Independent Docker Deployment
```bash
# Build and run independent services
docker-compose -f docker-compose.independent.yml up -d

# Check service status
docker-compose -f docker-compose.independent.yml ps

# View logs
docker-compose -f docker-compose.independent.yml logs -f
```

This setup allows you to develop, debug, and deploy your frontend and backend independently while maintaining proper communication between them.


