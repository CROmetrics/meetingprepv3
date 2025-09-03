import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Users, Building2, Target, Hash, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { BDMeetingFormData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useDebounce } from '../../hooks/useDebounce';
import ReactMarkdown from 'react-markdown';

export default function BDMeetingForm() {
  const [formData, setFormData] = useLocalStorage<BDMeetingFormData>('bdMeetingForm', {
    name: '',
    email: '',
    company: '',
    role: '',
    notes: '',
    dealId: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Search HubSpot deals
  React.useEffect(() => {
    if (debouncedSearchTerm.length >= 3) {
      setIsSearching(true);
      api.searchHubspotDeals(debouncedSearchTerm)
        .then((response) => {
          setSearchResults(response.data.results || []);
        })
        .catch((error) => {
          console.error('Search failed:', error);
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  // Generate BD prep mutation
  const generateMutation = useMutation({
    mutationFn: (data: BDMeetingFormData) => api.generateBDPrep(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(formData);
  };

  const selectDeal = (deal: any) => {
    setFormData({
      ...formData,
      dealId: deal.id,
      company: deal.properties.dealname || '',
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
              <Users className="inline w-4 h-4 mr-1 text-cro-blue-700" />
              Contact Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@company.com"
              className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
              required
            />
          </div>
        </div>

        {/* Company & Role */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
              <Building2 className="inline w-4 h-4 mr-1 text-cro-green-600" />
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Corp"
              className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
              Role/Title
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="VP of Marketing"
              className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
            />
          </div>
        </div>

        {/* HubSpot Deal Search */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Hash className="inline w-4 h-4 mr-1 text-cro-purple-700" />
            HubSpot Deal <span className="text-cro-purple-700 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a deal..."
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
          />
          
          {/* Search Results Dropdown */}
          {(isSearching || searchResults.length > 0) && (
            <div className="mt-2 bg-white border border-cro-plat-300 rounded-xl shadow-md max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <LoadingSpinner size="sm" message="Searching deals..." />
                </div>
              ) : (
                searchResults.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    onClick={() => selectDeal(deal)}
                    className="w-full px-4 py-3 text-left hover:bg-cro-blue-100 transition-colors border-b border-cro-plat-100 last:border-b-0"
                  >
                    <div className="font-medium text-cro-soft-black-700">
                      {deal.properties.dealname}
                    </div>
                    <div className="text-sm text-cro-purple-700">
                      Stage: {deal.properties.dealstage} | Amount: ${deal.properties.amount || 0}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {formData.dealId && (
            <div className="mt-2 p-3 bg-cro-green-100 rounded-xl">
              <p className="text-sm text-cro-green-700 font-medium">
                ✓ Deal Selected: {formData.company}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Target className="inline w-4 h-4 mr-1 text-cro-yellow-600" />
            Meeting Notes & Context
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder="Key topics to discuss, background information, specific goals..."
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={generateMutation.isPending}
          className={clsx(
            'w-full flex items-center justify-center px-6 py-3 rounded-2xl font-medium text-white transition-all',
            'shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cro-blue-700',
            generateMutation.isPending
              ? 'bg-cro-plat-300 cursor-not-allowed'
              : 'bg-cro-blue-700 hover:bg-cro-blue-800'
          )}
        >
          {generateMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Preparing Meeting Intel...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate BD Prep
            </>
          )}
        </button>
      </form>

      {/* Error Display */}
      {generateMutation.isError && (
        <ErrorMessage
          message={generateMutation.error?.message || 'Failed to generate BD prep'}
          onClose={() => generateMutation.reset()}
        />
      )}

      {/* Results Display */}
      {generateMutation.isSuccess && generateMutation.data && (
        <div className="mt-8 bg-white rounded-2xl border border-cro-plat-300 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-cro-purple-400 to-cro-blue-100 bg-opacity-30 p-6 border-b border-cro-plat-300">
            <h3 className="text-2xl font-bold text-cro-soft-black-700 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-cro-blue-700" />
              BD Meeting Preparation Complete
            </h3>
          </div>
          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-cro-blue-100 rounded-xl p-4">
                <p className="text-sm text-cro-blue-700 font-medium">Contact</p>
                <p className="text-lg font-bold text-cro-soft-black-700">{formData.name}</p>
              </div>
              <div className="bg-cro-green-100 rounded-xl p-4">
                <p className="text-sm text-cro-green-700 font-medium">Company</p>
                <p className="text-lg font-bold text-cro-soft-black-700">{formData.company}</p>
              </div>
              <div className="bg-cro-yellow-100 rounded-xl p-4">
                <p className="text-sm text-cro-yellow-700 font-medium">Status</p>
                <p className="text-lg font-bold text-cro-soft-black-700">Ready</p>
              </div>
            </div>

            {/* Prep Content */}
            <div className="bg-cro-plat-100 rounded-2xl p-6">
              <button
                onClick={() => {
                  const content = generateMutation.data.data.companyResearch + '\n\n' + 
                                 generateMutation.data.data.executiveProfile + '\n\n' + 
                                 generateMutation.data.data.talkingPoints;
                  navigator.clipboard.writeText(content);
                  alert('BD prep copied to clipboard!');
                }}
                className="mb-4 px-4 py-2 bg-cro-green-600 text-white rounded-xl hover:bg-cro-green-700 transition-colors text-sm font-medium"
              >
                Copy All to Clipboard
              </button>

              {/* Company Research */}
              <div className="mb-8">
                <h4 className="text-xl font-bold text-cro-soft-black-700 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-cro-green-600" />
                  Company Research
                </h4>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="text-cro-purple-700 mb-3 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                      li: ({children}) => <li className="text-cro-purple-700">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-cro-soft-black-700">{children}</strong>,
                    }}
                  >
                    {generateMutation.data.data.companyResearch}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Executive Profile */}
              <div className="mb-8">
                <h4 className="text-xl font-bold text-cro-soft-black-700 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-cro-blue-700" />
                  Executive Profile
                </h4>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="text-cro-purple-700 mb-3 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                      li: ({children}) => <li className="text-cro-purple-700">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-cro-soft-black-700">{children}</strong>,
                    }}
                  >
                    {generateMutation.data.data.executiveProfile}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Talking Points */}
              <div>
                <h4 className="text-xl font-bold text-cro-soft-black-700 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-cro-yellow-600" />
                  Strategic Talking Points
                </h4>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="text-cro-purple-700 mb-3 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                      li: ({children}) => <li className="text-cro-purple-700">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-cro-soft-black-700">{children}</strong>,
                    }}
                  >
                    {generateMutation.data.data.talkingPoints}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* HubSpot Update Status */}
            {generateMutation.data.data.hubspotUpdated && (
              <div className="mt-4 p-4 bg-cro-green-100 rounded-xl">
                <p className="text-cro-green-700 font-medium">
                  ✓ HubSpot deal has been updated with meeting notes
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}