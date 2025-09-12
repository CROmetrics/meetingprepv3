import { Request, Response } from 'express';
import googleCalendarService from '../services/google-calendar.service';
import peopleDataLabsService from '../services/peopledatalabs.service';
import hubspotService from '../services/hubspot.service';
import openAIService from '../services/openai.service';
import logger from '../utils/logger';

/**
 * Get Google Calendar OAuth authorization URL
 */
export const getCalendarAuthUrl = async (req: Request, res: Response) => {
  try {
    if (!googleCalendarService.isConfigured()) {
      return res.status(503).json({
        error: 'Google Calendar service not configured. Please set up Google Calendar credentials.',
      });
    }

    const authUrl = googleCalendarService.getAuthUrl();
    
    res.json({
      authUrl,
      message: 'Visit this URL to authorize calendar access'
    });
  } catch (error) {
    logger.error('Error generating calendar auth URL:', error);
    res.status(500).json({
      error: 'Failed to generate authorization URL',
    });
  }
};

/**
 * Handle Google Calendar OAuth callback
 */
export const handleCalendarCallback = async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    if (error) {
      logger.error('Calendar authorization error:', error);
      return res.status(400).json({
        error: 'Calendar authorization was denied or failed',
        details: error
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Missing authorization code',
      });
    }

    const tokens = await googleCalendarService.getAccessToken(code);
    
    // In a real application, you'd store these tokens securely for the user
    // For now, we'll return them to be stored client-side
    res.json({
      message: 'Calendar authorization successful',
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      }
    });
  } catch (error) {
    logger.error('Error handling calendar callback:', error);
    res.status(500).json({
      error: 'Failed to complete calendar authorization',
    });
  }
};

/**
 * Get upcoming calendar events
 */
export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    const { access_token, refresh_token, lookback_days = 7, lookahead_days = 30 } = req.body;

    if (!access_token) {
      return res.status(400).json({
        error: 'Access token required',
      });
    }

    // Set the access token
    googleCalendarService.setAccessToken(access_token, refresh_token);

    // Fetch events
    const events = await googleCalendarService.getUpcomingEvents(
      parseInt(lookback_days as string, 10),
      parseInt(lookahead_days as string, 10)
    );

    res.json({
      events,
      count: events.length,
      message: `Retrieved ${events.length} calendar events`
    });
  } catch (error) {
    logger.error('Error fetching calendar events:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar events',
    });
  }
};

/**
 * Get specific calendar event by ID
 */
export const getCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        error: 'Access token required',
      });
    }

    if (!eventId) {
      return res.status(400).json({
        error: 'Event ID required',
      });
    }

    // Set the access token
    googleCalendarService.setAccessToken(access_token, refresh_token);

    // Fetch specific event
    const event = await googleCalendarService.getEvent(eventId);

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    res.json({
      event,
      message: 'Event retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching calendar event:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar event',
    });
  }
};

/**
 * Generate comprehensive meeting brief from calendar event
 */
