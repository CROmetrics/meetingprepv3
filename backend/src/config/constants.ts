export const CONSTANTS = {
  // API Base URLs
  SLACK_API_BASE: 'https://slack.com/api',
  HUBSPOT_API_BASE: 'https://api.hubapi.com',
  SERPER_API_BASE: 'https://google.serper.dev',
  GOOGLE_CALENDAR_API_BASE: 'https://www.googleapis.com/calendar/v3',
  GOOGLE_OAUTH_BASE: 'https://oauth2.googleapis.com',
  PEOPLEDATALABS_API_BASE: 'https://api.peopledatalabs.com/v5',

  // Current year for research queries
  CURRENT_YEAR: new Date().getFullYear(),

  // Slack Configuration
  SLACK: {
    MAX_MESSAGES: 300,
    DEFAULT_LOOKBACK_DAYS: 14,
    MAX_THREAD_EXPANSIONS: 20,
    CHANNEL_TYPES: 'public_channel,private_channel',
    CHANNEL_FILTER_PREFIXES: [],  // Empty array to show all channels
  },

  // HubSpot Configuration
  HUBSPOT: {
    CONTACT_PROPERTIES: [
      'email',
      'firstname',
      'lastname',
      'jobtitle',
      'company',
      'lifecyclestage',
      'linkedin_url',
      'hs_object_id',
    ],
    COMPANY_PROPERTIES: [
      'name',
      'domain',
      'industry',
      'city',
      'state',
      'country',
      'numberofemployees',
      'annualrevenue',
      'linkedincompanypage',
    ],
  },

  // Google Calendar Configuration
  GOOGLE_CALENDAR: {
    SCOPES: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly'
    ],
    MAX_EVENTS: 50,
    DEFAULT_LOOKBACK_DAYS: 0, // Only future events
    DEFAULT_LOOKAHEAD_DAYS: 30,
  },

  // People Data Labs Configuration
  PEOPLEDATALABS: {
    MAX_REQUESTS_PER_MINUTE: 100,
    ENRICHMENT_FIELDS: [
      'emails',
      'phone_numbers', 
      'profiles',
      'job_history',
      'education',
      'certifications',
      'skills',
      'interests'
    ],
  },

  // Research Configuration
  RESEARCH: {
    MAX_SEARCH_RESULTS: 10,
    MAX_SCRAPE_LENGTH: 5000,
    LINKEDIN_SEARCH_LIMIT: 5,
  },

  // Content Limits
  CONTENT: {
    MAX_BRIEF_LENGTH: 1200,
    MAX_BD_REPORT_LENGTH: 2000,
    MAX_PROMPT_LENGTH: 10000,
  },

  // Retry Configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 5000,
  },

  // Cache Configuration
  CACHE: {
    USER_TTL_MS: 3600000, // 1 hour
    SEARCH_TTL_MS: 900000, // 15 minutes
  },
} as const;

// CroMetrics Business Context
export const CRO_METRICS_CONTEXT = {
  COMPANY_NAME: 'Cro Metrics',
  TAGLINE: 'Your Agency for All Things Digital Growth',
  
  SERVICES: {
    ANALYTICS: 'Empower your team with unified data insights for full-funnel visibility and action',
    CRO: 'Uncover your strongest growth opportunities while mitigating risks before they impact your bottom line',
    CREATIVE: 'Creative designed to captivate, convert, and drive growth results',
    CUSTOMER_JOURNEY: 'Transform fragmented customer data into actionable insights',
    DESIGN_BUILD: 'From high-converting landing pages to (risk-free) re-platforming, and everything in between',
    IRIS: 'A single platform to manage and maximize the impact of your growth program',
    LIFECYCLE_EMAIL: 'Elevate loyalty and retention with cross-channel programs driving engagement and growth',
    PERFORMANCE_MARKETING: 'Maximize ROAS with data-driven, multi-channel campaigns and clear attribution',
  },

  INDUSTRIES: [
    'Subscription-based companies',
    'E-Commerce/Retail',
    'SaaS and Lead Generation',
    'Hospitality',
    'FinTech',
    'B2B Lead Gen',
    'Nonprofit & Associations',
  ],

  ACHIEVEMENTS: {
    CLIENT_IMPACT: '$1B',
    RETENTION_RATE: '97.4%',
    AVG_ROI: '10X',
    WIN_RATE: '2X industry average',
  },

  CLIENT_SUCCESS: {
    HOME_CHEF: 'Boosted revenue and long-term success',
    CUROLOGY: 'Creative that converts with data-driven design',
    BOMBAS: 'Increased testing velocity and overall ROI',
    CALENDLY: 'Access to best practices and strategies',
    UNICEF_USA: 'Thorough attention to detail and big-picture understanding',
  },

  DIFFERENTIATORS: [
    'Scientific approach: "We Don\'t Guess, We Test"',
    'Proprietary Iris platform for unified insights and predictive analysis',
    'Google Partner and Meta Business Partner certifications',
    '15+ years of proven results with household-name brands',
  ],
} as const;