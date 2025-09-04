import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MeetingBriefForm from './components/forms/MeetingBriefForm';
import BDMeetingForm from './components/forms/BDMeetingForm';
import { Briefcase, Users, Sparkles } from 'lucide-react';

const queryClient = new QueryClient();

type Tab = 'meeting' | 'bd';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('meeting');

  const handleTabChange = (tab: Tab) => {
    console.log('Tab clicked:', tab, 'Current tab:', activeTab);
    setActiveTab(tab);
    console.log('Tab state should change to:', tab);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-cro-plat-100">
        {/* Navbar */}
        <nav className="bg-white border-b border-cro-plat-300 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-cro-blue-700" />
                <h1 className="text-2xl font-bold text-cro-soft-black-700">CroMetrics AI Suite</h1>
              </div>
              <div className="flex items-center space-x-1 bg-cro-plat-100 rounded-2xl p-1">
                <TabButton
                  active={activeTab === 'meeting'}
                  onClick={() => handleTabChange('meeting')}
                  icon={<Users className="h-4 w-4" />}
                  label="Meeting Brief"
                />
                <TabButton
                  active={activeTab === 'bd'}
                  onClick={() => handleTabChange('bd')}
                  icon={<Briefcase className="h-4 w-4" />}
                  label="BD Prep"
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-cro-blue-100 via-white to-cro-green-100 py-12">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block px-4 py-2 bg-cro-yellow-100 text-cro-yellow-700 rounded-xl text-sm font-medium mb-4">
                AI-Powered Tools
              </span>
              <h2 className="text-4xl font-bold text-cro-soft-black-700 mb-4">
                {activeTab === 'meeting' ? 'Meeting Brief Generator' : 'BD Meeting Preparation'}
                <span className="block text-sm text-gray-500 mt-1">Active Tab: {activeTab}</span>
              </h2>
              <p className="text-lg text-cro-purple-700 leading-relaxed">
                {activeTab === 'meeting'
                  ? 'Leverage AI to research attendees, companies, and generate comprehensive meeting briefs with strategic insights.'
                  : 'Prepare for business development meetings with AI-powered research on prospects and automated CRM updates.'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-cro-plat-300 overflow-hidden">
            <div className="p-8">
              {activeTab === 'meeting' ? <MeetingBriefForm /> : <BDMeetingForm />}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Users className="h-6 w-6 text-cro-blue-700" />}
              title="Attendee Research"
              description="Deep dive into professional backgrounds and recent activities"
              color="blue"
            />
            <FeatureCard
              icon={<Briefcase className="h-6 w-6 text-cro-green-600" />}
              title="Company Analysis"
              description="Comprehensive insights into company strategy and initiatives"
              color="green"
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6 text-cro-purple-700" />}
              title="AI Recommendations"
              description="Strategic talking points and meeting objectives"
              color="purple"
            />
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all
        ${
          active
            ? 'bg-cro-blue-700 text-white shadow-sm'
            : 'bg-transparent text-cro-purple-700 hover:bg-cro-plat-100'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
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
