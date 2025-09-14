import { useState } from 'react';
import BDMeetingForm from '../forms/BDMeetingForm';
import { MobileBriefView } from '../common/MobileBriefView';
import { MeetingBriefResponse } from '../../services/calendar.api';

export function MeetingPrepPage() {
  const [briefData, setBriefData] = useState<MeetingBriefResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCloseBrief = () => {
    setBriefData(null);
    setError(null);
  };

  // If showing brief, render the mobile view
  if (briefData) {
    return (
      <MobileBriefView
        briefData={briefData}
        onClose={handleCloseBrief}
      />
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cro-blue-100 via-white to-cro-green-100 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-cro-yellow-100 text-cro-yellow-700 rounded-xl text-sm font-medium mb-4">
              AI-Powered Intelligence
            </span>
            <h1 className="text-4xl font-bold text-cro-soft-black-700 mb-4">
              Executive Meeting Preparation
            </h1>
            <p className="text-lg text-cro-purple-700 leading-relaxed">
              Research meeting attendees and companies to generate comprehensive intelligence
              reports. Optionally connect your calendar to automatically populate meeting details.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Error</h3>
                  <div className="mt-1 text-sm">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Unified Research Interface */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <BDMeetingForm />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

