import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Users, Building2, Target, Plus, Trash2, Sparkles, Search, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { BDMeetingRequest, Attendee, BDMeetingFormData, AttendeeWithStatus } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ReactMarkdown from 'react-markdown';

export default function BDMeetingForm() {
  const [formData, setFormData] = useLocalStorage<BDMeetingFormData>('bdMeetingForm', {
    company: '',
    purpose: '',
    additionalContext: '',
    attendees: [
      {
        id: '1',
        name: '',
        email: '',
        title: '',
        researchStatus: 'pending'
      }
    ],
  });

  // Research attendees mutation
  const researchMutation = useMutation({
    mutationFn: (data: BDMeetingRequest) => api.researchAttendees(data),
    onSuccess: (response) => {
      // Update attendees with research status
      const researchedAttendees = response.data.attendees || [];
      setFormData(prev => ({
        ...prev,
        attendees: prev.attendees.map(attendee => {
          const researched = researchedAttendees.find((r: any) => r.name === attendee.name);
          return {
            ...attendee,
            researchStatus: 'completed' as const,
            hubspotStatus: researched?.hubspotData ? 'found' : 'not_found'
          };
        })
      }));
    }
  });

  // Generate BD report mutation
  const generateMutation = useMutation({
    mutationFn: (data: BDMeetingRequest) => api.generateBDReport(data),
  });

  const addAttendee = () => {
    const newId = (formData.attendees.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, {
        id: newId,
        name: '',
        email: '',
        title: '',
        researchStatus: 'pending'
      }]
    }));
  };

  const removeAttendee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a.id !== id)
    }));
  };

  const updateAttendee = (id: string, field: keyof Attendee, value: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map(attendee =>
        attendee.id === id ? { ...attendee, [field]: value } : attendee
      )
    }));
  };

  const handleResearchAttendees = () => {
    const request: BDMeetingRequest = {
      company: formData.company,
      attendees: formData.attendees.map(({ id, researchStatus, hubspotStatus, ...attendee }) => attendee),
      purpose: formData.purpose,
      additionalContext: formData.additionalContext
    };
    
    // Set all attendees to researching status
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map(a => ({ ...a, researchStatus: 'researching' }))
    }));
    
    researchMutation.mutate(request);
  };

  const handleGenerateReport = () => {
    const request: BDMeetingRequest = {
      company: formData.company,
      attendees: formData.attendees.map(({ id, researchStatus, hubspotStatus, ...attendee }) => attendee),
      purpose: formData.purpose,
      additionalContext: formData.additionalContext
    };
    generateMutation.mutate(request);
  };

  const canResearch = formData.company && formData.attendees.some(a => a.name.trim());
  const canGenerateReport = formData.attendees.every(a => a.researchStatus === 'completed');
  const hasResearchedAttendees = formData.attendees.some(a => a.researchStatus === 'completed');

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Company Information */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Building2 className="inline w-4 h-4 mr-1 text-cro-green-600" />
            Target Company
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

        {/* Meeting Attendees */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-cro-soft-black-700">
              <Users className="inline w-4 h-4 mr-1 text-cro-blue-700" />
              Meeting Attendees
            </label>
            <button
              type="button"
              onClick={addAttendee}
              className="flex items-center px-3 py-1 text-sm bg-cro-blue-100 text-cro-blue-700 rounded-lg hover:bg-cro-blue-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Attendee
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.attendees.map((attendee, index) => (
              <div key={attendee.id} className="border border-cro-plat-300 rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-cro-soft-black-700">
                    Attendee {index + 1}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {attendee.researchStatus === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-cro-green-600" />
                    )}
                    {attendee.researchStatus === 'researching' && (
                      <LoadingSpinner size="sm" />
                    )}
                    {formData.attendees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAttendee(attendee.id)}
                        className="text-cro-red-600 hover:text-cro-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={attendee.name}
                      onChange={(e) => updateAttendee(attendee.id, 'name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={attendee.title || ''}
                      onChange={(e) => updateAttendee(attendee.id, 'title', e.target.value)}
                      placeholder="VP of Marketing"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-cro-soft-black-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={attendee.email || ''}
                      onChange={(e) => updateAttendee(attendee.id, 'email', e.target.value)}
                      placeholder="john@company.com"
                      className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors text-sm"
                    />
                  </div>
                </div>
                
                {attendee.hubspotStatus && (
                  <div className="mt-2">
                    <span className={clsx(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      attendee.hubspotStatus === 'found' ? 'bg-cro-green-100 text-cro-green-800' : 'bg-cro-yellow-100 text-cro-yellow-800'
                    )}>
                      {attendee.hubspotStatus === 'found' ? '✓ Found in HubSpot' : '⚠ Not in HubSpot'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Purpose */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Target className="inline w-4 h-4 mr-1 text-cro-yellow-600" />
            Meeting Purpose <span className="text-cro-soft-black-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.purpose || ''}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="Discovery call, demo, contract negotiation..."
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
          />
        </div>

        {/* Additional Context */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            Additional Context <span className="text-cro-soft-black-500 font-normal">(Optional)</span>
          </label>
          <textarea
            value={formData.additionalContext || ''}
            onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
            rows={3}
            placeholder="Any additional context about the meeting, company, or specific topics to focus on..."
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleResearchAttendees}
            disabled={!canResearch || researchMutation.isPending}
            className={clsx(
              'flex-1 flex items-center justify-center px-6 py-3 rounded-2xl font-medium text-white transition-all',
              'shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
              !canResearch || researchMutation.isPending
                ? 'bg-cro-plat-300 cursor-not-allowed'
                : 'bg-cro-purple-600 hover:bg-cro-purple-700 focus:ring-cro-purple-700'
            )}
          >
            {researchMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Researching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Research Attendees
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={!canGenerateReport || generateMutation.isPending}
            className={clsx(
              'flex-1 flex items-center justify-center px-6 py-3 rounded-2xl font-medium text-white transition-all',
              'shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cro-blue-700',
              !canGenerateReport || generateMutation.isPending
                ? 'bg-cro-plat-300 cursor-not-allowed'
                : 'bg-cro-blue-700 hover:bg-cro-blue-800'
            )}
          >
            {generateMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Generating Report...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Intelligence Report
              </>
            )}
          </button>
        </div>
        
        {hasResearchedAttendees && !canGenerateReport && (
          <div className="text-center text-sm text-cro-soft-black-600">
            Complete research for all attendees to generate the full intelligence report
          </div>
        )}
      </div>

      {/* Error Display */}
      {(researchMutation.isError || generateMutation.isError) && (
        <ErrorMessage
          message={
            researchMutation.error?.message || 
            generateMutation.error?.message || 
            'An error occurred'
          }
          onClose={() => {
            researchMutation.reset();
            generateMutation.reset();
          }}
        />
      )}

      {/* Results Display */}
      {generateMutation.isSuccess && generateMutation.data && (
        <div className="mt-8 bg-white rounded-2xl border border-cro-plat-300 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-cro-purple-400 to-cro-blue-100 bg-opacity-30 p-6 border-b border-cro-plat-300">
            <h3 className="text-2xl font-bold text-cro-soft-black-700 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-cro-blue-700" />
              BD Intelligence Report
            </h3>
            <p className="text-cro-soft-black-600 mt-2">Meeting preparation for {formData.company}</p>
          </div>
          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-cro-blue-100 rounded-xl p-4">
                <p className="text-sm text-cro-blue-700 font-medium">Company</p>
                <p className="text-lg font-bold text-cro-soft-black-700">{formData.company}</p>
              </div>
              <div className="bg-cro-green-100 rounded-xl p-4">
                <p className="text-sm text-cro-green-700 font-medium">Attendees</p>
                <p className="text-lg font-bold text-cro-soft-black-700">{formData.attendees.length}</p>
              </div>
              <div className="bg-cro-yellow-100 rounded-xl p-4">
                <p className="text-sm text-cro-yellow-700 font-medium">Sources</p>
                <p className="text-lg font-bold text-cro-soft-black-700">{generateMutation.data.data?.metadata?.sourcesCount || 0}</p>
              </div>
            </div>

            {/* Intelligence Report Content */}
            <div className="bg-cro-plat-100 rounded-2xl p-6">
              <button
                onClick={() => {
                  const report = generateMutation.data.data.report;
                  const content = `# BD Intelligence Report - ${formData.company}\n\n` +
                                 `## Executive Summary\n${report.executiveSummary}\n\n` +
                                 `## Target Company Intelligence\n${report.targetCompanyIntelligence}\n\n` +
                                 `## Meeting Attendee Analysis\n${report.meetingAttendeeAnalysis}\n\n` +
                                 `## Strategic Opportunity Assessment\n${report.strategicOpportunityAssessment}\n\n` +
                                 `## Meeting Dynamics Strategy\n${report.meetingDynamicsStrategy}\n\n` +
                                 `## Key Questions\n${report.keyQuestions.map((q: string) => `- ${q}`).join('\n')}\n\n` +
                                 `## Potential Objections & Responses\n${report.potentialObjectionsResponses}`;
                  navigator.clipboard.writeText(content);
                  alert('Intelligence report copied to clipboard!');
                }}
                className="mb-6 px-4 py-2 bg-cro-green-600 text-white rounded-xl hover:bg-cro-green-700 transition-colors text-sm font-medium"
              >
                Copy Report to Clipboard
              </button>

              {generateMutation.data.data.report && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">Executive Summary</h4>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown className="text-cro-purple-700 leading-relaxed">
                        {generateMutation.data.data.report.executiveSummary}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Target Company Intelligence */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3 flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-cro-green-600" />
                      Target Company Intelligence
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown className="text-cro-purple-700 leading-relaxed">
                        {generateMutation.data.data.report.targetCompanyIntelligence}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Meeting Attendee Analysis */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-cro-blue-700" />
                      Meeting Attendee Analysis
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown className="text-cro-purple-700 leading-relaxed">
                        {generateMutation.data.data.report.meetingAttendeeAnalysis}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Strategic Opportunity Assessment */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">Strategic Opportunity Assessment</h4>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown className="text-cro-purple-700 leading-relaxed">
                        {generateMutation.data.data.report.strategicOpportunityAssessment}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Key Questions */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">Key Questions to Ask</h4>
                    <ul className="space-y-2">
                      {generateMutation.data.data.report.keyQuestions?.map((question: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-cro-blue-600 mr-2">•</span>
                          <span className="text-cro-purple-700">{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Meeting Dynamics Strategy */}
                  <div>
                    <h4 className="text-lg font-bold text-cro-soft-black-700 mb-3">Meeting Dynamics Strategy</h4>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown className="text-cro-purple-700 leading-relaxed">
                        {generateMutation.data.data.report.meetingDynamicsStrategy}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="bg-white rounded-xl p-4 border border-cro-plat-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-cro-soft-black-700">Research Confidence</span>
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-cro-plat-200 rounded-full mr-2">
                          <div 
                            className="h-full bg-cro-green-500 rounded-full" 
                            style={{width: `${(generateMutation.data.data.report.confidence || 0) * 100}%`}}
                          />
                        </div>
                        <span className="text-sm font-bold text-cro-soft-black-700">
                          {Math.round((generateMutation.data.data.report.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add to HubSpot Section */}
            {formData.attendees.some(a => a.hubspotStatus === 'not_found') && (
              <div className="mt-6 p-4 bg-cro-yellow-50 rounded-xl border border-cro-yellow-200">
                <h4 className="text-lg font-medium text-cro-yellow-800 mb-3">Add Contacts to HubSpot</h4>
                <p className="text-sm text-cro-yellow-700 mb-3">
                  Some attendees were not found in HubSpot. Would you like to add them?
                </p>
                <button
                  onClick={() => {
                    const attendeesToAdd = formData.attendees
                      .filter(a => a.hubspotStatus === 'not_found')
                      .map(({ id, researchStatus, hubspotStatus, ...attendee }) => attendee);
                    api.addToHubSpot(attendeesToAdd)
                      .then(() => {
                        alert('Contacts added to HubSpot successfully!');
                        setFormData(prev => ({
                          ...prev,
                          attendees: prev.attendees.map(a => 
                            a.hubspotStatus === 'not_found' ? { ...a, hubspotStatus: 'added' } : a
                          )
                        }));
                      })
                      .catch(error => alert('Failed to add contacts: ' + error.message));
                  }}
                  className="px-4 py-2 bg-cro-yellow-600 text-white rounded-xl hover:bg-cro-yellow-700 transition-colors text-sm font-medium"
                >
                  Add to HubSpot
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}