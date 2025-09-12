import React, { useState } from 'react';
import { CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import BDMeetingForm from '../forms/BDMeetingForm';
import { CalendarMeetingForm } from '../forms/CalendarMeetingForm';
import { MobileBriefView } from './MobileBriefView';
import { calendarApi, MeetingBriefResponse } from '../../services/calendar.api';

type TabType = 'calendar' | 'bd';

interface MainTabsProps {}

export const MainTabs: React.FC<MainTabsProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [briefData, setBriefData] = useState<MeetingBriefResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCalendarBrief = async (eventId: string, options: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const tokens = calendarApi.getStoredTokens();
      if (!tokens) {
        throw new Error('No calendar tokens found. Please reconnect your calendar.');
      }

      const response = await calendarApi.generateMeetingBrief(eventId, tokens, {
        include_pdl_enrichment: options.include_pdl_enrichment,
        include_company_insights: options.include_company_insights,
      });

      setBriefData(response);
    } catch (error) {
      console.error('Error generating calendar brief:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate meeting brief');
    } finally {
      setLoading(false);
    }
  };

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

  const tabs = [
    {
      id: 'calendar' as TabType,
      label: 'Calendar Meetings',
      icon: CalendarIcon,
      description: 'Generate briefs from Google Calendar events'
    },
    {
      id: 'bd' as TabType,
      label: 'Manual Research',
      icon: UserGroupIcon,
      description: 'Research prospects and companies manually'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon 
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `} 
                />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400 hidden sm:block">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

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

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === 'calendar' && (
          <CalendarMeetingForm 
            onGenerateBrief={handleGenerateCalendarBrief}
            loading={loading}
          />
        )}
        
        {activeTab === 'bd' && (
          <div className="p-6">
            <BDMeetingForm />
          </div>
        )}
      </div>
    </div>
  );
};