// Simple ApiError class for calendar service
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer: {
    email: string;
    displayName?: string;
  };
  location?: string;
  hangoutLink?: string;
}

export interface MeetingContext {
  subject: string;
  description?: string;
  attendeeEmails: string[];
  organizerEmail: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
}

export interface EnrichmentSummary {
  hubspotContacts: number;
  pdlEnrichedProfiles: number;
  companyInsights: number;
}

export interface MeetingBriefResponse {
  meetingContext: MeetingContext;
  enrichmentSummary: EnrichmentSummary;
  brief: string;
  generatedAt: string;
}

export interface CalendarTokens {
  access_token: string;
  refresh_token?: string;
}

class CalendarApiService {
  private baseURL = '/api/calendar';

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error || 'Request failed', response.status);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      console.error('Calendar API request failed:', error);
      throw new ApiError('Network error occurred', 0);
    }
  }

  /**
   * Get Google Calendar OAuth authorization URL
   */
  async getAuthUrl(): Promise<{ authUrl: string; message: string }> {
    return this.makeRequest('/auth-url');
  }

  /**
   * Get upcoming calendar events
   */
  async getCalendarEvents(
    tokens: CalendarTokens,
    options: {
      lookback_days?: number;
      lookahead_days?: number;
    } = {}
  ): Promise<{ events: CalendarEvent[]; count: number; message: string }> {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        lookback_days: options.lookback_days || 0,
        lookahead_days: options.lookahead_days || 30,
      }),
    });
  }

  /**
   * Get specific calendar event by ID
   */
  async getCalendarEvent(
    eventId: string,
    tokens: CalendarTokens
  ): Promise<{ event: CalendarEvent; message: string }> {
    return this.makeRequest(`/events/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }),
    });
  }

  /**
   * Generate comprehensive meeting brief from calendar event
   */
  async generateMeetingBrief(
    eventId: string,
    tokens: CalendarTokens,
    options: {
      include_pdl_enrichment?: boolean;
      include_company_insights?: boolean;
    } = {}
  ): Promise<MeetingBriefResponse> {
    return this.makeRequest('/meeting-brief', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        include_pdl_enrichment: options.include_pdl_enrichment ?? true,
        include_company_insights: options.include_company_insights ?? true,
      }),
    });
  }

  /**
   * Test calendar service configuration
   */
  async testConfig(): Promise<{
    googleCalendar: { configured: boolean; status: string };
    peopleDataLabs: { configured: boolean; status: string };
    hubspot: { configured: boolean; status: string };
  }> {
    return this.makeRequest('/test-config');
  }

  /**
   * Helper to store tokens in localStorage
   */
  storeTokens(tokens: CalendarTokens): void {
    localStorage.setItem('calendar_access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('calendar_refresh_token', tokens.refresh_token);
    }
  }

  /**
   * Helper to retrieve tokens from localStorage
   */
  getStoredTokens(): CalendarTokens | null {
    const accessToken = localStorage.getItem('calendar_access_token');
    const refreshToken = localStorage.getItem('calendar_refresh_token');

    if (!accessToken) {
      return null;
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    };
  }

  /**
   * Helper to clear stored tokens
   */
  clearStoredTokens(): void {
    localStorage.removeItem('calendar_access_token');
    localStorage.removeItem('calendar_refresh_token');
  }

  /**
   * Check if user has stored calendar tokens
   */
  hasStoredTokens(): boolean {
    return localStorage.getItem('calendar_access_token') !== null;
  }
}

export const calendarApi = new CalendarApiService();