import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainTabs } from './components/common/MainTabs';
import { Briefcase, Sparkles } from 'lucide-react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-cro-plat-100">
        {/* Header */}
        <header className="bg-white border-b border-cro-plat-300 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6">
            <div className="flex items-center h-16">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-8 w-8 text-cro-blue-700" />
                <h1 className="text-2xl font-bold text-cro-soft-black-700">
                  Meeting Prepper
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-cro-blue-100 via-white to-cro-green-100 py-12">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block px-4 py-2 bg-cro-yellow-100 text-cro-yellow-700 rounded-xl text-sm font-medium mb-4">
                AI-Powered Intelligence
              </span>
              <h2 className="text-4xl font-bold text-cro-soft-black-700 mb-4">
                Executive Meeting Preparation
              </h2>
              <p className="text-lg text-cro-purple-700 leading-relaxed">
                Connect your calendar, research attendees, and generate comprehensive intelligence
                reports for your meetings. Optimized for mobile executives.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          <MainTabs />
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
    </QueryClientProvider>
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

export default App;
