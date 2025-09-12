import { useState, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CompanyInsight, HubSpotContact } from '../../types';
import apiService from '../../services/api';

interface CompanyDataPreviewProps {
  companyId: string;
  isVisible: boolean;
  onToggle: () => void;
  onDataLoad?: (data: CompanyInsight) => void;
}

export function CompanyDataPreview({ 
  companyId, 
  isVisible, 
  onToggle, 
  onDataLoad 
}: CompanyDataPreviewProps) {
  const [insights, setInsights] = useState<CompanyInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    company: true,
    stakeholders: false,
    contacts: false,
    deals: false,
  });

  useEffect(() => {
    if (isVisible && companyId && !insights) {
      loadCompanyInsights();
    }
  }, [isVisible, companyId]);

  const loadCompanyInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getCompanyInsights(companyId);
      setInsights(response.data!);
      onDataLoad?.(response.data!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company insights');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatContactName = (contact: HubSpotContact) => {
    return `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || 'Unknown Name';
  };

  if (!isVisible) {
    return (
      <div className="border border-cro-plat-300 rounded-xl">
        <button
          onClick={onToggle}
          className="w-full px-4 py-3 text-left bg-cro-plat-50 hover:bg-cro-plat-100 
                   rounded-xl focus:outline-none focus:ring-2 focus:ring-cro-blue-500
                   flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="h-5 w-5 text-cro-blue-600" />
            <span className="font-medium text-cro-soft-black-700">
              View HubSpot Data Preview
            </span>
          </div>
          <ChevronDownIcon className="h-5 w-5 text-cro-purple-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="border border-cro-plat-300 rounded-xl">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 text-left bg-cro-blue-50 hover:bg-cro-blue-100 
                 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-cro-blue-500
                 flex items-center justify-between border-b border-cro-blue-200"
      >
        <div className="flex items-center space-x-2">
          <BuildingOfficeIcon className="h-5 w-5 text-cro-blue-600" />
          <span className="font-medium text-cro-soft-black-700">
            HubSpot Data Preview
          </span>
        </div>
        <ChevronUpIcon className="h-5 w-5 text-cro-purple-500" />
      </button>

      <div className="p-4 max-h-96 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cro-blue-500"></div>
            <span className="ml-3 text-cro-purple-600">Loading company data...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            {/* Company Information */}
            <div className="border border-cro-plat-200 rounded-lg">
              <button
                onClick={() => toggleSection('company')}
                className="w-full px-4 py-3 text-left bg-cro-plat-50 hover:bg-cro-plat-100 
                         rounded-t-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-cro-blue-600" />
                  <span className="font-medium text-cro-soft-black-700">Company Details</span>
                </div>
                {expandedSections.company ? (
                  <ChevronUpIcon className="h-4 w-4 text-cro-purple-500" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-cro-purple-500" />
                )}
              </button>

              {expandedSections.company && (
                <div className="p-4 border-t border-cro-plat-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-cro-soft-black-700">Name:</span>
                      <div className="text-cro-soft-black-600">{insights.company.name || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-cro-soft-black-700">Domain:</span>
                      <div className="text-cro-soft-black-600">{insights.company.domain || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-cro-soft-black-700">Industry:</span>
                      <div className="text-cro-soft-black-600">{insights.company.industry || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-cro-soft-black-700">Employees:</span>
                      <div className="text-cro-soft-black-600">{insights.company.numberofemployees || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-cro-soft-black-700">Revenue:</span>
                      <div className="text-cro-soft-black-600">{insights.company.annualrevenue || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-cro-soft-black-700">Founded:</span>
                      <div className="text-cro-soft-black-600">{insights.company.founded_year || 'N/A'}</div>
                    </div>
                  </div>
                  
                  {insights.company.description && (
                    <div>
                      <span className="font-medium text-cro-soft-black-700">Description:</span>
                      <div className="text-cro-soft-black-600 mt-1 text-sm">
                        {insights.company.description}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Key Stakeholders */}
            {insights.keyStakeholders.length > 0 && (
              <div className="border border-cro-plat-200 rounded-lg">
                <button
                  onClick={() => toggleSection('stakeholders')}
                  className="w-full px-4 py-3 text-left bg-cro-green-50 hover:bg-cro-green-100 
                           rounded-t-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-4 w-4 text-cro-green-600" />
                    <span className="font-medium text-cro-soft-black-700">
                      Key Stakeholders ({insights.keyStakeholders.length})
                    </span>
                  </div>
                  {expandedSections.stakeholders ? (
                    <ChevronUpIcon className="h-4 w-4 text-cro-purple-500" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-cro-purple-500" />
                  )}
                </button>

                {expandedSections.stakeholders && (
                  <div className="p-4 border-t border-cro-green-200 space-y-3">
                    {insights.keyStakeholders.map((contact, index) => (
                      <div key={contact.id || index} className="bg-white rounded border border-cro-plat-200 p-3">
                        <div className="font-medium text-cro-soft-black-700">
                          {formatContactName(contact)}
                        </div>
                        <div className="text-sm text-cro-soft-black-600 mt-1">
                          {contact.jobtitle && <div>Title: {contact.jobtitle}</div>}
                          {contact.email && <div>Email: {contact.email}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Contacts Summary */}
            <div className="border border-cro-plat-200 rounded-lg">
              <button
                onClick={() => toggleSection('contacts')}
                className="w-full px-4 py-3 text-left bg-cro-purple-50 hover:bg-cro-purple-100 
                         rounded-t-lg flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4 text-cro-purple-600" />
                  <span className="font-medium text-cro-soft-black-700">
                    All Contacts ({insights.totalContacts})
                  </span>
                </div>
                {expandedSections.contacts ? (
                  <ChevronUpIcon className="h-4 w-4 text-cro-purple-500" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-cro-purple-500" />
                )}
              </button>

              {expandedSections.contacts && (
                <div className="p-4 border-t border-cro-purple-200 space-y-2">
                  {insights.relatedContacts.slice(0, 10).map((contact, index) => (
                    <div key={contact.id || index} className="flex justify-between items-center text-sm py-1">
                      <span className="text-cro-soft-black-700 font-medium">
                        {formatContactName(contact)}
                      </span>
                      <span className="text-cro-soft-black-600">
                        {contact.jobtitle || 'No title'}
                      </span>
                    </div>
                  ))}
                  {insights.relatedContacts.length > 10 && (
                    <div className="text-sm text-cro-purple-600 italic">
                      ... and {insights.relatedContacts.length - 10} more contacts
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Deals */}
            {insights.recentDeals.length > 0 && (
              <div className="border border-cro-plat-200 rounded-lg">
                <button
                  onClick={() => toggleSection('deals')}
                  className="w-full px-4 py-3 text-left bg-cro-yellow-50 hover:bg-cro-yellow-100 
                           rounded-t-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-cro-yellow-600" />
                    <span className="font-medium text-cro-soft-black-700">
                      Recent Deals ({insights.recentDeals.length})
                    </span>
                  </div>
                  {expandedSections.deals ? (
                    <ChevronUpIcon className="h-4 w-4 text-cro-purple-500" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-cro-purple-500" />
                  )}
                </button>

                {expandedSections.deals && (
                  <div className="p-4 border-t border-cro-yellow-200 space-y-3">
                    {insights.recentDeals.map((deal, index) => (
                      <div key={(deal as any).properties?.hs_object_id || index} className="bg-white rounded border border-cro-plat-200 p-3">
                        <div className="font-medium text-cro-soft-black-700">
                          {(deal as any).properties?.dealname || 'Unnamed Deal'}
                        </div>
                        <div className="text-sm text-cro-soft-black-600 mt-1 space-y-1">
                          <div>Amount: {(deal as any).properties?.amount || 'N/A'}</div>
                          <div>Stage: {(deal as any).properties?.dealstage || 'N/A'}</div>
                          <div>Close Date: {(deal as any).properties?.closedate || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {insights && (
          <div className="mt-4 p-3 bg-cro-blue-50 rounded-lg text-sm text-cro-blue-700">
            <strong>Data Summary:</strong> This information will be sent to the AI along with your custom prompt 
            to generate the company research report.
          </div>
        )}
      </div>
    </div>
  );
}