export interface Attendee {
  name: string;
  email?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  hubspotId?: string;
}

export interface BDMeetingRequest {
  company: string;
  attendees: Attendee[];
  purpose?: string;
  additionalContext?: string;
}

export interface AttendeeResearch {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  linkedinUrl?: string;
  linkedinSnippet?: string;
  linkedinProfileContent?: string;
  hubspotData?: HubSpotContact;
  backgroundResearch?: string[];
  searchResults?: WebSearchResult[];
}

export interface CompanyResearch {
  overview: WebSearchResult[];
  recentNews: WebSearchResult[];
  financialInfo: WebSearchResult[];
  digitalTransformation: WebSearchResult[];
}

export interface CompetitiveAnalysis {
  results: WebSearchResult[];
  analysis?: string;
}

export interface ResearchResult {
  attendeeResearch: AttendeeResearch[];
  companyResearch: CompanyResearch;
  competitiveLandscape: CompetitiveAnalysis;
  sources: string[];
}

export interface IntelligenceReport {
  company: string;
  attendees: string[];
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

export interface WebSearchResult {
  title: string;
  snippet: string;
  link: string;
}

export interface WebPageContent {
  title: string;
  content: string;
  url: string;
}

export interface HubSpotContact {
  id?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  jobtitle?: string;
  company?: string;
  lifecyclestage?: string;
  linkedin_url?: string;
  hs_object_id?: string;
}