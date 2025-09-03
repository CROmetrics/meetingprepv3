import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Users, Calendar, Target, FileText, Plus, X, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { MeetingBriefRequest, SlackChannel } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ReactMarkdown from 'react-markdown';

export default function MeetingBriefForm() {
  const [formData, setFormData] = useLocalStorage<MeetingBriefRequest>('meetingBriefForm', {
    channelId: '',
    lookbackDays: 14,
    maxMessages: 300,
    attendees: [],
    purpose: '',
    accountContext: '',
  });

  const [attendeeInput, setAttendeeInput] = useState('');

  // Fetch channels
  const { data: channelsData, isLoading: channelsLoading, error: channelsError } = useQuery({
    queryKey: ['channels'],
    queryFn: () => api.listChannels(200),
  });

  // Generate brief mutation
  const generateMutation = useMutation({
    mutationFn: (data: MeetingBriefRequest) => api.generateMeetingBrief(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(formData);
  };

  const addAttendee = () => {
    if (attendeeInput.trim()) {
      setFormData({
        ...formData,
        attendees: [...(formData.attendees || []), attendeeInput.trim()],
      });
      setAttendeeInput('');
    }
  };

  const removeAttendee = (index: number) => {
    setFormData({
      ...formData,
      attendees: formData.attendees?.filter((_, i) => i !== index) || [],
    });
  };

  const channels = channelsData?.data?.channels || [];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channel Selection */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <FileText className="inline w-4 h-4 mr-1 text-cro-blue-700" />
            Slack Channel
          </label>
          {channelsLoading ? (
            <LoadingSpinner size="sm" message="Loading channels..." />
          ) : channelsError ? (
            <ErrorMessage message="Failed to load channels" />
          ) : (
            <select
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
              required
            >
              <option value="">Select a channel...</option>
              {channels.map((channel: SlackChannel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.is_private ? '🔒' : '#'} {channel.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1 text-cro-green-600" />
              Lookback Days
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={formData.lookbackDays}
              onChange={(e) => setFormData({ ...formData, lookbackDays: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
              Max Messages
            </label>
            <input
              type="number"
              min="50"
              max="1000"
              value={formData.maxMessages}
              onChange={(e) => setFormData({ ...formData, maxMessages: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
            />
          </div>
        </div>

        {/* Attendees */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Users className="inline w-4 h-4 mr-1 text-cro-purple-700" />
            Meeting Attendees
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
              placeholder="Enter attendee name..."
              className="flex-1 px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors"
            />
            <button
              type="button"
              onClick={addAttendee}
              className="px-4 py-3 bg-cro-blue-700 text-white rounded-2xl hover:bg-cro-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.attendees?.map((attendee, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-cro-purple-400 bg-opacity-20 text-cro-purple-700 rounded-xl text-sm font-medium"
              >
                {attendee}
                <button
                  type="button"
                  onClick={() => removeAttendee(index)}
                  className="ml-2 text-cro-purple-700 hover:text-cro-purple-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            <Target className="inline w-4 h-4 mr-1 text-cro-yellow-600" />
            Meeting Purpose
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            rows={3}
            placeholder="Describe the purpose and goals of this meeting..."
            className="w-full px-4 py-3 border border-cro-plat-300 rounded-2xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 transition-colors resize-none"
          />
        </div>

        {/* Account Context */}
        <div>
          <label className="block text-sm font-medium text-cro-soft-black-700 mb-2">
            Account Context <span className="text-cro-purple-700 font-normal">(Optional)</span>
          </label>
          <textarea
            value={formData.accountContext}
            onChange={(e) => setFormData({ ...formData, accountContext: e.target.value })}
            rows={3}
            placeholder="Provide any relevant context about the account..."
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
              <span className="ml-2">Generating Brief...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Meeting Brief
            </>
          )}
        </button>
      </form>

      {/* Error Display */}
      {generateMutation.isError && (
        <ErrorMessage
          message={generateMutation.error?.message || 'Failed to generate brief'}
          onClose={() => generateMutation.reset()}
        />
      )}

      {/* Results Display */}
      {generateMutation.isSuccess && generateMutation.data && (
        <div className="mt-8 bg-white rounded-2xl border border-cro-plat-300 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-cro-blue-100 to-cro-green-100 p-6 border-b border-cro-plat-300">
            <h3 className="text-2xl font-bold text-cro-soft-black-700 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-cro-blue-700" />
              Meeting Brief Generated
            </h3>
          </div>
          <div className="p-6">
            <div className="prose prose-sm max-w-none">
              <div className="bg-cro-plat-100 rounded-2xl p-6 mb-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateMutation.data.data.brief);
                    alert('Brief copied to clipboard!');
                  }}
                  className="mb-4 px-4 py-2 bg-cro-green-600 text-white rounded-xl hover:bg-cro-green-700 transition-colors text-sm font-medium"
                >
                  Copy to Clipboard
                </button>
                <div className="meeting-brief-content">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h1 className="text-3xl font-bold text-cro-soft-black-700 mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-2xl font-bold text-cro-soft-black-700 mt-6 mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-xl font-semibold text-cro-soft-black-700 mt-4 mb-2">{children}</h3>,
                      p: ({children}) => <p className="text-cro-purple-700 mb-4 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                      li: ({children}) => <li className="text-cro-purple-700">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-cro-soft-black-700">{children}</strong>,
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-cro-blue-400 pl-4 my-4 italic text-cro-purple-700">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {generateMutation.data.data.brief}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}