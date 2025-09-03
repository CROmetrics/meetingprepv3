import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileText, Briefcase, BarChart3, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { MeetingBriefForm } from './components/forms/MeetingBriefForm';
import { BDMeetingForm } from './components/forms/BDMeetingForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type TabType = 'internal' | 'bd' | 'analytics' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('internal');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  CroMetrics Meeting Intelligence
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                Executive Meeting Brief Generator
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('internal')}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center',
                  activeTab === 'internal'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <FileText className="w-4 h-4 mr-2" />
                Internal Meetings
              </button>
              <button
                onClick={() => setActiveTab('bd')}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center',
                  activeTab === 'bd'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Business Development
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center',
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={clsx(
                  'py-4 px-1 border-b-2 font-medium text-sm flex items-center',
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="py-8">
          {activeTab === 'internal' && <MeetingBriefForm />}
          {activeTab === 'bd' && <BDMeetingForm />}
          {activeTab === 'analytics' && (
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Usage Analytics</h2>
                <p className="text-gray-600">Analytics dashboard coming soon...</p>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">API Configuration</h3>
                    <p className="text-sm text-gray-600">
                      Configure your API keys in the backend .env file
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Model Settings</h3>
                    <p className="text-sm text-gray-600">
                      Current model: GPT-4 Turbo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;