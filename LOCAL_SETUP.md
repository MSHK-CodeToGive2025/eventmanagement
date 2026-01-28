# Local Development Setup Guide

This guide will help you run both the backend and frontend locally on your machine.

## Prerequisites

### 1. Install Node.js
- Download and install Node.js (v14 or higher) from [nodejs.org](https://nodejs.org/)
- After installation, restart your terminal/PowerShell
- Verify installation by running:
  ```powershell
  node --version
  npm --version
  ```

### 2. Install MongoDB

You have two options:

#### Option A: Install MongoDB Locally
- Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
- Install and start MongoDB service
- MongoDB will run on `mongodb://localhost:27017` by default

#### Option B: Use Docker (Recommended)
If you have Docker installed, you can use the provided `docker-compose.yml`:
```powershell
cd backend
docker-compose up -d mongodb
```
This will start MongoDB in a container on port 27017.

## Setup Steps

### Step 1: Environment Files
✅ **Already created!** The `.env` files have been created for you:
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

### Step 2: Install Backend Dependencies
```powershell
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
```powershell
cd frontend
npm install
```

### Step 4: Start MongoDB
If using Docker:
```powershell
cd backend
docker-compose up -d mongodb
```

If MongoDB is installed locally, make sure the MongoDB service is running.

### Step 5: Start the Backend Server
Open a **new terminal window** and run:
```powershell
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### Step 6: Start the Frontend Server
Open **another terminal window** and run:
```powershell
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## Accessing the Application

- **Frontend**: Open your browser and go to `http://localhost:3000`
- **Backend API**: Available at `http://localhost:3001/api`
- **Health Check**: `http://localhost:3001/api/health`

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running
- Check that the connection string in `backend/.env` is correct: `mongodb://localhost:27017/zubin-foundation`
- If using Docker, verify the container is running: `docker ps`

### Port Already in Use
- Backend uses port 3001 - if it's in use, change `PORT` in `backend/.env`
- Frontend uses port 3000 - if it's in use, Vite will automatically try the next available port

### CORS Errors
- Make sure `CORS_ORIGIN` in `backend/.env` matches your frontend URL (default: `http://localhost:3000`)

## Quick Start Commands Summary

```powershell
# Terminal 1: Start MongoDB (if using Docker)
cd backend
docker-compose up -d mongodb

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

## Development Scripts

### Backend
- `npm run dev` - Start development server with nodemon (auto-restart on changes)
- `npm start` - Start production server
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests



