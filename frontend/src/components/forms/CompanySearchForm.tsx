import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HubSpotCompany } from '../../types';
import apiService from '../../services/api';

interface CompanySearchFormProps {
  onCompanySelect: (company: HubSpotCompany) => void;
  selectedCompany: HubSpotCompany | null;
  isLoading?: boolean;
}

export function CompanySearchForm({
  onCompanySelect,
  selectedCompany,
  isLoading = false,
}: CompanySearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HubSpotCompany[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await apiService.searchCompanies(query);
      setSearchResults(response.data || []);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCompanySelect = (company: HubSpotCompany) => {
    onCompanySelect(company);
    setShowResults(false);
    setSearchQuery(company.name || '');
  };

  const clearSelection = () => {
    onCompanySelect({} as HubSpotCompany);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label
          htmlFor="company-search"
          className="block text-sm font-medium text-cro-soft-black-700 mb-2"
        >
          Search for Company
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-cro-purple-500" />
          </div>

          <input
            id="company-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type company name or domain..."
            disabled={isLoading}
            className="block w-full pl-10 pr-3 py-3 border border-cro-plat-300 rounded-xl
                     bg-white text-cro-soft-black-700 placeholder-cro-purple-500
                     focus:outline-none focus:ring-2 focus:ring-cro-blue-500 focus:border-cro-blue-500
                     disabled:bg-cro-plat-100 disabled:text-cro-purple-500"
          />

          {(isSearching || isLoading) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cro-blue-500"></div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-cro-plat-300 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className="w-full text-left px-4 py-3 bg-white hover:bg-cro-blue-50 focus:bg-cro-blue-50 focus:outline-none
                         border-b border-cro-plat-200 last:border-b-0 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-cro-soft-black-700">
                      {company.name || 'Unnamed Company'}
                    </div>
                    <div className="text-sm text-cro-purple-600 mt-1">
                      {company.domain && <span className="mr-4">{company.domain}</span>}
                      {company.industry && <span className="mr-4">{company.industry}</span>}
                      {company.city && company.state && (
                        <span>
                          {company.city}, {company.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults &&
          searchResults.length === 0 &&
          !isSearching &&
          searchQuery.trim().length >= 2 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-cro-plat-300 rounded-xl shadow-lg p-4">
              <div className="text-center text-cro-purple-600">
                No companies found for "{searchQuery}"
              </div>
            </div>
          )}
      </div>

      {/* Selected Company Display */}
      {selectedCompany && (
        <div className="bg-cro-green-50 border border-cro-green-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <CheckIcon className="h-5 w-5 text-cro-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-cro-soft-black-700">
                  {selectedCompany.name || 'Selected Company'}
                </h3>
                <div className="text-sm text-cro-soft-black-600 mt-1 space-y-1">
                  {selectedCompany.domain && (
                    <div>
                      <span className="font-medium">Domain:</span> {selectedCompany.domain}
                    </div>
                  )}
                  {selectedCompany.industry && (
                    <div>
                      <span className="font-medium">Industry:</span> {selectedCompany.industry}
                    </div>
                  )}
                  {selectedCompany.city && selectedCompany.state && (
                    <div>
                      <span className="font-medium">Location:</span> {selectedCompany.city},{' '}
                      {selectedCompany.state}
                      {selectedCompany.country && `, ${selectedCompany.country}`}
                    </div>
                  )}
                  {selectedCompany.numberofemployees && (
                    <div>
                      <span className="font-medium">Employees:</span>{' '}
                      {selectedCompany.numberofemployees}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="flex-shrink-0 ml-3 text-cro-purple-500 hover:text-cro-purple-700 
                       text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
