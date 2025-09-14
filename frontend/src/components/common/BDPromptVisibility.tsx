import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface BDPromptVisibilityProps {
  prompt: string;
}

export function BDPromptVisibility({ prompt }: BDPromptVisibilityProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);

  const copyPromptToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setHasCopiedPrompt(true);
      setTimeout(() => setHasCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt: ', err);
    }
  };

  return (
    <div className="border border-cro-plat-200 rounded-xl bg-white">
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
              including your meeting details, attendee research, and company intelligence.
              Use this to understand how the AI generated the report and to tune your inputs for better results.
            </div>

            <div className="space-y-3">
              <div className="bg-white border border-cro-plat-300 rounded-lg p-4">
                <h5 className="font-semibold text-cro-soft-black-700 mb-2 text-sm">
                  Full AI Prompt:
                </h5>
                <div className="text-xs font-mono text-cro-soft-black-600 bg-cro-plat-50 border border-cro-plat-200 rounded p-3 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {prompt}
                </div>
              </div>
            </div>

            <div className="text-xs text-cro-purple-600 italic">
              Character count: {prompt.length.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}