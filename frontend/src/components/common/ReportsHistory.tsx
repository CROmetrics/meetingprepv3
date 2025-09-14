import { useState, useEffect } from 'react';
import { History, Search, Trash2, Eye, Calendar, Users, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { ReportSummary, SavedReport } from '../../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import ReactMarkdown from 'react-markdown';

interface ReportsHistoryProps {
  onReportSelect?: (report: SavedReport) => void;
  companyFilter?: string;
}

export function ReportsHistory({ onReportSelect, companyFilter }: ReportsHistoryProps) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(companyFilter || '');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (companyFilter) {
      setSearchQuery(companyFilter);
      loadReports(companyFilter);
    }
  }, [companyFilter]);

  const loadReports = async (company?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.listReports(company);
      setReports(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await loadReports(searchQuery || undefined);
  };

  const handleClearSearch = async () => {
    setSearchQuery('');
    await loadReports();
  };

  const loadReportDetails = async (reportId: string) => {
    setLoadingReport(true);
    setError(null);
    
    try {
      const response = await api.getReport(reportId);
      const report = response.data;
      if (report) {
        setSelectedReport(report);
        setExpandedReportId(reportId);
        onReportSelect?.(report);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report details');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
        setExpandedReportId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div 
        className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleVisibility}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-cro-purple-600" />
            <h3 className="text-lg font-semibold text-cro-soft-black-700">
              Report History
            </h3>
            <span className="text-sm text-cro-soft-black-600 bg-cro-purple-100 px-2 py-1 rounded-full">
              {reports.length} reports
            </span>
          </div>
          {isVisible ? (
            <ChevronUp className="w-5 h-5 text-cro-soft-black-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cro-soft-black-600" />
          )}
        </div>
      </div>

      {/* Content */}
      {isVisible && (
        <div className="p-4">
          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cro-soft-black-400" />
              <input
                type="text"
                placeholder="Search by company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-cro-soft-black-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cro-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-cro-purple-600 text-white rounded-lg hover:bg-cro-purple-700 disabled:opacity-50 transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                disabled={loading}
                className="px-4 py-2 bg-cro-soft-black-200 text-cro-soft-black-700 rounded-lg hover:bg-cro-soft-black-300 disabled:opacity-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && <ErrorMessage message={error} />}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* Reports List */}
          {!loading && reports.length === 0 && (
            <div className="text-center py-8 text-cro-soft-black-600">
              <History className="w-12 h-12 mx-auto mb-3 text-cro-soft-black-400" />
              <p>No reports found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search terms</p>
              )}
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="border border-cro-soft-black-200 rounded-lg">
                  {/* Report Summary */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-cro-soft-black-700 mb-1">
                          {report.company}
                        </h4>
                        {report.purpose && (
                          <p className="text-sm text-cro-soft-black-600 mb-2">
                            {report.purpose}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-cro-soft-black-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.generatedAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {report.attendeesCount} attendees
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {report.sourcesCount} sources
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => loadReportDetails(report.id)}
                          disabled={loadingReport}
                          className="p-2 text-cro-purple-600 hover:bg-cro-purple-50 rounded-lg transition-colors"
                          title="View report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Report Content */}
                  {expandedReportId === report.id && selectedReport && (
                    <div className="border-t border-cro-soft-black-200">
                      {loadingReport ? (
                        <div className="flex justify-center py-8">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <div className="p-4 bg-cro-soft-black-50">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{selectedReport.report.content || 'No content available'}</ReactMarkdown>
                          </div>
                          <div className="mt-4 pt-4 border-t border-cro-soft-black-200">
                            <p className="text-xs text-cro-soft-black-500">
                              Saved: {formatDate(selectedReport.savedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
