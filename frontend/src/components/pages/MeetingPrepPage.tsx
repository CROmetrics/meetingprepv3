import { useState } from 'react';
import { CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Sparkles, Briefcase } from 'lucide-react';
import BDMeetingForm from '../forms/BDMeetingForm';
import { CalendarMeetingForm } from '../forms/CalendarMeetingForm';
import { MobileBriefView } from '../common/MobileBriefView';
import { MeetingBriefResponse } from '../../services/calendar.api';

type TabType = 'calendar' | 'bd';

export function MeetingPrepPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
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
              Connect your calendar, research attendees, and generate comprehensive intelligence
              reports for your meetings. Optimized for mobile executives.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
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
              <CalendarMeetingForm />
            )}
            
            {activeTab === 'bd' && (
              <div className="p-6">
                <BDMeetingForm />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<CalendarIcon className="h-6 w-6 text-cro-blue-700" />}
            title="Calendar Integration"
            description="Connect Google Calendar to automatically research meeting attendees and generate mobile-optimized briefs"
            color="blue"
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6 text-cro-green-600" />}
            title="AI-Powered Research"
            description="LinkedIn profiles, company insights, and People Data Labs enrichment for comprehensive attendee intelligence"
            color="green"
          />
          <FeatureCard
            icon={<Briefcase className="h-6 w-6 text-cro-purple-700" />}
            title="Mobile Executive Brief"
            description="Executive briefings optimized for mobile viewing with collapsible sections and key insights"
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple';
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  const bgColors = {
    blue: 'bg-cro-blue-100',
    green: 'bg-cro-green-100',
    purple: 'bg-cro-plat-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-cro-plat-300 p-6 hover:shadow-md transition-shadow">
      <div className={`inline-flex p-3 ${bgColors[color]} rounded-xl mb-4`}>{icon}</div>
      <h3 className="text-lg font-semibold text-cro-soft-black-700 mb-2">{title}</h3>
      <p className="text-cro-purple-700">{description}</p>
    </div>
  );
}