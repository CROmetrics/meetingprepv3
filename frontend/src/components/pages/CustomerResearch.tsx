import React, { useState } from 'react';
import { CompanySearchForm } from '../forms/CompanySearchForm';
import { PromptEditor } from '../forms/PromptEditor';
import { CompanyDataPreview } from '../common/CompanyDataPreview';
import { ResearchResults, ResearchError } from '../common/ResearchResults';
import { 
  MagnifyingGlassIcon,
  SparklesIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { HubSpotCompany, CompanyInsight, ResearchReport } from '../../types';
import apiService from '../../services/api';

export function CustomerResearch() {
  const [selectedCompany, setSelectedCompany] = useState<HubSpotCompany | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [companyData, setCompanyData] = useState<CompanyInsight | null>(null);
  const [researchReport, setResearchReport] = useState<ResearchReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);

  const handleCompanySelect = (company: HubSpotCompany) => {
    setSelectedCompany(company);
    setCompanyData(null);
    setResearchReport(null);
    setError(null);
    setShowDataPreview(false);
  };

  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  const handleCompanyDataLoad = (data: CompanyInsight) => {
    setCompanyData(data);
  };

  const generateResearch = async () => {
    if (!selectedCompany || !currentPrompt.trim()) {
      setError('Please select a company and ensure you have a valid prompt configured.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await apiService.generateResearch(selectedCompany.id, currentPrompt);
      setResearchReport(response.data!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate research report');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = selectedCompany && currentPrompt.trim().length > 0 && !isGenerating;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-cro-soft-black-700 mb-4">
          Customer Research
        </h1>
        <p className="text-lg text-cro-purple-700 max-w-3xl mx-auto">
          Search for companies in HubSpot, customize your research prompt, and generate 
          AI-powered intelligence reports to better understand your prospects.
        </p>
      </div>

      {/* Steps */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className={`bg-white border rounded-xl p-4 text-center transition-all duration-200 ${
          !selectedCompany 
            ? 'border-cro-blue-300 shadow-md' 
            : 'border-cro-green-300 bg-cro-green-50'
        }`}>
          <MagnifyingGlassIcon className={`h-8 w-8 mx-auto mb-2 ${
            !selectedCompany ? 'text-cro-blue-600' : 'text-cro-green-600'
          }`} />
          <h3 className="font-semibold text-cro-soft-black-700">1. Search Company</h3>
          <p className="text-sm text-cro-soft-black-600">Find company in HubSpot</p>
        </div>

        <div className={`bg-white border rounded-xl p-4 text-center transition-all duration-200 ${
          !selectedCompany || !showDataPreview
            ? 'border-cro-plat-300'
            : 'border-cro-blue-300 shadow-md'
        }`}>
          <EyeIcon className={`h-8 w-8 mx-auto mb-2 ${
            !selectedCompany || !showDataPreview 
              ? 'text-cro-purple-400' 
              : 'text-cro-blue-600'
          }`} />
          <h3 className="font-semibold text-cro-soft-black-700">2. Review Data</h3>
          <p className="text-sm text-cro-soft-black-600">Preview HubSpot information</p>
        </div>

        <div className={`bg-white border rounded-xl p-4 text-center transition-all duration-200 ${
          !currentPrompt.trim()
            ? 'border-cro-plat-300'
            : 'border-cro-green-300 bg-cro-green-50'
        }`}>
          <SparklesIcon className={`h-8 w-8 mx-auto mb-2 ${
            !currentPrompt.trim() ? 'text-cro-purple-400' : 'text-cro-green-600'
          }`} />
          <h3 className="font-semibold text-cro-soft-black-700">3. Configure Prompt</h3>
          <p className="text-sm text-cro-soft-black-600">Customize research focus</p>
        </div>

        <div className={`bg-white border rounded-xl p-4 text-center transition-all duration-200 ${
          !researchReport && !isGenerating
            ? 'border-cro-plat-300'
            : isGenerating
            ? 'border-cro-yellow-300 bg-cro-yellow-50'
            : 'border-cro-green-300 bg-cro-green-50'
        }`}>
          <DocumentTextIcon className={`h-8 w-8 mx-auto mb-2 ${
            !researchReport && !isGenerating
              ? 'text-cro-purple-400'
              : isGenerating
              ? 'text-cro-yellow-600'
              : 'text-cro-green-600'
          }`} />
          <h3 className="font-semibold text-cro-soft-black-700">4. Generate Report</h3>
          <p className="text-sm text-cro-soft-black-600">AI-powered research</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Company Search */}
          <div className="bg-white border border-cro-plat-300 rounded-xl p-6">
            <h2 className="text-xl font-bold text-cro-soft-black-700 mb-4">
              1. Select Company
            </h2>
            <CompanySearchForm
              onCompanySelect={handleCompanySelect}
              selectedCompany={selectedCompany}
              isLoading={isGenerating}
            />
          </div>

          {/* Company Data Preview */}
          {selectedCompany && (
            <CompanyDataPreview
              companyId={selectedCompany.id}
              isVisible={showDataPreview}
              onToggle={() => setShowDataPreview(!showDataPreview)}
              onDataLoad={handleCompanyDataLoad}
            />
          )}

          {/* Prompt Editor */}
          <div className="bg-white border border-cro-plat-300 rounded-xl p-6">
            <h2 className="text-xl font-bold text-cro-soft-black-700 mb-4">
              2. Configure Research Prompt
            </h2>
            <PromptEditor
              onPromptChange={handlePromptChange}
              isLoading={isGenerating}
            />
          </div>

          {/* Generate Button */}
          <div className="bg-white border border-cro-plat-300 rounded-xl p-6">
            <h2 className="text-xl font-bold text-cro-soft-black-700 mb-4">
              3. Generate Research Report
            </h2>
            
            {!selectedCompany && (
              <div className="text-cro-purple-600 bg-cro-purple-50 rounded-lg p-4 mb-4">
                <p>Please select a company to generate a research report.</p>
              </div>
            )}

            {selectedCompany && !currentPrompt.trim() && (
              <div className="text-cro-yellow-700 bg-cro-yellow-50 rounded-lg p-4 mb-4">
                <p>Please configure a research prompt before generating the report.</p>
              </div>
            )}

            <button
              onClick={generateResearch}
              disabled={!canGenerate}
              className="w-full flex items-center justify-center px-6 py-4 border border-transparent 
                       rounded-xl text-lg font-semibold text-white bg-cro-blue-600 
                       hover:bg-cro-blue-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cro-blue-600
                       transition-colors duration-200"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generating Research...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-3" />
                  Generate Research Report
                </>
              )}
            </button>

            {selectedCompany && currentPrompt.trim() && !isGenerating && (
              <div className="mt-3 text-sm text-cro-soft-black-600 text-center">
                Research will be generated for <strong>{selectedCompany.name}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <div className="bg-white border border-cro-plat-300 rounded-xl p-6">
            <h2 className="text-xl font-bold text-cro-soft-black-700 mb-6">
              Research Report
            </h2>
            
            {error ? (
              <ResearchError 
                error={error} 
                onRetry={() => {
                  setError(null);
                  generateResearch();
                }}
              />
            ) : (
              <ResearchResults 
                report={researchReport!} 
                isLoading={isGenerating}
              />
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-cro-blue-50 border border-cro-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-cro-soft-black-700 mb-3">
          How to Use Customer Research
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm text-cro-soft-black-600">
          <div>
            <h4 className="font-semibold text-cro-soft-black-700 mb-2">Getting Started</h4>
            <ul className="space-y-1">
              <li>• Start by searching for a company name or domain</li>
              <li>• Select the correct company from the search results</li>
              <li>• Preview the HubSpot data that will be analyzed</li>
              <li>• Customize the research prompt for your specific needs</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-cro-soft-black-700 mb-2">Research Tips</h4>
            <ul className="space-y-1">
              <li>• The AI analyzes HubSpot contacts, deals, and company data</li>
              <li>• Customize prompts to focus on specific business areas</li>
              <li>• Generated reports can be copied and shared</li>
              <li>• Research is tailored for CroMetrics' optimization expertise</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}