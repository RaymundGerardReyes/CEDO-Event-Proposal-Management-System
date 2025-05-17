@echo off
echo Setting up development environment...

REM Create .env file if it doesn't exist
if not exist .env (
  copy .env.dev .env
  echo Created .env file from .env.dev template
) else (
  echo .env file already exists
)

REM Build and start the containers
echo Building and starting containers...
docker-compose -f docker-compose.dev.yml up --build -d

echo Development environment is now running!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000/api
