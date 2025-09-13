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
    try {
      const data = await calendarApi.getCalendarEvents(tokensToUse, {
        lookback_days: 0, // Only show future events
        lookahead_days: 14
      });

      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch calendar events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEvents = async () => {
    if (!tokens) {
      alert('Please connect your calendar first');
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
    // Extract company names from attendee domains
    const companyDomains = new Set<string>();
    event.attendees.forEach(attendee => {
      const domain = attendee.email.split('@')[1];
      if (domain && !domain.includes('gmail.com') && !domain.includes('outlook.com') && !domain.includes('yahoo.com')) {
        companyDomains.add(domain);
      }
    });

    // Convert attendees to form format
    const attendees = event.attendees.map((attendee, index) => {
      const domain = attendee.email.split('@')[1];
      let companyName = '';

      // Try to extract company name from domain
      if (domain && !domain.includes('gmail.com') && !domain.includes('outlook.com') && !domain.includes('yahoo.com')) {
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

    return {
      company: Array.from(companyDomains).map(domain =>
        domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
      ).join(', ') || 'Meeting Company',
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