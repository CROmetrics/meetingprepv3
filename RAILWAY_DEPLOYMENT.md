# Railway Deployment Guide

This guide provides step-by-step instructions for deploying the Meeting Brief Generator to Railway.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Railway CLI installed (optional but recommended)
3. GitHub repository connected to Railway

## Deployment Steps

### 1. Create a New Project on Railway

1. Log in to Railway Dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select this repository

### 2. Configure Environment Variables

In your Railway project settings, add the following environment variables:

#### Required Variables
```
NODE_ENV=production
PORT=${{PORT}}  # Railway will auto-assign this
OPENAI_API_KEY=your_openai_api_key_here
```

#### Optional Variables (for full functionality)
```
# Slack Integration
SLACK_TOKEN=xoxb-your-slack-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# HubSpot Integration
HUBSPOT_TOKEN=your_hubspot_api_token

# Web Search (Serper API)
SERPER_API_KEY=your_serper_api_key

# AI Configuration
OPENAI_MODEL=gpt-4-turbo-preview
STRUCTURED_OUTPUT=false
SELF_CRITIQUE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Deploy Settings

Railway will automatically detect the configuration from `railway.json`:

- **Build Command**: `npm run install:all && npm run build`
- **Start Command**: `npm run start:production`

### 4. Domain Setup

1. Go to your Railway project settings
2. Under "Networking", generate a domain or add a custom domain
3. Update the `FRONTEND_URL` environment variable with your domain

### 5. Manual Deployment (if needed)

If automatic deployment doesn't work, you can manually configure:

1. Set the build command: 
   ```bash
   npm run install:all && npm run build
   ```

2. Set the start command:
   ```bash
   npm run start:production
   ```

3. Ensure the PORT environment variable is set to `${{PORT}}`

## Project Structure

The application consists of:
- **Frontend**: React + Vite application (built to `/frontend/dist`)
- **Backend**: Express + TypeScript API server
- **Single Port**: Both frontend and API served from the same port in production

## Build Process

1. Installs dependencies for root, backend, and frontend
2. Builds the frontend (creates static files in `/frontend/dist`)
3. Builds the backend (compiles TypeScript to `/backend/dist`)
4. Serves both frontend and API from the Express server

## Troubleshooting

### Build Failures

1. Check that all environment variables are set correctly
2. Ensure Node.js version compatibility (requires Node.js 18+)
3. Check build logs in Railway dashboard

### Runtime Issues

1. Verify the PORT environment variable is set to `${{PORT}}`
2. Check that OPENAI_API_KEY is valid
3. Review application logs in Railway dashboard

### Frontend Not Loading

1. Ensure the build completed successfully
2. Check that the frontend build output exists in `/frontend/dist`
3. Verify the Express server is serving static files correctly

## Environment Variables Reference

See `.env.railway` for a complete template of all environment variables.

## Monitoring

1. Use Railway's logging dashboard to monitor application logs
2. Set up error tracking (optional) with services like Sentry
3. Monitor API usage through OpenAI dashboard

## Scaling

Railway automatically handles:
- SSL certificates
- Load balancing (with multiple instances)
- Auto-scaling (based on your plan)
- Zero-downtime deployments

## Support

For issues specific to:
- **Railway deployment**: Check Railway documentation or Discord
- **Application bugs**: Create an issue in the GitHub repository
- **API keys**: Refer to respective service documentation (OpenAI, Slack, HubSpot)

## Quick Deploy Button

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=YOUR_TEMPLATE_URL)