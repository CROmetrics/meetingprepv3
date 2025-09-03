import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Building2, Users, Target, FileText, Search, Plus, Trash2, Mail, Briefcase, Linkedin } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { BDMeetingRequest, Attendee } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const BDMeetingForm: React.FC = () => {
  const [formData, setFormData] = useLocalStorage<BDMeetingRequest>('bdMeetingForm', {
    company: '',
    attendees: [],
    purpose: '',
    additionalContext: '',
  });

  const [currentAttendee, setCurrentAttendee] = useState<Attendee>({
    name: '',
    email: '',
    title: '',
    company: '',
    linkedinUrl: '',
  });

  const [activeStep, setActiveStep] = useState<'research' | 'generate' | 'hubspot'>('research');

  // Research attendees mutation
  const researchMutation = useMutation({
    mutationFn: (data: BDMeetingRequest) => api.researchAttendees(data),
    onSuccess: () => setActiveStep('generate'),
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: (data: BDMeetingRequest) => api.generateBDReport(data),
  });

  // Add to HubSpot mutation
  const hubspotMutation = useMutation({
    mutationFn: (attendees: Attendee[]) => api.addToHubSpot(attendees),
  });

  const handleResearch = () => {
    if (formData.company && formData.attendees.length > 0) {
      researchMutation.mutate(formData);
    }
  };

  const handleGenerate = () => {
    if (formData.company && formData.attendees.length > 0) {
      generateMutation.mutate(formData);
    }
  };

  const handleAddToHubSpot = () => {
    hubspotMutation.mutate(formData.attendees);
  };

  const addAttendee = () => {
    if (currentAttendee.name) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, { ...currentAttendee }],
      });
      setCurrentAttendee({
        name: '',
        email: '',
        title: '',
        company: '',
        linkedinUrl: '',
      });
    }
  };

  const removeAttendee = (index: number) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter((_, i) => i !== index),
    });
  };

  const isProcessing = researchMutation.isPending || generateMutation.isPending || hubspotMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Business Development Intelligence</h2>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className={clsx(
            'flex-1 text-center pb-2 border-b-2 cursor-pointer',
            activeStep === 'research' ? 'border-blue-600 text-blue-600' : 'border-gray-300'
          )} onClick={() => setActiveStep('research')}>
            <Search className="inline w-5 h-5 mr-1" />
            Research
          </div>
          <div className={clsx(
            'flex-1 text-center pb-2 border-b-2 cursor-pointer',
            activeStep === 'generate' ? 'border-blue-600 text-blue-600' : 'border-gray-300'
          )} onClick={() => setActiveStep('generate')}>
            <FileText className="inline w-5 h-5 mr-1" />
            Generate Report
          </div>
          <div className={clsx(
            'flex-1 text-center pb-2 border-b-2 cursor-pointer',
            activeStep === 'hubspot' ? 'border-blue-600 text-blue-600' : 'border-gray-300'
          )} onClick={() => setActiveStep('hubspot')}>
            <Users className="inline w-5 h-5 mr-1" />
            Add to HubSpot
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline w-4 h-4 mr-1" />
              Target Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Attendees Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Meeting Attendees
            </label>

            {/* Add Attendee Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <input
                  type="text"
                  value={currentAttendee.name}
                  onChange={(e) => setCurrentAttendee({ ...currentAttendee, name: e.target.value })}
                  placeholder="Full Name *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  value={currentAttendee.email}
                  onChange={(e) => setCurrentAttendee({ ...currentAttendee, email: e.target.value })}
                  placeholder="Email"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={currentAttendee.title}
                  onChange={(e) => setCurrentAttendee({ ...currentAttendee, title: e.target.value })}
                  placeholder="Title/Role"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={currentAttendee.company}
                  onChange={(e) => setCurrentAttendee({ ...currentAttendee, company: e.target.value })}
                  placeholder="Company (if different)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={currentAttendee.linkedinUrl}
                  onChange={(e) => setCurrentAttendee({ ...currentAttendee, linkedinUrl: e.target.value })}
                  placeholder="LinkedIn URL (optional)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addAttendee}
                  disabled={!currentAttendee.name}
                  className={clsx(
                    'px-4 py-2 rounded-md flex items-center justify-center',
                    currentAttendee.name
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Attendee
                </button>
              </div>
            </div>

            {/* Attendees List */}
            {formData.attendees.length > 0 && (
              <div className="space-y-2">
                {formData.attendees.map((attendee, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{attendee.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {attendee.email && (
                            <span className="text-xs text-gray-600 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {attendee.email}
                            </span>
                          )}
                          {attendee.title && (
                            <span className="text-xs text-gray-600 flex items-center">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {attendee.title}
                            </span>
                          )}
                          {attendee.company && (
                            <span className="text-xs text-gray-600 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {attendee.company}
                            </span>
                          )}
                          {attendee.linkedinUrl && (
                            <span className="text-xs text-gray-600 flex items-center">
                              <Linkedin className="w-3 h-3 mr-1" />
                              LinkedIn
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttendee(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="inline w-4 h-4 mr-1" />
              Meeting Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="What are we trying to achieve in this meeting?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Additional Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context
            </label>
            <textarea
              value={formData.additionalContext}
              onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
              placeholder="Any other relevant information..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {activeStep === 'research' && (
              <button
                onClick={handleResearch}
                disabled={!formData.company || formData.attendees.length === 0 || isProcessing}
                className={clsx(
                  'flex-1 py-3 px-4 rounded-md font-medium flex items-center justify-center',
                  formData.company && formData.attendees.length > 0 && !isProcessing
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                {researchMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Research Attendees
                  </>
                )}
              </button>
            )}

            {activeStep === 'generate' && (
              <button
                onClick={handleGenerate}
                disabled={!formData.company || formData.attendees.length === 0 || isProcessing}
                className={clsx(
                  'flex-1 py-3 px-4 rounded-md font-medium flex items-center justify-center',
                  formData.company && formData.attendees.length > 0 && !isProcessing
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                {generateMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Intelligence Report
                  </>
                )}
              </button>
            )}

            {activeStep === 'hubspot' && (
              <button
                onClick={handleAddToHubSpot}
                disabled={formData.attendees.length === 0 || isProcessing}
                className={clsx(
                  'flex-1 py-3 px-4 rounded-md font-medium flex items-center justify-center',
                  formData.attendees.length > 0 && !isProcessing
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                {hubspotMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Add to HubSpot
                  </>
                )}
              </button>
            )}
          </div>

          {/* Error Display */}
          {(researchMutation.isError || generateMutation.isError || hubspotMutation.isError) && (
            <ErrorMessage 
              message={
                researchMutation.error?.message || 
                generateMutation.error?.message || 
                hubspotMutation.error?.message || 
                'An error occurred'
              } 
            />
          )}

          {/* Results Display */}
          {researchMutation.isSuccess && researchMutation.data && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Research Results</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(researchMutation.data.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {generateMutation.isSuccess && generateMutation.data?.data?.report && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Intelligence Report</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {generateMutation.data.data.report}
                  </pre>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateMutation.data.data.report);
                    alert('Report copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Copy Report
                </button>
                <button
                  onClick={() => setActiveStep('hubspot')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add to HubSpot
                </button>
              </div>
            </div>
          )}

          {hubspotMutation.isSuccess && hubspotMutation.data && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">HubSpot Results</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800">
                  Successfully processed {hubspotMutation.data.data?.totalProcessed} contacts.
                  {hubspotMutation.data.data?.successCount} added to HubSpot.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};