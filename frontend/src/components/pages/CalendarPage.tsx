import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { CalendarMeetingForm } from '../forms/CalendarMeetingForm';
import { calendarApi, CalendarTokens } from '../../services/calendar.api';

export function CalendarPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tokens, setTokens] = useState<CalendarTokens | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if we got OAuth callback parameters
    const status = searchParams.get('status');
    const errorParam = searchParams.get('error');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (status === 'success' && accessToken) {
      setAuthStatus('success');
      const newTokens: CalendarTokens = {
        access_token: accessToken,
        refresh_token: refreshToken || undefined
      };
      setTokens(newTokens);

      // Store tokens for future use
      calendarApi.storeTokens(newTokens);

      // Clean up URL parameters
      navigate('/calendar', { replace: true });
    } else if (status === 'error' || errorParam) {
      setAuthStatus('error');
      setError(errorParam || 'Authentication failed');

      // Clean up URL parameters
      navigate('/calendar', { replace: true });
    } else {
      // Check if we have stored tokens
      const storedTokens = calendarApi.getStoredTokens();
      if (storedTokens) {
        setTokens(storedTokens);
        setAuthStatus('success');
      }
    }
  }, [searchParams, navigate]);

  const handleConnectCalendar = async () => {
    try {
      const { authUrl } = await calendarApi.getAuthUrl();

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      setError('Failed to initiate calendar connection');
      setAuthStatus('error');
    }
  };

  const handleGenerateBrief = async (eventId: string, options: any) => {
    if (!tokens) {
      setError('No authentication tokens available');
      return;
    }

    try {
      const briefData = await calendarApi.generateMeetingBrief(eventId, tokens, options);
      console.log('Meeting brief generated:', briefData);
      // Handle the brief data (could show in a modal or navigate to a results page)
    } catch (error) {
      console.error('Error generating brief:', error);
      setError('Failed to generate meeting brief');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cro-soft-black-800 mb-2">
            Calendar Integration
          </h1>
          <p className="text-lg text-cro-soft-black-600">
            Connect your Google Calendar to automatically generate meeting briefs
          </p>
        </div>

        {/* Authentication Status */}
        {authStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Calendar connected successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>You can now generate meeting briefs from your calendar events.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {authStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Calendar connection failed
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || 'Please try connecting again.'}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleConnectCalendar}
                    className="text-sm bg-red-100 text-red-800 px-3 py-2 rounded hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connect Calendar Button */}
        {authStatus !== 'success' && (
          <div className="mb-8 text-center">
            <button
              onClick={handleConnectCalendar}
              className="bg-cro-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-cro-purple-700 transition-colors"
            >
              Connect Google Calendar
            </button>
          </div>
        )}

        {/* Calendar Meeting Form - only show if authenticated */}
        {authStatus === 'success' && tokens && (
          <CalendarMeetingForm
            onGenerateBrief={handleGenerateBrief}
            accessToken={tokens.access_token}
            refreshToken={tokens.refresh_token}
          />
        )}
      </div>
    </Layout>
  );
}