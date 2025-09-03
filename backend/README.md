# Executive Meeting Brief Generator - Backend

A Node.js/Express/TypeScript backend service for generating executive meeting briefs using AI, Slack data, HubSpot CRM, and web research.

## Features

- **Internal Meeting Briefs**: Analyze Slack conversations to generate strategic meeting briefs
- **Business Development Intelligence**: Research attendees and companies for external meetings
- **HubSpot Integration**: Enrich attendee data and manage contacts
- **Web Research**: Automated LinkedIn discovery and competitive analysis
- **AI-Powered Reports**: Generate comprehensive intelligence reports using OpenAI

## Setup

1. Copy `.env.example` to `.env` and configure your API keys:
```bash
cp ../.env.example .env
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### Channels
- `GET /api/channels` - List available Slack channels
- `GET /api/channels/:channelId/messages` - Get channel messages

### Meetings
- `POST /api/run` - Generate internal meeting brief

### Business Development
- `POST /api/bd/research-attendees` - Research meeting attendees
- `POST /api/bd/generate` - Generate BD intelligence report
- `POST /api/bd/add-to-hubspot` - Add contacts to HubSpot

### Debug
- `GET /api/usage-logs` - View usage analytics
- `GET /api/debug/hubspot/:contactId` - Inspect HubSpot contact
- `GET /api/debug/openai-test` - Test OpenAI connection
- `POST /api/debug/prompt-preview` - Preview AI prompts

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

## Architecture

The backend follows a clean architecture pattern:
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and external integrations
- **Middleware**: Error handling, logging, rate limiting
- **Types**: TypeScript interfaces and types
- **Config**: Environment variables and constants