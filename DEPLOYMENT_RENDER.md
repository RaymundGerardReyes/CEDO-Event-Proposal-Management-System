# Deploying to Render (Free Tier)

## Prerequisites
- Project pushed to GitHub.
- External DBs ready (recommended):
  - MongoDB Atlas URI
  - MySQL provider (PlanetScale/Railway) or existing MySQL
- Confirm backend listens on `process.env.PORT`.

## 1) Blueprint Deploy
- The repo contains `render.yaml` defining two services:
  - `cedo-backend` (Node/Express Web Service)
  - `cedo-frontend` (Next.js Web Service)

### Steps
1. Go to https://render.com → New + → Blueprint.
2. Connect your GitHub repo.
3. Render will read `render.yaml` and create both services.
4. Click Create Resources.

## 2) Set Environment Variables
After resources are created, open each service → Environment → Add the following.

### Backend (cedo-backend)
- NODE_ENV=production
- MONGODB_URI=your MongoDB Atlas URI
- MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (if used)
- JWT_SECRET=your secret
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- ALLOWED_ORIGINS=https://<your-frontend>.onrender.com

### Frontend (cedo-frontend)
- NODE_ENV=production
- NEXT_PUBLIC_API_BASE_URL=https://<your-backend>.onrender.com

## 3) Build & Start Commands
- Backend Build: `cd backend && npm install`
- Backend Start: `cd backend && npm run start`
- Frontend Build: `cd frontend && npm install && npm run build`
- Frontend Start: `cd frontend && npm run start`

## 4) Health Check & Verification
- Backend health: visit `https://<backend>.onrender.com/health`
- Frontend: visit `https://<frontend>.onrender.com`
- Test sign-in and API requests.

## 5) CORS & Cookies
- Ensure backend CORS allows your frontend Render URL via `ALLOWED_ORIGINS`.
- For cookies/sessions, use `secure=true` and appropriate `sameSite` in production.

## 6) Google OAuth
- Authorized redirect URI: `https://<backend>.onrender.com/api/auth/google/callback` (or your route)
- Authorized JS origins: `https://<frontend>.onrender.com`

## 7) Auto Deploy
- With `autoDeploy: true` in `render.yaml`, pushes to your default branch redeploy services automatically.

## Troubleshooting
- Port: Backend must listen on `process.env.PORT`.
- CORS: 4xx from browser? Verify `ALLOWED_ORIGINS` matches exact frontend URL.
- NEXT_PUBLIC envs: Client-side vars must be prefixed `NEXT_PUBLIC_`.
- OAuth: Redirect URIs must match exactly.

## Optional: Using Render Postgres
- Your app uses MongoDB/MySQL. Migrating to Render Postgres requires code changes/migrations and is not covered here.
