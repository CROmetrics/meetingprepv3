# Deployment Guide - Meeting Prepper V3

## Railway Deployment

This application is configured for automatic deployment on Railway Platform.

### Prerequisites

- Railway account with project configured
- GitHub repository connected to Railway
- Required environment variables set

### Environment Variables

Set these in Railway Project Settings > Variables:

```bash
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-key
SLACK_TOKEN=xoxp-your-slack-token
HUBSPOT_TOKEN=your-hubspot-token (optional)
SERPER_API_KEY=your-serper-key (optional)
FRONTEND_URL=https://your-railway-domain.railway.app
```

### Deployment Configuration

#### railway.json

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run install:all && npm run build"
  },
  "deploy": {
    "startCommand": "NODE_ENV=production npm run start:production",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

#### nixpacks.toml

```toml
[phases.setup]
nixPkgs = ["nodejs_20", "npm-10_x"]

[phases.install]
cmds = [
  "npm install",
  "npm run install:all"
]

[phases.build]
cmds = [
  "npm run build"
]

[start]
cmd = "NODE_ENV=production npm run start:production"
```

### Deployment Process

1. **Automatic Deployment**:
   - Push changes to `main` branch
   - Railway automatically detects changes and builds

2. **Build Steps**:
   - Install root dependencies
   - Install backend and frontend dependencies
   - Build frontend (React → static files)
   - Build backend (TypeScript → JavaScript)

3. **Deployment**:
   - Start production server with `npm run start:production`
   - Serve frontend static files from backend
   - Health check at `/health` endpoint

### Verification

After deployment, verify:

1. **Health Check**: Visit `https://your-domain.railway.app/health`
2. **Frontend**: Main application should load
3. **API**: Backend endpoints should respond
4. **BD Functionality**: Test BD prep tab navigation and functionality

### Troubleshooting

#### Build Failures

- Check Railway build logs for compilation errors
- Ensure all TypeScript files compile: `npm run type-check`
- Verify dependencies are properly installed

#### Runtime Errors

- Check Railway deploy logs
- Verify environment variables are set correctly
- Ensure health check endpoint responds

#### Missing Features

- Verify frontend build files exist in `frontend/dist/`
- Check that backend serves static files correctly
- Test API endpoints individually

### Manual Deployment

For local testing of production build:

```bash
# Build application
npm run build

# Set environment variables
export NODE_ENV=production
export OPENAI_API_KEY=your-key
# ... other required vars

# Start production server
npm run start:production
```

### Deployment Commands

```bash
# Trigger Railway deployment
git add .
git commit -m "trigger: force Railway deployment"
git push origin main

# Check deployment status
# Visit Railway dashboard or check logs
```

## Production Checklist

Before deployment:

- [ ] All TypeScript compiles without errors
- [ ] Frontend builds successfully
- [ ] Backend builds successfully
- [ ] Environment variables configured
- [ ] Health check endpoint works
- [ ] API endpoints tested
- [ ] BD functionality tested
- [ ] Navigation between tabs works

After deployment:

- [ ] Application loads at Railway URL
- [ ] Health check responds
- [ ] Meeting Brief functionality works
- [ ] BD Prep functionality works
- [ ] Tab switching works properly
- [ ] All API endpoints respond correctly
