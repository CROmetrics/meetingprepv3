import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calendarApi, CalendarTokens } from '../services/calendar.api';

interface CalendarEvent {
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

export function useCalendarIntegration() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<CalendarTokens | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Load stored tokens on mount
  useEffect(() => {
    const storedTokens = calendarApi.getStoredTokens();
    if (storedTokens) {
      setTokens(storedTokens);
      // Auto-fetch events when tokens are available
      fetchEventsWithTokens(storedTokens);
    }
  }, []);

  const fetchEventsWithTokens = async (tokensToUse: CalendarTokens) => {
    setLoadingEvents(true);
    setCalendarError(null);
    try {
      const data = await calendarApi.getCalendarEvents(tokensToUse, {
        lookback_days: 0, // Only show future events
        lookahead_days: 14
      });

      if (data.events) {
        setEvents(data.events);
        // Clear any previous errors
        setCalendarError(null);
      } else {
        setEvents([]);
        setCalendarError('No upcoming meetings found in the next 14 days.');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('Invalid Credentials')) {
        setCalendarError('Calendar access expired. Please reconnect your Google Calendar.');
      } else if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        setCalendarError('Calendar access denied. Please check your Google Calendar permissions.');
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        setCalendarError('Network error. Please check your connection and try again.');
      } else {
        setCalendarError(`Failed to load calendar events: ${errorMessage}`);
      }

      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEvents = async () => {
    if (!tokens) {
      setCalendarError('Please connect your Google Calendar first');
      return;
    }

    await fetchEventsWithTokens(tokens);
  };

  const connectCalendar = () => {
    navigate('/calendar');
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getDurationMinutes = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  const extractMeetingData = (event: CalendarEvent) => {
    // Define CROmetrics domains and other internal/personal domains to exclude
    const excludedDomains = [
      'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com',
      'crometrics.com', 'cro-metrics.com' // CROmetrics domains
    ];

    // Extract company names from attendee domains (excluding CROmetrics and personal emails)
    const companyDomains = new Set<string>();
    event.attendees.forEach(attendee => {
      const domain = attendee.email.split('@')[1]?.toLowerCase();
      if (domain && !excludedDomains.some(excluded => domain.includes(excluded))) {
        companyDomains.add(domain);
      }
    });

    // Convert attendees to form format (only include external attendees for research)
    const attendees = event.attendees
      .filter(attendee => {
        // Include all attendees in the form, but they'll be filtered for research later
        return attendee.displayName || attendee.email;
      })
      .map((attendee, index) => {
        const domain = attendee.email.split('@')[1]?.toLowerCase();
        let companyName = '';

        // Try to extract company name from domain (excluding internal/personal domains)
        if (domain && !excludedDomains.some(excluded => domain.includes(excluded))) {
          companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        }

        return {
          id: (index + 1).toString(),
          name: attendee.displayName || '',
          email: attendee.email,
          title: '',
          company: companyName,
          linkedinUrl: '',
        };
      });

    // Determine target company (exclude CROmetrics)
    const targetCompanyDomains = Array.from(companyDomains).filter(domain =>
      !domain.includes('crometrics.com') && !domain.includes('cro-metrics.com')
    );

    return {
      company: targetCompanyDomains.map(domain =>
        domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
      ).join(', ') || 'External Company',
      purpose: event.summary,
      additionalContext: event.description || `Meeting scheduled for ${new Date(event.start.dateTime).toLocaleString()}${event.location ? ` at ${event.location}` : ''}`,
      attendees,
    };
  };

  return {
    // State
    tokens,
    events,
    loadingEvents,
    calendarError,
    selectedEvent,
    expandedEvent,

    // Actions
    setSelectedEvent,
    setExpandedEvent,
    fetchEvents,
    connectCalendar,

    // Utilities
    formatDateTime,
    getDurationMinutes,
    extractMeetingData,

    // Computed
    hasTokens: !!tokens,
    hasEvents: events.length > 0,
  };
}