import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Users,
  Building2,
  Target,
  Plus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { BDMeetingRequest, Attendee, BDMeetingFormDataSimple, AttendeeWithId } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useCalendarIntegration } from '../../hooks/useCalendarIntegration';
import ReactMarkdown from 'react-markdown';

export default function BDMeetingForm() {
  const [formData, setFormData] = useLocalStorage<BDMeetingFormDataSimple>('bdMeetingForm', {
    company: '',
    purpose: '',
    additionalContext: '',
    attendees: [
      {
        id: '1',
        name: '',
        email: '',
        title: '',
        company: '',
        linkedinUrl: '',
      },
    ],
  });

  // Calendar integration
  const {
    hasTokens,
    events,
    loadingEvents,
    calendarError,
    expandedEvent,
    setExpandedEvent,
    fetchEvents,
    connectCalendar,
    formatDateTime,
    getDurationMinutes,
    extractMeetingData,
    hasEvents,
  } = useCalendarIntegration();

  // Track research status and data separately (not persisted to localStorage)
  const [researchData, setResearchData] = useState<Record<string, any>>({});
  const [researchStatus, setResearchStatus] = useState<Record<string, 'pending' | 'researching' | 'completed'>>({});

  // Company research state
  const [companyResearchData, setCompanyResearchData] = useState<any>(null);
  const [companyResearchStatus, setCompanyResearchStatus] = useState<'idle' | 'researching' | 'completed' | 'error'>('idle');

  // Individual attendee research mutation
  const singleResearchMutation = useMutation({
    mutationFn: ({ attendee }: { attendeeId: string; attendee: any }) =>
      api.researchSingleAttendee(formData.company, attendee),
    onMutate: ({ attendeeId }) => {
      setResearchStatus(prev => ({ ...prev, [attendeeId]: 'researching' }));
    },
    onSuccess: (response, { attendeeId }) => {
      const researchedAttendee = response.data?.attendee;
      if (researchedAttendee) {
        // Store research data
        setResearchData(prev => ({ ...prev, [attendeeId]: researchedAttendee }));
        setResearchStatus(prev => ({ ...prev, [attendeeId]: 'completed' }));

        // Auto-populate form fields from research
        setFormData(prev => ({
          ...prev,
          attendees: prev.attendees.map(attendee => {
            if (attendee.id === attendeeId) {
              const hubspotData = researchedAttendee.hubspotData;
              return {
                ...attendee,
                email: attendee.email || hubspotData?.email || '',
                title: attendee.title || hubspotData?.jobtitle || '',
                company: attendee.company || hubspotData?.company || '',
                linkedinUrl: attendee.linkedinUrl || hubspotData?.linkedin_url || researchedAttendee.linkedinUrl || '',
              };
            }
            return attendee;
          })
        }));
      }
    },
    onError: (_, { attendeeId }) => {
      setResearchStatus(prev => ({ ...prev, [attendeeId]: 'pending' }));
    },
  });


  // Generate BD report mutation
  const generateMutation = useMutation({
    mutationFn: (data: BDMeetingRequest) => api.generateBDReport(data),
  });

  // Add to HubSpot mutation
  const addToHubSpotMutation = useMutation({
    mutationFn: (attendees: Attendee[]) => api.addToHubSpot(attendees),
    onSuccess: (_, attendees) => {
      // Update the hubspotStatus for the added attendee
      const addedAttendeeNames = attendees.map((a) => a.name);
      setFormData((prev) => ({
        ...prev,
        attendees: prev.attendees.map((attendee) =>
          addedAttendeeNames.includes(attendee.name)
            ? { ...attendee, hubspotStatus: 'added' as const }
            : attendee
        ),
      }));
    },
  });

  // Company research mutation
  const companyResearchMutation = useMutation({
    mutationFn: (data: { domain: string; companyName?: string }) =>
      api.researchCompany(data.domain, data.companyName),
    onMutate: () => {
      setCompanyResearchStatus('researching');
    },
    onSuccess: (response) => {
      setCompanyResearchData(response.data);
      setCompanyResearchStatus('completed');
    },
    onError: () => {
      setCompanyResearchStatus('error');
    },
  });

  // Add company to HubSpot mutation
  const addCompanyToHubSpotMutation = useMutation({
    mutationFn: (companyData: any) => api.addCompanyToHubSpot(companyData),
    onSuccess: () => {
      // Refresh company research to show it's now in HubSpot
      if (companyResearchData) {
        companyResearchMutation.mutate({
          domain: companyResearchData.domain,
          companyName: companyResearchData.searchQuery,
        });
      }
    },
  });

  const addAttendee = () => {
    const newId = (formData.attendees.length + 1).toString();
    setFormData((prev) => ({
      ...prev,
      attendees: [
        ...prev.attendees,
        {
          id: newId,
          name: '',
          email: '',
          title: '',
          company: '',
          linkedinUrl: '',
        },
      ],
    }));
  };

  const removeAttendee = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((a) => a.id !== id),
    }));
  };

  const updateAttendee = (id: string, field: keyof AttendeeWithId, value: string) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.map((attendee) =>
        attendee.id === id ? { ...attendee, [field]: value } : attendee
      ),
    }));
  };

  const handleResearchSingleAttendee = (attendeeId: string) => {
    const attendee = formData.attendees.find(a => a.id === attendeeId);
    if (!attendee || !attendee.name.trim() || !formData.company.trim()) {
      return;
    }

    const attendeeToResearch = {
      name: attendee.name,
      email: attendee.email || undefined,
      title: attendee.title || undefined,
      company: attendee.company || undefined,
      linkedinUrl: attendee.linkedinUrl || undefined,
    };

    singleResearchMutation.mutate({ attendeeId, attendee: attendeeToResearch });
  };


  const handleGenerateReport = () => {
    const request: BDMeetingRequest = {
      company: formData.company,
      attendees: formData.attendees.map(
        ({ id: _, ...attendee }) => attendee
      ),
      purpose: formData.purpose,
      additionalContext: formData.additionalContext,
    };
    generateMutation.mutate(request);
  };

  const handleAddToHubSpot = (attendeeId: string) => {
    const attendee = formData.attendees.find((a) => a.id === attendeeId);
    if (!attendee) return;

    const attendeeToAdd: Attendee = {
      name: attendee.name,
      email: attendee.email,
      title: attendee.title,
      company: attendee.company,
      linkedinUrl: attendee.linkedinUrl,
    };

    addToHubSpotMutation.mutate([attendeeToAdd]);
  };

  // Helper function to determine if an attendee should be researched (exclude user themselves)
  const shouldResearchAttendee = (attendee: AttendeeWithId) => {
    // If attendee email contains 'crometrics' or common indicators of being the user, skip research requirement
    const email = attendee.email?.toLowerCase() || '';
    const isLikelyUser = email.includes('crometrics') || email.includes('cro-metrics');
    return !isLikelyUser;
  };

  const canGenerateReport = formData.attendees.every((a) =>
    !shouldResearchAttendee(a) || researchStatus[a.id] === 'completed'
  );
  const hasResearchedAttendees = formData.attendees.some((a) => researchStatus[a.id] === 'completed');

  // Helper function to get attendee research status
  const getAttendeeStatus = (attendeeId: string) => researchStatus[attendeeId] || 'pending';
  const getAttendeeData = (attendeeId: string) => researchData[attendeeId];
  const canResearchAttendee = (attendee: any) => formData.company.trim() && attendee.name.trim();

  // Helper function to research company
  const handleResearchCompany = () => {
    // Extract domain from attendees' emails
    const attendeesDomains = formData.attendees
      .map(attendee => attendee.email ? attendee.email.split('@')[1] : null)
      .filter((domain): domain is string =>
        domain !== null &&
        domain !== '' &&
        !['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'].includes(domain)
      );

    const primaryDomain = attendeesDomains[0];
    if (primaryDomain) {
      companyResearchMutation.mutate({
        domain: primaryDomain,
        companyName: formData.company || undefined,
      });
    }
  };

  const handleAddCompanyToHubSpot = () => {
    if (companyResearchData?.pdl) {
      const pdlData = companyResearchData.pdl;
      addCompanyToHubSpotMutation.mutate({
        name: pdlData.name || formData.company,
        domain: companyResearchData.domain,
        industry: pdlData.industry,
        description: pdlData.summary,
        website: pdlData.website,
        numberofemployees: pdlData.employee_count ? pdlData.employee_count.toString() : undefined,
        city: pdlData.location?.city,
        state: pdlData.location?.state,
        country: pdlData.location?.country,
        founded_year: pdlData.founded ? pdlData.founded.toString() : undefined,
      });
    }
  };

  // Function to populate form with calendar event data
  const handleLoadMeetingDetails = (event: any) => {
    const meetingData = extractMeetingData(event);
    setFormData(meetingData);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Integration Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-cro-blue-50 to-cro-purple-50 rounded-2xl border-2 border-cro-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="w-5 h-5 text-cro-blue-600" />
          <h3 className="text-lg font-semibold text-cro-blue-700">
            Calendar Integration
          </h3>
          <span className="text-sm text-cro-soft-black-600">(Optional)</span>
        </div>
        <p className="text-sm text-cro-soft-black-600 mb-4">
          Connect your Google Calendar to automatically populate meeting details, or fill out the form manually below.
        </p>

        {!hasTokens ? (
          <button
            onClick={connectCalendar}
            className="flex items-center gap-2 px-4 py-2 bg-cro-blue-600 text-white rounded-xl font-medium hover:bg-cro-blue-700 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Connect Google Calendar
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={fetchEvents}
                disabled={loadingEvents}
                className="flex items-center gap-2 px-4 py-2 bg-cro-blue-600 text-white rounded-xl font-medium hover:bg-cro-blue-700 disabled:opacity-50 transition-colors"
              >
                {loadingEvents ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                {loadingEvents ? 'Loading...' : 'Load Upcoming Meetings'}
              </button>
              {hasEvents && (
                <span className="text-sm text-cro-green-600">
                  ✓ Found {events.length} upcoming meetings
                </span>
              )}
              {calendarError && (
                <div className="text-sm text-cro-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  ⚠️ {calendarError}
                </div>
              )}
            </div>

            {hasEvents && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <h4 className="text-sm font-medium text-cro-soft-black-700">Select a meeting to auto-populate details:</h4>
                {events.map((event) => {
                  const { date, time } = formatDateTime(event.start.dateTime);
                  const duration = getDurationMinutes(event.start.dateTime, event.end.dateTime);
                  const isExpanded = expandedEvent === event.id;

                  return (
                    <div
                      key={event.id}
                      className="border border-cro-plat-200 rounded-lg p-3 bg-white hover:bg-cro-plat-50 transition-colors"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-cro-soft-black-500">
                              <div>{date}</div>
                              <div>{time}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-cro-soft-black-900 truncate text-sm">
                                {event.summary}
                              </h5>
                              <div className="flex items-center gap-3 text-xs text-cro-soft-black-500">
                                <span>{duration} min</span>
                                <span>{event.attendees.length} attendees</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadMeetingDetails(event);
                            }}
                            className="px-3 py-1 bg-cro-green-600 text-white rounded-lg text-xs font-medium hover:bg-cro-green-700 transition-colors"
                          >
                            Load Details
                          </button>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-cro-soft-black-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-cro-soft-black-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-cro-plat-200 text-xs text-cro-soft-black-600">
                          {event.description && (
                            <div className="mb-2">
                              <strong>Description:</strong> {event.description}
                            </div>
                          )}
                          <div>
                            <strong>Attendees:</strong> {event.attendees.slice(0, 3).map(a => a.displayName || a.email).join(', ')}
                            {event.attendees.length > 3 && ` +${event.attendees.length - 3} more`}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Company Information */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Building2 className="inline w-4 h-4 mr-1 text-cro-green-600" />
            Target Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Acme Corp"
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
            required
          />

          {/* Company Research Section */}
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={handleResearchCompany}
                disabled={!formData.company || formData.attendees.length === 0 || !formData.attendees[0].email || companyResearchStatus === 'researching'}
                className="flex items-center gap-2 px-4 py-2 bg-cro-purple-600 text-white rounded-xl text-sm font-medium hover:bg-cro-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {companyResearchStatus === 'researching' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {companyResearchStatus === 'researching' ? 'Researching...' : 'Research Company'}
              </button>

              {companyResearchStatus === 'completed' && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Research Complete
                </span>
              )}
            </div>

            {/* Company Research Results */}
            {companyResearchStatus === 'completed' && companyResearchData && (
              <div className="border border-cro-plat-300 rounded-xl p-4 bg-cro-plat-50">
                <h4 className="text-sm font-semibold text-cro-soft-black-700 mb-2">Company Research Results</h4>

                {companyResearchData.hubspot ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Found in HubSpot</span>
                    </div>
                    <div className="text-sm text-cro-soft-black-600">
                      <div><strong>Name:</strong> {companyResearchData.hubspot.name}</div>
                      {companyResearchData.hubspot.domain && (
                        <div><strong>Domain:</strong> {companyResearchData.hubspot.domain}</div>
                      )}
                      {companyResearchData.hubspot.industry && (
                        <div><strong>Industry:</strong> {companyResearchData.hubspot.industry}</div>
                      )}
                    </div>
                  </div>
                ) : companyResearchData.pdl ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700">Found via People Data Labs</span>
                    </div>
                    <div className="text-sm text-cro-soft-black-600 mb-3">
                      <div><strong>Name:</strong> {companyResearchData.pdl.name}</div>
                      <div><strong>Domain:</strong> {companyResearchData.domain}</div>
                      {companyResearchData.pdl.industry && (
                        <div><strong>Industry:</strong> {companyResearchData.pdl.industry}</div>
                      )}
                      {companyResearchData.pdl.employee_count && (
                        <div><strong>Employees:</strong> {companyResearchData.pdl.employee_count}</div>
                      )}
                      {companyResearchData.pdl.summary && (
                        <div><strong>Description:</strong> {companyResearchData.pdl.summary}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCompanyToHubSpot}
                      disabled={addCompanyToHubSpotMutation.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 bg-cro-green-600 text-white rounded-lg text-xs font-medium hover:bg-cro-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addCompanyToHubSpotMutation.isPending ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      {addCompanyToHubSpotMutation.isPending ? 'Adding...' : 'Add to HubSpot'}
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-cro-soft-black-600">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-700 font-medium">No company data found</span>
                    </div>
                    <div>Company not found in HubSpot or People Data Labs for domain: {companyResearchData.domain}</div>
                  </div>
                )}
              </div>
            )}

            {companyResearchStatus === 'error' && (
              <div className="border border-red-300 rounded-xl p-3 bg-red-50 text-sm text-red-600">
                Error researching company. Please try again.
              </div>
            )}
          </div>
        </div>

        {/* Meeting Attendees */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-cro-soft-black-700">
              <Users className="inline w-4 h-4 mr-1 text-cro-blue-700" />
              Meeting Attendees
            </label>
            <button
              type="button"
              onClick={addAttendee}
              className="flex items-center px-3 py-1 text-sm bg-cro-blue-100 text-cro-blue-700 rounded-lg hover:bg-cro-blue-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Attendee
            </button>
          </div>

          {/* Step 1: Individual Research */}
          <div className="mb-4 p-4 bg-gradient-to-r from-cro-purple-50 to-cro-blue-50 rounded-2xl border-2 border-cro-purple-200">
            <div>
              <h4 className="text-sm font-semibold text-cro-purple-700 mb-1">
                Step 1: Research Attendees Individually
              </h4>
              <p className="text-xs text-cro-soft-black-600">
                Enter company name and attendee details below. Click the "Research" button next to each attendee to auto-populate their information from HubSpot and the web.
              </p>
              {hasResearchedAttendees && (
                <div className="mt-2 flex items-center text-xs text-cro-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Some attendees researched! HubSpot data has been auto-populated where available.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {formData.attendees.map((attendee, index) => (
              <div
                key={attendee.id}
                className="border border-cro-plat-300 rounded-2xl p-4 bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-cro-soft-black-700">
                      Attendee {index + 1}
                    </h4>
                    {getAttendeeStatus(attendee.id) === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-cro-green-600" />
                    )}
                    {getAttendeeStatus(attendee.id) === 'researching' && <LoadingSpinner size="sm" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Individual Research Button */}
                    {!shouldResearchAttendee(attendee) ? (
                      <span className="flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-cro-green-100 text-cro-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        You (no research needed)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResearchSingleAttendee(attendee.id)}
                        disabled={!canResearchAttendee(attendee) || getAttendeeStatus(attendee.id) === 'researching'}
                        className={clsx(
                          'flex items-center px-2 py-1 rounded-lg text-xs font-medium transition-all',
                          !canResearchAttendee(attendee) || getAttendeeStatus(attendee.id) === 'researching'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : getAttendeeStatus(attendee.id) === 'completed'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        )}
                        title={
                          !canResearchAttendee(attendee)
                            ? 'Enter company name and attendee name to research'
                            : getAttendeeStatus(attendee.id) === 'completed'
                              ? 'Re-research this attendee'
                              : 'Research this attendee'
                        }
                      >
                      {getAttendeeStatus(attendee.id) === 'researching' ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-1">Researching</span>
                        </>
                      ) : getAttendeeStatus(attendee.id) === 'completed' ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Re-research
                        </>
                      ) : (
                        <>
                          <Search className="w-3 h-3 mr-1" />
                          Research
                        </>
                      )}
                    </button>
                    )}
                    {formData.attendees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAttendee(attendee.id)}
                        className="text-cro-red-600 hover:text-cro-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={attendee.name}
                      onChange={(e) => updateAttendee(attendee.id, 'name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={attendee.title || ''}
                      onChange={(e) => updateAttendee(attendee.id, 'title', e.target.value)}
                      placeholder="VP of Marketing"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={attendee.company || ''}
                      onChange={(e) => updateAttendee(attendee.id, 'company', e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={attendee.email || ''}
                      onChange={(e) => updateAttendee(attendee.id, 'email', e.target.value)}
                      placeholder="john@company.com"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      value={attendee.linkedinUrl || ''}
                      onChange={(e) => updateAttendee(attendee.id, 'linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/john-doe"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Research Results & HubSpot Status */}
                {getAttendeeStatus(attendee.id) === 'completed' && (
                  <div className="mt-3 space-y-2">
                    {/* HubSpot Status */}
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getAttendeeData(attendee.id)?.hubspotData
                            ? 'bg-cro-green-100 text-cro-green-800'
                            : 'bg-cro-yellow-100 text-cro-yellow-800'
                        )}
                      >
                        {getAttendeeData(attendee.id)?.hubspotData
                          ? '✓ Found in HubSpot'
                          : '⚠ Not in HubSpot'}
                      </span>
                      {!getAttendeeData(attendee.id)?.hubspotData && attendee.email && (
                        <button
                          type="button"
                          onClick={() => handleAddToHubSpot(attendee.id)}
                          className="text-xs px-3 py-1 bg-cro-blue-700 text-white rounded-full hover:bg-cro-blue-800 transition-colors"
                        >
                          Add to HubSpot
                        </button>
                      )}
                    </div>

                    {/* Research Summary */}
                    {getAttendeeData(attendee.id)?.searchResults && (
                      <div className="text-xs text-gray-600">
                        ✓ Found {getAttendeeData(attendee.id).searchResults.length} research results
                        {getAttendeeData(attendee.id)?.linkedinUrl && ' • LinkedIn profile found'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Purpose */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Target className="inline w-4 h-4 mr-1 text-cro-yellow-600" />
            Meeting Purpose <span className="text-cro-soft-black-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.purpose || ''}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="Discovery call, demo, contract negotiation..."
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
          />
        </div>

        {/* Additional Context */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            Additional Context{' '}
            <span className="text-cro-soft-black-500 font-normal">(Optional)</span>
          </label>
          <textarea
            value={formData.additionalContext || ''}
            onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
            rows={3}
            placeholder="Any additional context about the meeting, company, or specific topics to focus on..."
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors resize-none"
          />
        </div>

        {/* Step 2: Generate Report */}
        <div className="mb-4 p-4 bg-gradient-to-r from-cro-blue-50 to-cro-green-50 rounded-2xl border-2 border-cro-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-cro-blue-700 mb-1">
                Step 2: Generate Intelligence Report
              </h4>
              <p className="text-xs text-cro-soft-black-600">
                {canGenerateReport
                  ? 'All required attendees researched! Click to generate your comprehensive BD intelligence report.'
                  : 'Research the external attendees using the buttons above, then generate your report.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={!canGenerateReport || generateMutation.isPending}
              className={clsx(
                'flex items-center px-4 py-2 rounded-xl font-medium text-white transition-all',
                'shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cro-blue-700',
                !canGenerateReport || generateMutation.isPending
                  ? 'bg-cro-plat-300 cursor-not-allowed'
                  : 'bg-cro-blue-700 hover:bg-cro-blue-800'
              )}
            >
              {generateMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {hasResearchedAttendees && !canGenerateReport && (
          <div className="text-center text-sm text-cro-soft-black-600">
            Complete research for all external attendees to generate the full intelligence report
          </div>
        )}
      </div>

      {/* Error Display */}
      {(singleResearchMutation.isError || generateMutation.isError) && (
        <ErrorMessage
          message={
            singleResearchMutation.error?.message ||
            generateMutation.error?.message ||
            'An error occurred'
          }
          onClose={() => {
            singleResearchMutation.reset();
            generateMutation.reset();
          }}
        />
      )}

      {/* Results Display */}
      {generateMutation.isSuccess && generateMutation.data && (
        <div className="mt-8 bg-white rounded-2xl border border-cro-plat-300 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-cro-purple-400 to-cro-blue-100 bg-opacity-30 p-6 border-b border-cro-plat-300">
            <h3 className="text-2xl font-bold text-cro-soft-black-700 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-cro-blue-700" />
              BD Intelligence Report
            </h3>
            <p className="text-cro-soft-black-600 mt-2">
              Meeting preparation for {formData.company}
            </p>
          </div>
          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-cro-blue-100 rounded-xl p-4">
                <p className="text-sm text-cro-blue-700 font-medium">Company</p>
                <p className="text-lg font-bold text-cro-soft-black-700">{formData.company}</p>
              </div>
              <div className="bg-cro-green-100 rounded-xl p-4">
                <p className="text-sm text-cro-green-700 font-medium">Attendees</p>
                <p className="text-lg font-bold text-cro-soft-black-700">
                  {formData.attendees.length}
                </p>
              </div>
              <div className="bg-cro-yellow-100 rounded-xl p-4">
                <p className="text-sm text-cro-yellow-700 font-medium">Sources</p>
                <p className="text-lg font-bold text-cro-soft-black-700">
                  {generateMutation.data?.data?.metadata?.sourcesCount || 0}
                </p>
              </div>
            </div>

            {/* Intelligence Report Content */}
            <div className="bg-cro-plat-100 rounded-2xl p-6">
              <button
                onClick={() => {
                  const report = generateMutation.data?.data?.report;
                  if (!report) return;

                  const content =
                    `# BD Intelligence Report - ${formData.company}\n\n` +
                    `## Executive Summary\n${report.executiveSummary}\n\n` +
                    `## Target Company Intelligence\n${report.targetCompanyIntelligence}\n\n` +
                    `## Meeting Attendee Analysis\n${report.meetingAttendeeAnalysis}\n\n` +
                    `## Strategic Opportunity Assessment\n${report.strategicOpportunityAssessment}\n\n` +
                    `## Meeting Dynamics Strategy\n${report.meetingDynamicsStrategy}\n\n` +
                    `## Key Questions\n${report.keyQuestions?.map((q: string) => `- ${q}`).join('\n') || ''}\n\n` +
                    `## Potential Objections & Responses\n${report.potentialObjectionsResponses}`;
                  navigator.clipboard.writeText(content);
                  alert('Intelligence report copied to clipboard!');
                }}
                className="mb-6 px-4 py-2 bg-cro-green-600 text-white rounded-xl hover:bg-cro-green-700 transition-colors text-sm font-medium"
              >
                Copy Report to Clipboard
              </button>

              {generateMutation.data?.data?.report && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">
                      Executive Summary
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-cro-purple-700 leading-relaxed">
                        <ReactMarkdown>
                          {generateMutation.data?.data?.report?.executiveSummary || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Target Company Intelligence */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3 flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-cro-green-600" />
                      Target Company Intelligence
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-cro-purple-700 leading-relaxed">
                        <ReactMarkdown>
                          {generateMutation.data?.data?.report?.targetCompanyIntelligence}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Attendee Analysis */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-cro-blue-700" />
                      Meeting Attendee Analysis
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-cro-purple-700 leading-relaxed">
                        <ReactMarkdown>
                          {generateMutation.data?.data?.report?.meetingAttendeeAnalysis}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Opportunity Assessment */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">
                      Strategic Opportunity Assessment
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-cro-purple-700 leading-relaxed">
                        <ReactMarkdown>
                          {generateMutation.data?.data?.report?.strategicOpportunityAssessment}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Key Questions */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">
                      Key Questions to Ask
                    </h4>
                    <ul className="space-y-2">
                      {generateMutation.data?.data?.report?.keyQuestions?.map(
                        (question: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-cro-blue-600 mr-2">•</span>
                            <span className="text-cro-purple-700">{question}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Meeting Dynamics Strategy */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">
                      Meeting Dynamics Strategy
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-cro-purple-700 leading-relaxed">
                        <ReactMarkdown>
                          {generateMutation.data?.data?.report?.meetingDynamicsStrategy}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="bg-white rounded-xl p-4 border border-cro-plat-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-cro-soft-black-700">
                        Research Confidence
                      </span>
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-cro-plat-200 rounded-full mr-2">
                          <div
                            className="h-full bg-cro-green-500 rounded-full"
                            style={{
                              width: `${(generateMutation.data?.data?.report?.confidence || 0) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-cro-soft-black-700">
                          {Math.round((generateMutation.data?.data?.report?.confidence || 0) * 100)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add to HubSpot Section */}
          </div>
        </div>
      )}
    </div>
  );
}
