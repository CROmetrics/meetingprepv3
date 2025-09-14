export interface Attendee {
  name: string;
  email?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
}

export interface BDMeetingRequest {
  company: string;
  attendees: Attendee[];
  purpose?: string;
  additionalContext?: string;
}

export interface AttendeeWithStatus extends Attendee {
  id: string;
  researchStatus: 'pending' | 'researching' | 'completed' | 'error';
  hubspotStatus?: 'not_found' | 'found' | 'added';
}

export interface AttendeeWithId extends Attendee {
  id: string;
}

export interface BDMeetingFormData {
  company: string;
  purpose?: string;
  additionalContext?: string;
  attendees: AttendeeWithStatus[];
}

export interface BDMeetingFormDataSimple {
  company: string;
  purpose?: string;
  additionalContext?: string;
  attendees: AttendeeWithId[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UsageLog {
  timestamp: string;
  eventType: string;
  clientIp: string;
  data: Record<string, unknown>;
}

export interface BDReportData {
  report: {
    executiveSummary: string;
    targetCompanyIntelligence: string;
    meetingAttendeeAnalysis: string;
    strategicOpportunityAssessment: string;
    meetingDynamicsStrategy: string;
    keyQuestions: string[];
    potentialObjectionsResponses: string;
    confidence: number;
    promptUsed: string;
  };
  metadata: {
    company: string;
    attendeesCount: number;
    sourcesCount: number;
    generatedAt: string;
  };
}

export interface BDResearchData {
  attendees: Array<{
    name: string;
    title?: string;
    company?: string;
    email?: string;
    linkedinUrl?: string;
    hubspotData?: unknown;
    linkedinSnippet?: string;
    searchResults?: unknown[];
  }>;
  company: string;
}

// Customer Research types
export interface HubSpotCompany {
  id: string;
  name?: string;
  domain?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  numberofemployees?: string;
  annualrevenue?: string;
  linkedincompanypage?: string;
  description?: string;
  website?: string;
  founded_year?: string;
  type?: string;
}

export interface HubSpotContact {
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  jobtitle?: string;
  company?: string;
  linkedin_url?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface CompanyInsight {
  company: HubSpotCompany;
  relatedContacts: HubSpotContact[];
  totalContacts: number;
  recentDeals: Record<string, unknown>[];
  keyStakeholders: HubSpotContact[];
}

export interface ResearchReport {
  companyId: string;
  companyName: string;
  report: string;
  hubspotData: CompanyInsight;
  generatedAt: string;
  promptUsed: string;
}
