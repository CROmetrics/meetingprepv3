# Executive Meeting Brief Generator - Architecture Documentation

## Overview
The Executive Meeting Brief Generator is a sophisticated application designed for CroMetrics to prepare comprehensive meeting briefs for both internal and external (business development) meetings. The application leverages AI, CRM data, and web research to generate strategic intelligence reports.

## Application Modes

### 1. Internal Meeting Mode
Generates briefs for internal meetings by analyzing Slack conversations and enriching with HubSpot CRM data.

**Key Features:**
- Slack channel analysis with thread expansion
- User name resolution from Slack IDs
- HubSpot contact enrichment
- AI-powered brief generation with strategic recommendations

### 2. Business Development (BD) Mode
Performs comprehensive external research to prepare for BD meetings with potential clients.

**Key Features:**
- Multi-phase research workflow
- LinkedIn profile discovery
- Company and competitive landscape analysis
- Attendee background research
- HubSpot CRM integration for contact management
- AI-powered intelligence report generation with tool calling

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Internal   │  │     BD       │  │   Report     │  │
│  │   Meeting   │  │   Meeting    │  │   Viewer     │  │
│  │    Form     │  │    Form      │  │              │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────┐
│                 Backend (Express/Node.js)                │
│  ┌───────────────────────────────────────────────────┐  │
│  │              API Layer (Controllers)              │  │
│  │  /api/channels  /api/run  /api/bd/*  /api/debug/* │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Service Layer                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │  │
│  │  │  Slack   │ │ HubSpot  │ │  OpenAI  │         │  │
│  │  │ Service  │ │ Service  │ │ Service  │         │  │
│  │  └──────────┘ └──────────┘ └──────────┘         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │  │
│  │  │ Research │ │Analytics │ │  Usage   │         │  │
│  │  │ Service  │ │ Service  │ │ Logger   │         │  │
│  │  └──────────┘ └──────────┘ └──────────┘         │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                  External Services                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Slack   │ │ HubSpot  │ │  OpenAI  │ │  Serper  │  │
│  │   API    │ │   API    │ │   API    │ │   API    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

### Internal Meeting Brief Generation

1. **Channel Selection**
   - User selects Slack channel from filtered list (bd-* or internal-*)
   - Optional: Specify meeting attendees and purpose

2. **Data Collection**
   - Fetch recent Slack messages (configurable lookback period)
   - Expand thread replies for context
   - Resolve user names from Slack IDs

3. **Enrichment**
   - Look up attendees in HubSpot CRM
   - Fetch LinkedIn URLs and additional context

4. **AI Processing**
   - Generate meeting brief using OpenAI o3-pro model
   - Apply two-pass critique system for refinement
   - Structure output with strategic recommendations

### BD Meeting Intelligence Generation

1. **Phase 1: Attendee Research**
   - Parse attendee list (name, email, title, company)
   - Search for LinkedIn profiles
   - Look up existing HubSpot contacts
   - Perform background research on each attendee

2. **Phase 2: Company Research**
   - Company overview and business model
   - Recent news and financial information
   - Digital transformation initiatives
   - Competitive landscape analysis

3. **Phase 3: Report Generation**
   - AI processes all research data
   - Uses tool calling for additional research
   - Generates comprehensive intelligence report
   - Maps opportunities to CroMetrics services

4. **Phase 4: CRM Integration (Optional)**
   - Add new contacts to HubSpot
   - Update existing contact records
   - Store LinkedIn URLs in custom fields

## API Endpoints

### Internal Meeting APIs

| Endpoint | Method | Description |
|----------|---------|------------|
| `/api/channels` | GET | List available Slack channels |
| `/api/run` | POST | Generate internal meeting brief |

### BD Meeting APIs

| Endpoint | Method | Description |
|----------|---------|------------|
| `/api/bd/research-attendees` | POST | Research meeting attendees |
| `/api/bd/generate` | POST | Generate BD intelligence report |
| `/api/bd/add-to-hubspot` | POST | Add contacts to HubSpot CRM |

### Debug/Utility APIs

| Endpoint | Method | Description |
|----------|---------|------------|
| `/api/usage-logs` | GET | View usage analytics |
| `/api/debug/hubspot/{id}` | GET | Inspect HubSpot contact |
| `/api/debug/responses-api-test` | GET | Test OpenAI integration |
| `/api/debug/prompt-preview` | POST | Preview AI prompts |

## Data Models

### Meeting Brief Request
```typescript
interface MeetingBriefRequest {
  channelId: string;
  lookbackDays?: number;
  maxMessages?: number;
  attendees?: string[];
  purpose?: string;
  accountContext?: string;
}
```

### BD Meeting Request
```typescript
interface BDMeetingRequest {
  company: string;
  attendees: Attendee[];
  purpose?: string;
  additionalContext?: string;
}

interface Attendee {
  name: string;
  email?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
}
```

### Research Result
```typescript
interface ResearchResult {
  attendeeResearch: AttendeeResearch[];
  companyResearch: CompanyResearch;
  competitiveLandscape: CompetitiveAnalysis;
  sources: string[];
}
```

### Intelligence Report
```typescript
interface IntelligenceReport {
  executiveSummary: string;
  targetCompanyIntelligence: string;
  meetingAttendeeAnalysis: string;
  competitiveLandscapeAnalysis: string;
  strategicOpportunityAssessment: string;
  meetingDynamicsStrategy: string;
  keyQuestions: string[];
  potentialObjectionsResponses: string;
  followUpActionPlan: string;
  researchValidationNeeded: string[];
  sources: string[];
  confidence: number;
}
```

## External Service Integrations

### Slack Integration
- **Authentication**: Bearer token (User or Bot token)
- **Rate Limiting**: Automatic retry with exponential backoff
- **Key Methods**:
  - `conversations.list` - List channels
  - `conversations.history` - Fetch messages
  - `conversations.replies` - Fetch thread replies
  - `users.info` - Resolve user names

### HubSpot Integration
- **Authentication**: Private App token
- **Rate Limiting**: Built-in retry logic
- **Key Operations**:
  - Contact search by email/name
  - Contact creation with duplicate prevention
  - Custom field management (linkedin_url)

### OpenAI Integration
- **Model**: o3-pro (Responses API)
- **Features**:
  - Tool calling for dynamic research
  - Two-pass critique system
  - Structured JSON output
  - Fallback to chat completions API

### Serper Integration
- **Purpose**: Google search for web research
- **Features**:
  - Configurable result count
  - Title, snippet, and link extraction

## Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...
SLACK_TOKEN=xoxb-... or xoxp-...
HUBSPOT_TOKEN=pat-...
SERPER_API_KEY=...

# Optional
OPENAI_MODEL=o3-pro
STRUCTURED_OUTPUT=0|1
SELF_CRITIQUE=0|1
LOGS_DIR=/path/to/logs
PORT=3001
```

### Feature Flags
- **STRUCTURED_OUTPUT**: Enable JSON schema validation for AI responses
- **SELF_CRITIQUE**: Enable two-pass refinement system

## Security Considerations

1. **API Key Management**
   - All sensitive keys in environment variables
   - No hardcoded credentials

2. **Input Validation**
   - Sanitize user inputs
   - Validate email formats
   - Limit request sizes

3. **Rate Limiting**
   - Implement per-IP rate limiting
   - Respect external API limits

4. **Data Privacy**
   - No persistent storage of sensitive data
   - Usage logs anonymized
   - CORS configuration for production

## Performance Optimizations

1. **Caching**
   - In-memory cache for Slack user names
   - Request deduplication for HubSpot lookups

2. **Concurrent Operations**
   - Parallel API calls where possible
   - Async/await throughout

3. **Pagination**
   - Limit message fetching
   - Incremental data loading

4. **Content Truncation**
   - Limit scraped content to 5KB
   - Message count limits

## Deployment Considerations

1. **Infrastructure Requirements**
   - Node.js 18+ runtime
   - 2GB+ RAM recommended
   - Persistent storage for logs

2. **Monitoring**
   - Usage analytics dashboard
   - Error tracking
   - API health checks

3. **Scaling**
   - Stateless design for horizontal scaling
   - External service rate limits as bottleneck
   - Consider caching layer for production

## TypeScript Migration Strategy

### Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts          # Zod-validated environment
│   │   └── constants.ts    # Application constants
│   ├── controllers/
│   │   ├── channels.controller.ts
│   │   ├── meeting.controller.ts
│   │   ├── bd.controller.ts
│   │   └── debug.controller.ts
│   ├── services/
│   │   ├── slack.service.ts
│   │   ├── hubspot.service.ts
│   │   ├── openai.service.ts
│   │   ├── research.service.ts
│   │   └── analytics.service.ts
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   ├── logging.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── types/
│   │   ├── meeting.types.ts
│   │   ├── bd.types.ts
│   │   └── api.types.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── helpers.ts
│   └── index.ts
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   │   ├── MeetingBriefForm.tsx
│   │   │   └── BDMeetingForm.tsx
│   │   ├── display/
│   │   │   ├── ReportViewer.tsx
│   │   │   └── AttendeeCard.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── useApi.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── api.service.ts
│   │   └── storage.service.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── formatters.ts
│   └── App.tsx
```

## Testing Strategy

### Unit Tests
- Service layer methods
- Utility functions
- React component logic

### Integration Tests
- API endpoint responses
- External service mocking
- Error handling paths

### E2E Tests
- Complete meeting brief generation
- BD research workflow
- HubSpot integration flow

## Conclusion

This architecture provides a robust, scalable foundation for the Executive Meeting Brief Generator. The TypeScript migration will enhance type safety, maintainability, and developer experience while preserving all existing functionality and business logic from the Python implementation.