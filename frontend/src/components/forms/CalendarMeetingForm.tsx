import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
  onGenerateBrief: (eventId: string, options: any) => Promise<void>;
  loading?: boolean;
}

export const CalendarMeetingForm: React.FC<CalendarMeetingFormProps> = ({
  onGenerateBrief,
  loading = false
}) => {
  const [tokens, setTokens] = useState<CalendarTokens | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Options
  const [includePDL, setIncludePDL] = useState(true);
  const [includeCompanyInsights, setIncludeCompanyInsights] = useState(true);

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

  const handleGenerateBrief = async () => {
    if (!selectedEvent) {
      alert('Please select a meeting');
      return;
    }

    await onGenerateBrief(selectedEvent.id, {
      include_pdl_enrichment: includePDL,
      include_company_insights: includeCompanyInsights,
    });
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Calendar Meeting Brief Generator
        </h2>

        {/* Load Events */}
        {tokens && (
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

        {/* Step 3: Options */}
        {selectedEvent && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              3. Briefing Options
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includePDL}
                  onChange={(e) => setIncludePDL(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Professional Profile Enrichment
                  </span>
                  <p className="text-xs text-gray-500">
                    Include LinkedIn profiles and professional backgrounds via People Data Labs
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeCompanyInsights}
                  onChange={(e) => setIncludeCompanyInsights(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Company Intelligence
                  </span>
                  <p className="text-xs text-gray-500">
                    Include company insights, relationships, and stakeholder analysis from HubSpot
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Generate */}
        {selectedEvent && (
          <div>
            <button
              onClick={handleGenerateBrief}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Brief...</span>
                </div>
              ) : (
                'Generate Meeting Brief'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};