export const generateMeetingBrief = async (req: Request, res: Response) => {
  try {
    const { 
      access_token, 
      refresh_token, 
      event_id,
      include_pdl_enrichment = true,
      include_company_insights = true 
    } = req.body;

    if (!access_token) {
      return res.status(400).json({
        error: 'Access token required',
      });
    }

    if (!event_id) {
      return res.status(400).json({
        error: 'Event ID required',
      });
    }

    // Set the access token
    googleCalendarService.setAccessToken(access_token, refresh_token);

    // Fetch the event
    const event = await googleCalendarService.getEvent(event_id);
    if (!event) {
      return res.status(404).json({
        error: 'Calendar event not found',
      });
    }

    // Parse meeting context
    const meetingContext = googleCalendarService.parseMeetingContext(event);
    logger.info(`Processing meeting: ${meetingContext.subject} with ${meetingContext.attendeeEmails.length} attendees`);

    // Enrich attendee data
    const enrichmentResults: {
      hubspot: any[];
      peopleDataLabs: any[];
      companyInsights: Map<string, any>;
    } = {
      hubspot: [],
      peopleDataLabs: [],
      companyInsights: new Map()
    };

    // Get HubSpot data for attendees
    if (hubspotService.isConfigured()) {
      try {
        enrichmentResults.hubspot = await hubspotService.fetchContactsByEmail(meetingContext.attendeeEmails);
        logger.info(`Found ${enrichmentResults.hubspot.length} HubSpot contacts`);
        
        // Get company insights if requested
        if (include_company_insights) {
          enrichmentResults.companyInsights = await hubspotService.getRelatedCompanies(meetingContext.attendeeEmails);
          logger.info(`Generated insights for ${enrichmentResults.companyInsights.size} companies`);
        }
      } catch (error) {
        logger.error('Error enriching with HubSpot data:', error);
      }
    }

    // Get People Data Labs enrichment if requested and configured
    if (include_pdl_enrichment && peopleDataLabsService.isConfigured()) {
      try {
        enrichmentResults.peopleDataLabs = await peopleDataLabsService.enrichContactsByEmail(meetingContext.attendeeEmails);
        logger.info(`PDL enriched ${enrichmentResults.peopleDataLabs.length} contacts`);
      } catch (error) {
        logger.error('Error enriching with People Data Labs:', error);
      }
    }

    // Generate AI brief
    const briefPrompt = `
Generate a comprehensive executive meeting brief based on the following calendar event and attendee research:

**Meeting Details:**
- Subject: ${meetingContext.subject}
- Date: ${meetingContext.startTime.toLocaleDateString()} ${meetingContext.startTime.toLocaleTimeString()}
- Duration: ${Math.round((meetingContext.endTime.getTime() - meetingContext.startTime.getTime()) / (1000 * 60))} minutes
- Attendees: ${meetingContext.attendeeEmails.length}
${meetingContext.description ? `- Description: ${meetingContext.description}` : ''}
${meetingContext.location ? `- Location: ${meetingContext.location}` : ''}
${meetingContext.meetingUrl ? `- Meeting URL: ${meetingContext.meetingUrl}` : ''}

**Attendee Research:**
${enrichmentResults.hubspot.length > 0 ? `
HubSpot Contacts (${enrichmentResults.hubspot.length}):
${enrichmentResults.hubspot.map(contact => 
  `- ${contact.firstname} ${contact.lastname} (${contact.email}) - ${contact.jobtitle || 'No title'} at ${contact.company || 'No company'}`
).join('\\n')}
` : ''}

${enrichmentResults.peopleDataLabs.length > 0 ? `
Professional Profiles (${enrichmentResults.peopleDataLabs.filter(p => p.pdlProfile).length}):
${enrichmentResults.peopleDataLabs.filter(p => p.pdlProfile).map(enriched => {
  const profile = enriched.pdlProfile!;
  const currentJob = peopleDataLabsService.extractCurrentJob(profile);
  const linkedinUrl = peopleDataLabsService.extractLinkedInUrl(profile);
  return `- ${profile.full_name} (${enriched.email}) - ${currentJob?.title || 'No title'} at ${currentJob?.company || 'No company'}${linkedinUrl ? ` | LinkedIn: ${linkedinUrl}` : ''}`;
}).join('\\n')}
` : ''}

${enrichmentResults.companyInsights.size > 0 ? `
Company Insights:
${Array.from(enrichmentResults.companyInsights.entries()).map(([domain, insight]) => 
  `- ${insight.company.name || domain}: ${insight.totalContacts} contacts in CRM, ${insight.keyStakeholders.length} key stakeholders, ${insight.recentDeals.length} recent deals`
).join('\\n')}
` : ''}

Please provide:
1. **Meeting Overview** - Context and likely objectives
2. **Attendee Profiles** - Key people and their roles/backgrounds
3. **Company Context** - Relevant business relationships and opportunities
4. **Strategic Preparation** - Key talking points and questions to ask
5. **Action Items** - Potential follow-up actions

Format this as an executive briefing optimized for mobile viewing.
`;

    const brief = await openAIService.generateResponse(briefPrompt);

    res.json({
      meetingContext,
      enrichmentSummary: {
        hubspotContacts: enrichmentResults.hubspot.length,
        pdlEnrichedProfiles: enrichmentResults.peopleDataLabs.filter(p => p.pdlProfile).length,
        companyInsights: enrichmentResults.companyInsights.size
      },
      brief,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating meeting brief:', error);
    res.status(500).json({
      error: 'Failed to generate meeting brief',
    });
  }
};

/**
 * Test calendar service configuration
 */
export const testCalendarConfig = async (req: Request, res: Response) => {
  try {
    const isConfigured = googleCalendarService.isConfigured();
    const pdlConfigured = peopleDataLabsService.isConfigured();
    const hubspotConfigured = hubspotService.isConfigured();

    res.json({
      googleCalendar: {
        configured: isConfigured,
        status: isConfigured ? 'Ready' : 'Missing Google Calendar credentials'
      },
      peopleDataLabs: {
        configured: pdlConfigured,
        status: pdlConfigured ? 'Ready' : 'Missing People Data Labs API key'
      },
      hubspot: {
        configured: hubspotConfigured,
        status: hubspotConfigured ? 'Ready' : 'Missing HubSpot token'
      }
    });
  } catch (error) {
    logger.error('Error testing calendar config:', error);
    res.status(500).json({
      error: 'Failed to test configuration',
    });
  }
};