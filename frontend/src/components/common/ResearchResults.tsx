import { useState } from 'react';
import { 
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { ResearchReport } from '../../types';

interface ResearchResultsProps {
  report: ResearchReport;
  isLoading?: boolean;
}

export function ResearchResults({ report, isLoading = false }: ResearchResultsProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(report.report);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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