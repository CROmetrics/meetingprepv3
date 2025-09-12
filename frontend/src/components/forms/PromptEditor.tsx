import React, { useState, useEffect } from 'react';
import { 
  PencilSquareIcon, 
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';

interface PromptEditorProps {
  onPromptChange: (prompt: string) => void;
  isLoading?: boolean;
}

export function PromptEditor({ onPromptChange, isLoading = false }: PromptEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load the current prompt on component mount
  useEffect(() => {
    loadPrompt();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(prompt !== originalPrompt && prompt.trim().length > 0);
  }, [prompt, originalPrompt]);

  const loadPrompt = async () => {
    try {
      const response = await apiService.getResearchPrompt();
      const loadedPrompt = response.data?.prompt || '';
      setPrompt(loadedPrompt);
      setOriginalPrompt(loadedPrompt);
      onPromptChange(loadedPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompt');
    }
  };

  const savePrompt = async () => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiService.updateResearchPrompt(prompt.trim());
      setOriginalPrompt(prompt);
      setIsEditing(false);
      onPromptChange(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const resetPrompt = async () => {
    if (!window.confirm('Are you sure you want to reset the prompt to its default value? This will discard any unsaved changes.')) {
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const response = await apiService.resetResearchPrompt();
      const resetPrompt = response.data?.prompt || '';
      setPrompt(resetPrompt);
      setOriginalPrompt(resetPrompt);
      setIsEditing(false);
      onPromptChange(resetPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset prompt');
    } finally {
      setIsResetting(false);
    }
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    setError(null);
  };

  const cancelEdit = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setPrompt(originalPrompt);
        setIsEditing(false);
        setError(null);
      }
    } else {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-cro-soft-black-700">
          Research Prompt
        </h3>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-cro-yellow-100 text-cro-yellow-700">
              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
              Unsaved changes
            </span>
          )}
          
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-cro-blue-300 rounded-lg
                         text-sm font-medium text-cro-blue-700 bg-white hover:bg-cro-blue-50
                         focus:outline-none focus:ring-2 focus:ring-cro-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={resetPrompt}
                disabled={isLoading || isResetting}
                className="inline-flex items-center px-3 py-2 border border-cro-purple-300 rounded-lg
                         text-sm font-medium text-cro-purple-700 bg-white hover:bg-cro-purple-50
                         focus:outline-none focus:ring-2 focus:ring-cro-purple-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cro-purple-500 mr-2"></div>
                ) : (
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                )}
                Reset to Default
              </button>
            </>
          ) : (
            <>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-2 border border-cro-plat-300 rounded-lg
                         text-sm font-medium text-cro-purple-600 bg-white hover:bg-cro-plat-50
                         focus:outline-none focus:ring-2 focus:ring-cro-plat-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                onClick={savePrompt}
                disabled={!prompt.trim() || isSaving}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg
                         text-sm font-medium text-white bg-cro-blue-600 hover:bg-cro-blue-700
                         focus:outline-none focus:ring-2 focus:ring-cro-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="prompt-editor" className="block text-sm font-medium text-cro-soft-black-700">
          Customize the research prompt to focus on specific aspects for your needs:
        </label>
        
        {isEditing ? (
          <textarea
            id="prompt-editor"
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            disabled={isSaving}
            className="block w-full px-4 py-3 border border-cro-plat-300 rounded-xl
                     bg-white text-cro-soft-black-700 placeholder-cro-purple-500
                     focus:outline-none focus:ring-2 focus:ring-cro-blue-500 focus:border-cro-blue-500
                     disabled:bg-cro-plat-100 disabled:text-cro-purple-500
                     font-mono text-sm leading-relaxed"
            rows={15}
            placeholder="Enter your research prompt..."
          />
        ) : (
          <div className="block w-full px-4 py-3 border border-cro-plat-200 rounded-xl
                        bg-cro-plat-50 text-cro-soft-black-700
                        font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {prompt || 'No prompt configured'}
          </div>
        )}

        {isEditing && (
          <div className="text-xs text-cro-purple-600">
            <strong>Tip:</strong> The prompt will receive HubSpot company data and should instruct the AI 
            on how to analyze it for your research needs. Include specific sections or analysis types you want.
          </div>
        )}
      </div>

      <div className="text-xs text-cro-purple-500">
        Character count: {prompt.length}
      </div>
    </div>
  );
}