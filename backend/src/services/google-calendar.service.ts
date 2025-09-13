import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import config from '../config/env';
import { CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

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
  conferenceData?: {
    conferenceId?: string;
    conferenceSolution?: {
      name: string;
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri?: string;
    }>;
  };
}

export interface MeetingContext {
  subject: string;
  description?: string;
  attendeeEmails: string[];
  organizerEmail: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingUrl?: string;
}

class GoogleCalendarService {
  private oauth2Client: OAuth2Client | null = null;

  constructor() {
    if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
      this.oauth2Client = new OAuth2Client(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.GOOGLE_REDIRECT_URI
      );
      logger.info('Google Calendar service initialized');
    } else {
      logger.warn('Google Calendar credentials not configured');
    }
  }

  private ensureClient(): OAuth2Client {
    if (!this.oauth2Client) {
      throw new Error('Google Calendar client not initialized. Please configure Google Calendar credentials.');
    }
    return this.oauth2Client;
  }

  /**
   * Generate OAuth 2.0 authorization URL
   */
  getAuthUrl(): string {
    const client = this.ensureClient();
    
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [...CONSTANTS.GOOGLE_CALENDAR.SCOPES],
      prompt: 'consent'
    });

    logger.info('Generated Google Calendar auth URL');
    return authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async getAccessToken(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    const client = this.ensureClient();

    try {
      // Use modern async/await approach instead of deprecated callback
      const { tokens } = await client.getToken(code);

      client.setCredentials(tokens);

      logger.info('Successfully obtained Google Calendar access tokens');

      return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || undefined
      };
    } catch (error) {
      logger.error('Failed to exchange authorization code for tokens:', error);
      throw new Error('Failed to authenticate with Google Calendar');
    }
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(accessToken: string, refreshToken?: string): void {
    const client = this.ensureClient();
    
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    logger.info('Set Google Calendar access tokens');
  }

  /**
   * Fetch upcoming calendar events
   */
  async getUpcomingEvents(
    lookbackDays: number = CONSTANTS.GOOGLE_CALENDAR.DEFAULT_LOOKBACK_DAYS,
    lookaheadDays: number = CONSTANTS.GOOGLE_CALENDAR.DEFAULT_LOOKAHEAD_DAYS
  ): Promise<CalendarEvent[]> {
    const client = this.ensureClient();
    
    try {
      const calendar = google.calendar({ version: 'v3', auth: client });
      
      const now = new Date();
      const timeMin = new Date(now.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));
      const timeMax = new Date(now.getTime() + (lookaheadDays * 24 * 60 * 60 * 1000));

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: CONSTANTS.GOOGLE_CALENDAR.MAX_EVENTS,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      const processedEvents: CalendarEvent[] = events
        .filter(event => event.attendees && event.attendees.length > 1) // Only meetings with attendees
        .map(event => ({
          id: event.id!,
          summary: event.summary || 'No Title',
          description: event.description || undefined,
          start: {
            dateTime: event.start?.dateTime || event.start?.date || '',
            timeZone: event.start?.timeZone || 'UTC'
          },
          end: {
            dateTime: event.end?.dateTime || event.end?.date || '',
            timeZone: event.end?.timeZone || 'UTC'
          },
          attendees: event.attendees?.map(attendee => ({
            email: attendee.email!,
            displayName: attendee.displayName || undefined,
            responseStatus: attendee.responseStatus || undefined
          })) || [],
          organizer: {
            email: event.organizer?.email || '',
            displayName: event.organizer?.displayName || undefined
          },
          location: event.location || undefined,
          hangoutLink: event.hangoutLink || undefined,
          conferenceData: event.conferenceData ? {
            conferenceId: event.conferenceData.conferenceId || undefined,
            conferenceSolution: event.conferenceData.conferenceSolution ? {
              name: event.conferenceData.conferenceSolution.name || ''
            } : undefined,
            entryPoints: event.conferenceData.entryPoints?.map(ep => ({
              entryPointType: ep.entryPointType || '',
              uri: ep.uri || undefined
            }))
          } : undefined
        }));

      logger.info(`Retrieved ${processedEvents.length} calendar events`);
      return processedEvents;
      
    } catch (error) {
      logger.error('Failed to fetch calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Get specific event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    const client = this.ensureClient();
    
    try {
      const calendar = google.calendar({ version: 'v3', auth: client });
      
      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      const event = response.data;
      
      if (!event) {
        return null;
      }

      return {
        id: event.id!,
        summary: event.summary || 'No Title',
        description: event.description || undefined,
        start: {
          dateTime: event.start?.dateTime || event.start?.date || '',
          timeZone: event.start?.timeZone || 'UTC'
        },
        end: {
          dateTime: event.end?.dateTime || event.end?.date || '',
          timeZone: event.end?.timeZone || 'UTC'
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          displayName: attendee.displayName || undefined,
          responseStatus: attendee.responseStatus || undefined
        })) || [],
        organizer: {
          email: event.organizer?.email || '',
          displayName: event.organizer?.displayName || undefined
        },
        location: event.location || undefined,
        hangoutLink: event.hangoutLink || undefined,
        conferenceData: event.conferenceData ? {
          conferenceId: event.conferenceData.conferenceId || undefined,
          conferenceSolution: event.conferenceData.conferenceSolution ? {
            name: event.conferenceData.conferenceSolution.name || ''
          } : undefined,
          entryPoints: event.conferenceData.entryPoints?.map(ep => ({
            entryPointType: ep.entryPointType || '',
            uri: ep.uri || undefined
          }))
        } : undefined
      };
      
    } catch (error) {
      logger.error(`Failed to fetch event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Parse calendar event into meeting context for AI processing
   */
  parseMeetingContext(event: CalendarEvent): MeetingContext {
    return {
      subject: event.summary,
      description: event.description,
      attendeeEmails: event.attendees.map(a => a.email),
      organizerEmail: event.organizer.email,
      startTime: new Date(event.start.dateTime),
      endTime: new Date(event.end.dateTime),
      location: event.location,
      meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.find(ep => ep.uri)?.uri
    };
  }

  /**
   * Extract attendee emails from a list of events
   */
  extractAllAttendeeEmails(events: CalendarEvent[]): string[] {
    const emails = new Set<string>();
    
    for (const event of events) {
      for (const attendee of event.attendees) {
        if (attendee.email && this.isValidEmail(attendee.email)) {
          emails.add(attendee.email.toLowerCase());
        }
      }
      // Also include organizer
      if (event.organizer.email && this.isValidEmail(event.organizer.email)) {
        emails.add(event.organizer.email.toLowerCase());
      }
    }
    
    return Array.from(emails);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.oauth2Client !== null;
  }
}

export default new GoogleCalendarService();