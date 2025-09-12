import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  // Options
  const [includePDL, setIncludePDL] = useState(true);
  const [includeCompanyInsights, setIncludeCompanyInsights] = useState(true);

  const fetchAuthUrl = async () => {
    try {
      const response = await fetch('/api/calendar/auth-url');
      const data = await response.json();
      
      if (data.authUrl) {
        setAuthUrl(data.authUrl);
        window.open(data.authUrl, '_blank');
      }
    } catch (error) {
      console.error('Error fetching auth URL:', error);
    }
  };

  const fetchEvents = async () => {
    if (!accessToken) {
      alert('Please connect your calendar first');
      return;
    }

    setLoadingEvents(true);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          lookback_days: 2,
          lookahead_days: 14
        }),
      });

      const data = await response.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!selectedEvent) {
      alert('Please select a meeting');
      return;
    }

    await onGenerateBrief(selectedEvent.id, {
      access_token: accessToken,
      refresh_token: refreshToken,
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

        {/* Step 1: Connect Calendar */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            1. Connect Your Google Calendar
          </h3>
          
          {!accessToken ? (
            <div className="space-y-4">
              <button
                onClick={fetchAuthUrl}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Connect Google Calendar
              </button>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Access Token (paste from authorization):
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste your access token here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Refresh Token (optional):
                </label>
                <input
                  type="password"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  placeholder="Paste refresh token (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">Calendar connected</span>
            </div>
          )}
        </div>

        {/* Step 2: Load Events */}
        {accessToken && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              2. Load Your Meetings
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

        {/* Step 3: Select Event */}
        {events.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              3. Select a Meeting
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

        {/* Step 4: Options */}
        {selectedEvent && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              4. Briefing Options
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

        {/* Step 5: Generate */}
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