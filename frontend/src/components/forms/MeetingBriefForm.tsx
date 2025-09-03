import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send, Users, Calendar, Target, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { MeetingBriefRequest, SlackChannel } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const MeetingBriefForm: React.FC = () => {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Internal Meeting Brief Generator</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Lookback Days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Lookback Days
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={formData.lookbackDays}
                onChange={(e) => setFormData({ ...formData, lookbackDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Messages
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={formData.maxMessages}
                onChange={(e) => setFormData({ ...formData, maxMessages: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Meeting Attendees
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                placeholder="Name or Name <email>"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addAttendee}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {formData.attendees && formData.attendees.length > 0 && (
              <div className="space-y-1">
                {formData.attendees.map((attendee, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <span className="text-sm">{attendee}</span>
                    <button
                      type="button"
                      onClick={() => removeAttendee(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
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
              placeholder="What are the main objectives of this meeting?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Account Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Context
            </label>
            <textarea
              value={formData.accountContext}
              onChange={(e) => setFormData({ ...formData, accountContext: e.target.value })}
              placeholder="Any relevant account or deal information..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!formData.channelId || generateMutation.isPending}
            className={clsx(
              'w-full py-3 px-4 rounded-md font-medium flex items-center justify-center',
              formData.channelId && !generateMutation.isPending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {generateMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Generate Meeting Brief
              </>
            )}
          </button>
        </form>

        {/* Error Display */}
        {generateMutation.isError && (
          <div className="mt-4">
            <ErrorMessage 
              message={generateMutation.error?.message || 'Failed to generate brief'} 
              onClose={() => generateMutation.reset()}
            />
          </div>
        )}

        {/* Success - Display Brief */}
        {generateMutation.isSuccess && generateMutation.data?.data?.brief && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Generated Brief</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {generateMutation.data.data.brief}
                </pre>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateMutation.data.data.brief);
                  alert('Brief copied to clipboard!');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => generateMutation.reset()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Generate New Brief
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};