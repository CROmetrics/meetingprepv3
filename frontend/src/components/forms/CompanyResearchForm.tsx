import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  CheckIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  UsersIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { HubSpotCompany } from '../../types';
import apiService from '../../services/api';

interface CompanyResearchData {
  hubspot: HubSpotCompany | null;
  pdl: any | null;
  source: string;
  domain: string;
  searchQuery: string;
}

interface CompanyResearchFormProps {
  onCompanySelect: (company: HubSpotCompany) => void;
  isLoading?: boolean;
}

export function CompanyResearchForm({ onCompanySelect, isLoading = false }: CompanyResearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingToHubSpot, setIsAddingToHubSpot] = useState(false);
  const [searchResults, setSearchResults] = useState<CompanyResearchData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a company domain or name');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccess(null);
    setSearchResults(null);

    try {
      // Determine if it's a domain or company name
      const isDomain = searchQuery.includes('.');
      const domain = isDomain ? searchQuery.trim() : `${searchQuery.trim().toLowerCase().replace(/\s+/g, '')}.com`;
      const companyNameParam = companyName.trim() || (isDomain ? undefined : searchQuery.trim());

      const response = await apiService.researchCompany(domain, companyNameParam);

      if (response.data) {
        setSearchResults(response.data);

        // If found in HubSpot, automatically select it
        if (response.data.source === 'hubspot' && response.data.hubspot) {
          onCompanySelect(response.data.hubspot);
        }
      } else {
        setError('No data received from search');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToHubSpot = async () => {
    if (!searchResults?.pdl) return;

    setIsAddingToHubSpot(true);
    setError(null);

    try {
      const pdlData = searchResults.pdl;
      const companyData = {
        name: pdlData.name || companyName || searchQuery,
        domain: searchResults.domain,
        industry: pdlData.industry || undefined,
        description: pdlData.summary || undefined,
        website: pdlData.website || `https://${searchResults.domain}`,
        numberofemployees: pdlData.size || undefined,
        city: pdlData.location?.locality || undefined,
        state: pdlData.location?.region || undefined,
        country: pdlData.location?.country || undefined,
        founded_year: pdlData.founded ? new Date(pdlData.founded).getFullYear().toString() : undefined,
      };

      const response = await apiService.addCompanyToHubSpot(companyData);

      if (response.data) {
        setSuccess(`Successfully added "${response.data.name}" to HubSpot!`);
        onCompanySelect(response.data);
        setSearchResults(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add company to HubSpot');
    } finally {
      setIsAddingToHubSpot(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    setCompanyName('');
    setSearchResults(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white border border-cro-plat-300 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-cro-soft-black-700 mb-4">
          Search for Target Company
        </h3>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="domain-search" className="block text-sm font-medium text-cro-soft-black-700 mb-2">
                Company Domain *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GlobeAltIcon className="h-5 w-5 text-cro-purple-500" />
                </div>
                <input
                  id="domain-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="example.com or company name"
                  disabled={isSearching || isLoading}
                  className="block w-full pl-10 pr-3 py-3 border border-cro-plat-300 rounded-xl
                           bg-white text-cro-soft-black-700 placeholder-cro-purple-500
                           focus:outline-none focus:ring-2 focus:ring-cro-blue-500 focus:border-cro-blue-500
                           disabled:bg-cro-plat-100 disabled:text-cro-purple-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-cro-soft-black-700 mb-2">
                Company Name (optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-cro-purple-500" />
                </div>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company Name Inc."
                  disabled={isSearching || isLoading}
                  className="block w-full pl-10 pr-3 py-3 border border-cro-plat-300 rounded-xl
                           bg-white text-cro-soft-black-700 placeholder-cro-purple-500
                           focus:outline-none focus:ring-2 focus:ring-cro-blue-500 focus:border-cro-blue-500
                           disabled:bg-cro-plat-100 disabled:text-cro-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={isSearching || isLoading || !searchQuery.trim()}
              className="flex items-center px-6 py-3 border border-transparent rounded-xl
                       text-sm font-medium text-white bg-cro-blue-600 hover:bg-cro-blue-700
                       focus:outline-none focus:ring-2 focus:ring-cro-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                  Search Company
                </>
              )}
            </button>

            {searchResults && (
              <button
                type="button"
                onClick={resetSearch}
                className="text-sm text-cro-purple-600 hover:text-cro-purple-800 font-medium"
              >
                New Search
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 text-xs text-cro-purple-600">
          <strong>How it works:</strong> We'll search HubSpot first. If not found, we'll search People Data Labs
          and give you the option to add the company to HubSpot.
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-green-700">{success}</div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white border border-cro-plat-300 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-cro-soft-black-700 mb-4">
            Search Results for "{searchResults.searchQuery}"
          </h3>

          {searchResults.source === 'hubspot' && searchResults.hubspot && (
            <div className="bg-cro-green-50 border border-cro-green-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckIcon className="h-5 w-5 text-cro-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-cro-soft-black-700 text-green-800">
                      ✅ Found in HubSpot
                    </h4>
                    <div className="mt-2">
                      <h5 className="font-semibold text-cro-soft-black-700">
                        {searchResults.hubspot.name}
                      </h5>
                      <div className="text-sm text-cro-soft-black-600 mt-1 space-y-1">
                        {searchResults.hubspot.domain && (
                          <div><span className="font-medium">Domain:</span> {searchResults.hubspot.domain}</div>
                        )}
                        {searchResults.hubspot.industry && (
                          <div><span className="font-medium">Industry:</span> {searchResults.hubspot.industry}</div>
                        )}
                        {searchResults.hubspot.city && searchResults.hubspot.state && (
                          <div><span className="font-medium">Location:</span> {searchResults.hubspot.city}, {searchResults.hubspot.state}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-green-700">
                This company is already in HubSpot and has been selected for research.
              </div>
            </div>
          )}

          {searchResults.source === 'pdl' && searchResults.pdl && (
            <div className="bg-cro-yellow-50 border border-cro-yellow-200 rounded-xl p-4">
              <h4 className="font-semibold text-cro-soft-black-700 text-cro-yellow-800 mb-3">
                📋 Found in People Data Labs (Not in HubSpot)
              </h4>

              <div className="bg-white border border-cro-plat-200 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-cro-soft-black-700 mb-2">
                  {searchResults.pdl.name || companyName || searchQuery}
                </h5>
                <div className="text-sm text-cro-soft-black-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-cro-purple-500" />
                    <span>{searchResults.domain}</span>
                  </div>
                  {searchResults.pdl.industry && (
                    <div><span className="font-medium">Industry:</span> {searchResults.pdl.industry}</div>
                  )}
                  {searchResults.pdl.size && (
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="h-4 w-4 text-cro-purple-500" />
                      <span>{searchResults.pdl.size} employees</span>
                    </div>
                  )}
                  {searchResults.pdl.location && (
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4 text-cro-purple-500" />
                      <span>
                        {[searchResults.pdl.location.locality, searchResults.pdl.location.region, searchResults.pdl.location.country]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {searchResults.pdl.summary && (
                    <div className="mt-2 p-3 bg-cro-plat-50 rounded-lg">
                      <span className="font-medium">Description:</span>
                      <p className="text-xs mt-1">{searchResults.pdl.summary}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleAddToHubSpot}
                disabled={isAddingToHubSpot}
                className="flex items-center px-4 py-2 border border-transparent rounded-lg
                         text-sm font-medium text-white bg-cro-green-600 hover:bg-cro-green-700
                         focus:outline-none focus:ring-2 focus:ring-cro-green-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingToHubSpot ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding to HubSpot...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add to HubSpot & Continue Research
                  </>
                )}
              </button>

              <div className="mt-2 text-xs text-cro-yellow-700">
                This will create a new company record in HubSpot so you can research it.
              </div>
            </div>
          )}

          {searchResults.source === 'none' && (
            <div className="bg-cro-purple-50 border border-cro-purple-200 rounded-xl p-4">
              <div className="text-center py-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-cro-purple-500 mx-auto mb-2" />
                <h4 className="font-semibold text-cro-soft-black-700 mb-2">
                  Company Not Found
                </h4>
                <p className="text-sm text-cro-purple-600">
                  We couldn't find "{searchResults.searchQuery}" in either HubSpot or People Data Labs.
                  Try searching with a different domain or company name.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}