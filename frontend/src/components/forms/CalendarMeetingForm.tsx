import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { calendarApi, CalendarTokens } from '../../services/calendar.api';

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

interface CalendarMeetingFormProps {
  // No props needed anymore since we're navigating to manual research
}

export const CalendarMeetingForm: React.FC<CalendarMeetingFormProps> = () => {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<CalendarTokens | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [processingResearch, setProcessingResearch] = useState(false);


  // Load stored tokens on component mount
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
        lookback_days: 2,
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

  const populateManualResearch = async (event: CalendarEvent) => {
    console.log('populateManualResearch called with event:', event.summary);
    setProcessingResearch(true);

    try {
      // Extract company names from attendee domains
      const companyDomains = new Set<string>();
      event.attendees.forEach(attendee => {
        const domain = attendee.email.split('@')[1];
        if (domain && !domain.includes('gmail.com') && !domain.includes('outlook.com') && !domain.includes('yahoo.com')) {
          companyDomains.add(domain);
        }
      });

      // Convert attendees to manual research format
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

      // Create the form data
      const formData = {
        company: Array.from(companyDomains).map(domain =>
          domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
        ).join(', ') || 'Meeting Company',
        purpose: event.summary,
        additionalContext: event.description || `Meeting scheduled for ${new Date(event.start.dateTime).toLocaleString()}${event.location ? ` at ${event.location}` : ''}`,
        attendees,
      };

      console.log('Form data to be stored:', formData);

      // Store in localStorage for the manual research form
      localStorage.setItem('bdMeetingForm', JSON.stringify(formData));
      console.log('Data stored in localStorage');

      // Verify the data was stored correctly
      const storedData = localStorage.getItem('bdMeetingForm');
      if (!storedData) {
        throw new Error('Failed to store data in localStorage');
      }

      console.log('Data verified in localStorage:', JSON.parse(storedData));

      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to manual research interface
      console.log('Navigating to /');
      try {
        navigate('/');
        console.log('Navigate called successfully');
      } catch (navError) {
        console.error('Navigate failed, trying window.location:', navError);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error in populateManualResearch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error preparing meeting research: ${errorMessage}`);
    } finally {
      setProcessingResearch(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Calendar Meeting Brief Generator
        </h2>

        {/* Connect Calendar or Load Events */}
        {!tokens ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              1. Connect Your Calendar
            </h3>
            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to access and research your upcoming meetings.
            </p>
            <button
              onClick={() => navigate('/calendar')}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Google Calendar
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              1. Load Your Meetings
            </h3>

            <button
              onClick={fetchEvents}
              disabled={loadingEvents}
              className="w-full sm:w-auto bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              {loadingEvents ? 'Loading...' : 'Load Upcoming Meetings'}
            </button>
          </div>
        )}

        {/* Step 2: Select Event */}
        {events.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              2. Select a Meeting
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event) => {
                const { date, time } = formatDateTime(event.start.dateTime);
                const duration = getDurationMinutes(event.start.dateTime, event.end.dateTime);
                const isExpanded = expandedEvent === event.id;
                
                return (
                  <div
                    key={event.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between"
                      onClick={() => {
                        setSelectedEvent(event);
                        setExpandedEvent(isExpanded ? null : event.id);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 text-sm text-gray-500 font-medium">
                            <div>{date}</div>
                            <div>{time}</div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {event.summary}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>{duration} min</span>
                              <span>{event.attendees.length} attendees</span>
                              {event.location && (
                                <span className="truncate">{event.location}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-2">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        {event.description && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Description:</h5>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          </div>
                        )}
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Attendees ({event.attendees.length}):
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {event.attendees.slice(0, 6).map((attendee, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                              >
                                {attendee.displayName || attendee.email}
                              </span>
                            ))}
                            {event.attendees.length > 6 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-500">
                                +{event.attendees.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Step 3: Research Meeting */}
        {selectedEvent && (
          <div>
            <button
              onClick={() => {
                try {
                  console.log('Button clicked');
                  populateManualResearch(selectedEvent);
                } catch (error) {
                  console.error('Button click error:', error);
                }
              }}
              type="button"
              disabled={processingResearch}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingResearch ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing Research...
                </div>
              ) : (
                'Research This Meeting'
              )}
            </button>
            <p className="text-sm text-gray-500 mt-2 text-center">
              This will populate the manual research interface with meeting details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};