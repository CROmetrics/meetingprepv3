import { useState } from 'react';
import {
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ResearchReport } from '../../types';

interface ResearchResultsProps {
  report: ResearchReport;
  isLoading?: boolean;
}

export function ResearchResults({ report, isLoading = false }: ResearchResultsProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report.report);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report.promptUsed);
      setHasCopiedPrompt(true);
      setTimeout(() => setHasCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt: ', err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-cro-plat-300 rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cro-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-cro-soft-black-700 mb-2">
              Generating Research Report
            </h3>
            <p className="text-cro-purple-600">
              AI is analyzing the company data and creating your custom research report...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-cro-plat-50 border border-cro-plat-300 rounded-xl p-6">
        <div className="text-center py-8">
          <DocumentTextIcon className="h-12 w-12 text-cro-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-cro-soft-black-700 mb-2">
            No Research Report Generated
          </h3>
          <p className="text-cro-purple-600">
            Select a company and click "Generate Research" to create an AI-powered research report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-cro-plat-300 rounded-xl">
      {/* Header */}
      <div className="border-b border-cro-plat-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <SparklesIcon className="h-5 w-5 text-cro-green-600" />
              <h2 className="text-xl font-bold text-cro-soft-black-700">
                Research Report
              </h2>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-cro-soft-black-600">
              <div className="flex items-center space-x-1">
                <BuildingOfficeIcon className="h-4 w-4 text-cro-blue-600" />
                <span className="font-medium">{report.companyName}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4 text-cro-purple-600" />
                <span>Generated {formatDate(report.generatedAt)}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-4 py-2 border border-cro-blue-300 rounded-lg
                     text-sm font-medium text-cro-blue-700 bg-white hover:bg-cro-blue-50
                     focus:outline-none focus:ring-2 focus:ring-cro-blue-500
                     transition-colors duration-200"
          >
            {hasCopied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>Copy Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none">
          <div
            className="text-cro-soft-black-700 leading-relaxed whitespace-pre-wrap"
            style={{
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {report.report}
          </div>
        </div>
      </div>

      {/* AI Prompt Details */}
      <div className="border-t border-cro-plat-200">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-cro-soft-black-700 hover:bg-cro-plat-50 transition-colors duration-200"
        >
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-4 w-4 text-cro-purple-600" />
            <span>View AI Prompt Used</span>
            <span className="text-xs text-cro-purple-600 bg-cro-purple-100 px-2 py-1 rounded">
              Helpful for prompt tuning
            </span>
          </div>
          {showPrompt ? (
            <ChevronUpIcon className="h-5 w-5 text-cro-purple-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-cro-purple-600" />
          )}
        </button>

        {showPrompt && (
          <div className="px-6 pb-6">
            <div className="bg-cro-plat-50 border border-cro-plat-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-cro-soft-black-700">
                  AI Prompt Details
                </h4>
                <button
                  onClick={copyPromptToClipboard}
                  className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-cro-blue-700 bg-white border border-cro-blue-300 rounded-lg hover:bg-cro-blue-50"
                >
                  {hasCopiedPrompt ? (
                    <>
                      <CheckIcon className="h-3 w-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-3 w-3" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-cro-purple-600 bg-cro-blue-50 border border-cro-blue-200 rounded-lg p-3">
                <strong>💡 How this works:</strong> This is the exact prompt that was sent to the AI,
                including your custom instructions and all the HubSpot company data.
                Use this to understand how the AI generated the research and to tune your prompts for better results.
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-cro-plat-300 rounded-lg p-4">
                  <h5 className="font-semibold text-cro-soft-black-700 mb-2 text-sm">
                    Full AI Prompt:
                  </h5>
                  <div className="text-xs font-mono text-cro-soft-black-600 bg-cro-plat-50 border border-cro-plat-200 rounded p-3 max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {report.promptUsed}
                  </div>
                </div>
              </div>

              <div className="text-xs text-cro-purple-600 italic">
                Character count: {report.promptUsed.length.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-cro-plat-200 px-6 py-4 bg-cro-plat-50 rounded-b-xl">
        <div className="flex items-center justify-between text-xs text-cro-purple-600">
          <div className="flex items-center space-x-4">
            <span>Report ID: {report.companyId}</span>
            <span>•</span>
            <span>Characters: {report.report.length.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <SparklesIcon className="h-3 w-3" />
            <span>Generated by AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResearchErrorProps {
  error: string;
  onRetry?: () => void;
}

export function ResearchError({ error, onRetry }: ResearchErrorProps) {
  return (
    <div className="bg-white border border-red-200 rounded-xl p-6">
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-cro-soft-black-700 mb-2">
          Research Generation Failed
        </h3>
        <p className="text-red-600 mb-4">
          {error}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg
                     text-sm font-medium text-white bg-cro-blue-600 hover:bg-cro-blue-700
                     focus:outline-none focus:ring-2 focus:ring-cro-blue-500"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}