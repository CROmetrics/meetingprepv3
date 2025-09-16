import { useState, useEffect } from 'react';
import {
  PencilSquareIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export type PromptStyle = 'sales' | 'none' | 'custom';

export interface CustomPrompts {
  systemPrompt: string;
  userPrompt: string;
}

interface PromptStyleEditorProps {
  promptStyle: PromptStyle;
  customPrompts: CustomPrompts;
  onPromptStyleChange: (style: PromptStyle) => void;
  onCustomPromptsChange: (prompts: CustomPrompts) => void;
  disabled?: boolean;
}

// Default prompts for different styles
const DEFAULT_PROMPTS = {
  sales: {
    systemPrompt: `You are Cro Metrics' External Business Development Meeting Intelligence Agent.
Goal: produce a comprehensive, strategic intelligence report (≈1500–2000 words) that positions us to win external BD meetings.
Audience: Cro Metrics executives preparing for high-stakes external meetings.
Tone: analytical, strategic, confident. Focus on actionable intelligence.

ABOUT CRO METRICS:
We are a leading conversion rate optimization (CRO) and digital analytics consultancy specializing in enterprise-grade testing and optimization programs. We help Fortune 500 companies achieve 15-30% revenue increases through data-driven experimentation and systematic optimization across web, mobile, email, and in-store channels.

Our differentiation: Statistical rigor, proprietary methodologies, enterprise program management, and 15+ years of proven results with household-name brands.`,
    userPrompt: `Create a strategic business development intelligence report using the research provided below.
Focus on identifying specific opportunities where Cro Metrics can drive measurable business impact through our comprehensive digital growth services.

Map the target company's specific needs and challenges to Cro Metrics' current service offerings. Reference our proven results and relevant client success stories when applicable.

Position Cro Metrics with our comprehensive service portfolio and scientific approach: "We Don't Guess, We Test"

Base all analysis on the research context provided. Mark gaps as **Unknown** and prioritize additional research needs.

Return your response in clean, well-formatted markdown using professional, strategic tone suitable for executives preparing for high-stakes meetings.`
  },
  none: {
    systemPrompt: '',
    userPrompt: 'Create a business development intelligence report based on the provided research context.'
  }
};

export function PromptStyleEditor({
  promptStyle,
  customPrompts,
  onPromptStyleChange,
  onCustomPromptsChange,
  disabled = false
}: PromptStyleEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSystemPrompt, setLocalSystemPrompt] = useState(customPrompts.systemPrompt);
  const [localUserPrompt, setLocalUserPrompt] = useState(customPrompts.userPrompt);

  // Update local state when props change
  useEffect(() => {
    setLocalSystemPrompt(customPrompts.systemPrompt);
    setLocalUserPrompt(customPrompts.userPrompt);
  }, [customPrompts]);

  // Update custom prompts when local state changes
  useEffect(() => {
    if (promptStyle === 'custom') {
      onCustomPromptsChange({
        systemPrompt: localSystemPrompt,
        userPrompt: localUserPrompt
      });
    }
  }, [localSystemPrompt, localUserPrompt, promptStyle]);

  const handleStyleChange = (style: PromptStyle) => {
    onPromptStyleChange(style);

    // If switching to custom, populate with sales defaults if empty
    if (style === 'custom' && (!localSystemPrompt || !localUserPrompt)) {
      const salesDefaults = DEFAULT_PROMPTS.sales;
      setLocalSystemPrompt(salesDefaults.systemPrompt);
      setLocalUserPrompt(salesDefaults.userPrompt);
      onCustomPromptsChange({
        systemPrompt: salesDefaults.systemPrompt,
        userPrompt: salesDefaults.userPrompt
      });
    }
  };

  const resetToDefaults = (style: 'sales' | 'none') => {
    if (!window.confirm('Reset prompts to default? This will overwrite your current custom prompts.')) {
      return;
    }

    const defaults = DEFAULT_PROMPTS[style];
    setLocalSystemPrompt(defaults.systemPrompt);
    setLocalUserPrompt(defaults.userPrompt);
    onCustomPromptsChange({
      systemPrompt: defaults.systemPrompt,
      userPrompt: defaults.userPrompt
    });
  };

  const getSystemCharCount = () => localSystemPrompt.length;
  const getUserCharCount = () => localUserPrompt.length;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-cro-purple-50 to-cro-blue-50 rounded-2xl border-2 border-cro-purple-200 p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <PencilSquareIcon className="w-5 h-5 text-cro-purple-600" />
            <h3 className="text-lg font-semibold text-cro-purple-700">
              Prompt Customization
            </h3>
            <span className="text-sm text-cro-soft-black-600">(Optional)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-cro-purple-600">
              Current: {promptStyle === 'sales' ? 'Sales-focused' : promptStyle === 'none' ? 'Minimal' : 'Custom'}
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4 text-cro-purple-600" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-cro-purple-600" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-cro-soft-black-600">
              Choose how the AI should approach generating your meeting intelligence. You can use our sales-focused prompts, minimal prompts, or create completely custom ones.
            </p>

            {/* Prompt Style Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-cro-soft-black-700">
                Prompt Style
              </label>

              <div className="space-y-2">
                <label
                  className="flex items-start space-x-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStyleChange('sales');
                  }}
                >
                  <input
                    type="radio"
                    name="promptStyle"
                    value="sales"
                    checked={promptStyle === 'sales'}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStyleChange('sales');
                    }}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 text-cro-blue-600 focus:ring-cro-blue-500 border-cro-plat-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cro-soft-black-900">Sales-focused</div>
                    <div className="text-xs text-cro-soft-black-600">
                      CRO-focused business development prompts with detailed company analysis and strategic positioning
                    </div>
                  </div>
                </label>

                <label
                  className="flex items-start space-x-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStyleChange('none');
                  }}
                >
                  <input
                    type="radio"
                    name="promptStyle"
                    value="none"
                    checked={promptStyle === 'none'}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStyleChange('none');
                    }}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 text-cro-blue-600 focus:ring-cro-blue-500 border-cro-plat-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cro-soft-black-900">Minimal</div>
                    <div className="text-xs text-cro-soft-black-600">
                      Basic prompts for general-purpose responses without specific business context
                    </div>
                  </div>
                </label>

                <label
                  className="flex items-start space-x-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStyleChange('custom');
                  }}
                >
                  <input
                    type="radio"
                    name="promptStyle"
                    value="custom"
                    checked={promptStyle === 'custom'}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStyleChange('custom');
                    }}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 text-cro-blue-600 focus:ring-cro-blue-500 border-cro-plat-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cro-soft-black-900">Custom</div>
                    <div className="text-xs text-cro-soft-black-600">
                      Write your own system and user prompts for complete control over AI behavior
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Prompt Editors */}
            {promptStyle === 'custom' && (
              <div className="space-y-4 border-t border-cro-purple-200 pt-4">
                <div className="flex items-center gap-2 text-sm text-cro-blue-700">
                  <InformationCircleIcon className="h-4 w-4" />
                  <span>Edit the system and user prompts below to customize AI behavior.</span>
                </div>

                {/* Quick Reset Options */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => resetToDefaults('sales')}
                    disabled={disabled}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-cro-blue-100 text-cro-blue-700 rounded-lg hover:bg-cro-blue-200 disabled:opacity-50 transition-colors"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Load Sales Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => resetToDefaults('none')}
                    disabled={disabled}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-cro-purple-100 text-cro-purple-700 rounded-lg hover:bg-cro-purple-200 disabled:opacity-50 transition-colors"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Load Minimal Defaults
                  </button>
                </div>

                {/* System Prompt Editor */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cro-soft-black-700">
                    System Prompt
                    <span className="text-xs text-cro-soft-black-500 ml-2">
                      ({getSystemCharCount()} characters)
                    </span>
                  </label>
                  <textarea
                    value={localSystemPrompt}
                    onChange={(e) => setLocalSystemPrompt(e.target.value)}
                    disabled={disabled}
                    placeholder="Enter system prompt that defines the AI's role and behavior..."
                    className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 disabled:bg-cro-plat-100 disabled:text-cro-soft-black-500 font-mono text-sm"
                    rows={6}
                  />
                </div>

                {/* User Prompt Editor */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cro-soft-black-700">
                    User Prompt
                    <span className="text-xs text-cro-soft-black-500 ml-2">
                      ({getUserCharCount()} characters)
                    </span>
                  </label>
                  <textarea
                    value={localUserPrompt}
                    onChange={(e) => setLocalUserPrompt(e.target.value)}
                    disabled={disabled}
                    placeholder="Enter user prompt that provides specific instructions for the task..."
                    className="w-full px-3 py-2 border border-cro-plat-300 rounded-xl bg-white text-cro-soft-black-700 focus:outline-none focus:ring-2 focus:ring-cro-blue-700 focus:border-cro-blue-700 disabled:bg-cro-plat-100 disabled:text-cro-soft-black-500 font-mono text-sm"
                    rows={4}
                  />
                </div>

                <div className="text-xs text-cro-purple-600 bg-cro-purple-50 p-3 rounded-lg">
                  <strong>Tip:</strong> The system prompt defines the AI's role and context. The user prompt provides specific instructions for the task. Research context will be automatically appended to the user prompt.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}