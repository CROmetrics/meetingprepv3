# CroMetrics Executive Meeting Brief Generator

A comprehensive TypeScript application for generating executive meeting briefs using AI, Slack data, HubSpot CRM, and web research. Successfully refactored from Python to TypeScript with improved type safety, modularity, and maintainability.

## 🚀 Features

### Internal Meeting Briefs

- Analyze Slack conversations with thread expansion
- Enrich attendee data from HubSpot CRM
- Generate strategic meeting briefs with AI
- Customizable lookback periods and message limits

### Business Development Intelligence

- Multi-phase attendee research workflow
- LinkedIn profile discovery
- Company and competitive landscape analysis
- HubSpot CRM integration for contact management
- Comprehensive intelligence reports with source citations

### Technical Highlights

- **Full TypeScript** with strict mode for type safety
- **React** frontend with Tailwind CSS
- **Express** backend with clean architecture
- **OpenAI GPT-4** for report generation
- **Rate limiting** and security middleware
- **Usage analytics** and logging

## 📁 Project Structure

```
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Environment and constants
│   │   ├── controllers/    # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utilities
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript types
│   └── package.json
├── .claude/
│   └── docs/              # Architecture documentation
└── .env.example           # Environment template
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- API Keys: OpenAI, Slack, HubSpot (optional), Serper (optional)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd weeee
```

2. **Install dependencies**

```bash
npm run install:all
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Start development servers**

```bash
npm run dev
```

This starts:

- Backend on http://localhost:3001
- Frontend on http://localhost:5173

## 🔑 Environment Variables

Required:

- `OPENAI_API_KEY` - OpenAI API key for GPT-4
- `SLACK_TOKEN` - Slack user or bot token

Optional:

- `HUBSPOT_TOKEN` - HubSpot private app token
- `SERPER_API_KEY` - Serper API key for web search
- `PORT` - Backend port (default: 3001)
- `OPENAI_MODEL` - AI model (default: gpt-4-turbo-preview)

See `.env.example` for all configuration options.

## 📚 API Documentation

### Internal Meeting Endpoints

- `GET /api/channels` - List Slack channels
- `POST /api/run` - Generate meeting brief

### BD Meeting Endpoints

- `POST /api/bd/research-attendees` - Research attendees
- `POST /api/bd/generate` - Generate intelligence report
- `POST /api/bd/add-to-hubspot` - Add contacts to CRM

### Debug Endpoints

- `GET /api/usage-logs` - View usage analytics
- `GET /api/debug/openai-test` - Test OpenAI connection

## 🏗️ Architecture

### Backend Services

- **SlackService** - Channel and message operations
- **HubSpotService** - CRM contact management
- **OpenAIService** - AI report generation with tool calling
- **ResearchService** - Web search and scraping

### Frontend Components

- **MeetingBriefForm** - Internal meeting configuration
- **BDMeetingForm** - BD meeting setup
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Responsive styling

## 🔄 Migration from Python

Successfully migrated from FastAPI/Python to Express/TypeScript with:

- **100% feature parity** - All original functionality preserved
- **Improved type safety** - Full TypeScript with Zod validation
- **Better architecture** - Clean separation of concerns
- **Enhanced error handling** - Custom error classes and middleware
- **Modern tooling** - Vite, React Query, Tailwind CSS

## 📊 Usage Analytics

The application tracks usage metrics for analysis:

- API endpoint usage
- Report generation statistics
- Error tracking
- Performance metrics

View logs at `/api/usage-logs` or in `logs/usage.log`

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Type checking
npm run type-check
```

## 📦 Building for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
cd backend && npm start
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Maintain type safety (no `any` types)
3. Write self-documenting code
4. Test thoroughly before committing
5. Follow the style guide in `.claude/docs/`

## 📄 License

Private - CroMetrics Internal Use Only

## 🙏 Acknowledgments

- Original Python implementation by CroMetrics team
- Refactored to TypeScript following CroMetrics development guidelines
- Built with modern web technologies and best practices# Trigger Railway deployment - Thu Sep 4 09:17:44 MDT 2025
