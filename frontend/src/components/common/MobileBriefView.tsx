import React, { useState } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

interface MeetingContext {
  subject: string;
  description?: string;
  attendeeEmails: string[];
  organizerEmail: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
}

interface EnrichmentSummary {
  hubspotContacts: number;
  pdlEnrichedProfiles: number;
  companyInsights: number;
}

interface BriefData {
  meetingContext: MeetingContext;
  enrichmentSummary: EnrichmentSummary;
  brief: string;
  generatedAt: string;
}

interface MobileBriefViewProps {
  briefData: BriefData;
  onClose?: () => void;
}

export const MobileBriefView: React.FC<MobileBriefViewProps> = ({ 
  briefData, 
  onClose 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview'])
  );
  const [bookmarked, setBookmarked] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getDuration = () => {
    const start = new Date(briefData.meetingContext.startTime);
    const end = new Date(briefData.meetingContext.endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const { date, time } = formatDateTime(briefData.meetingContext.startTime);

  // Parse the AI brief into sections
  const briefSections = React.useMemo(() => {
    const sections: { title: string; content: string; key: string }[] = [];
    const briefText = briefData.brief;
    
    // Split by numbered sections or section headers
    const parts = briefText.split(/(?:\d+\.\s*\*\*|##\s*|\*\*)/);
    
    let currentSection = '';
    let currentContent = '';
    
    for (const part of parts) {
      if (part.trim()) {
        // Check if this looks like a section header
        const headerMatch = part.match(/^([^*\n]+?)(\*\*|\n)/);
        if (headerMatch && part.length < 100) {
          // Save previous section
          if (currentSection && currentContent) {
            sections.push({
              title: currentSection.trim(),
              content: currentContent.trim(),
              key: currentSection.toLowerCase().replace(/\s+/g, '-')
            });
          }
          
          currentSection = headerMatch[1];
          currentContent = part.substring(headerMatch[0].length);
        } else {
          currentContent += part;
        }
      }
    }
    
    // Add the last section
    if (currentSection && currentContent) {
      sections.push({
        title: currentSection.trim(),
        content: currentContent.trim(),
        key: currentSection.toLowerCase().replace(/\s+/g, '-')
      });
    }
    
    // If no sections were found, treat the whole brief as one section
    if (sections.length === 0) {
      sections.push({
        title: 'Meeting Brief',
        content: briefText,
        key: 'overview'
      });
    }
    
    return sections;
  }, [briefData.brief]);

  const shareData = {
    title: briefData.meetingContext.subject,
    text: `Meeting brief for ${briefData.meetingContext.subject}`,
    url: window.location.href,
  };

  const handleShare = async () => {
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('Brief details copied to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {onClose && (
              <button
                onClick={onClose}
                className="text-blue-600 font-medium text-sm"
              >
                ← Back
              </button>
            )}
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <BookmarkIcon 
                  className={`h-5 w-5 ${bookmarked ? 'fill-current text-blue-600' : ''}`} 
                />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Meeting Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {briefData.meetingContext.subject}
          </h1>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span>{date}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <ClockIcon className="h-4 w-4 flex-shrink-0" />
              <span>{time} • {getDuration()}</span>
            </div>
            
            {briefData.meetingContext.location && (
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{briefData.meetingContext.location}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-gray-600">
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <span>{briefData.meetingContext.attendeeEmails.length} attendees</span>
            </div>
          </div>

          {/* Research Summary */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Research Summary</span>
              <span>Generated {new Date(briefData.generatedAt).toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              {briefData.enrichmentSummary.hubspotContacts > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {briefData.enrichmentSummary.hubspotContacts} HubSpot
                  </span>
                </div>
              )}
              
              {briefData.enrichmentSummary.pdlEnrichedProfiles > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {briefData.enrichmentSummary.pdlEnrichedProfiles} LinkedIn
                  </span>
                </div>
              )}
              
              {briefData.enrichmentSummary.companyInsights > 0 && (
                <div className="flex items-center space-x-1">
                  <BuildingOfficeIcon className="h-3 w-3 text-purple-500" />
                  <span className="text-gray-600">
                    {briefData.enrichmentSummary.companyInsights} companies
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Brief Content */}
        {briefSections.map((section) => {
          const isExpanded = expandedSections.has(section.key);
          
          return (
            <div key={section.key} className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full px-4 py-4 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h2>
                
                {isExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    {section.content.split('\n').map((paragraph, idx) => {
                      if (!paragraph.trim()) return null;
                      
                      // Handle bullet points
                      if (paragraph.trim().startsWith('- ')) {
                        return (
                          <div key={idx} className="flex items-start space-x-2 mb-2">
                            <span className="text-blue-500 mt-1.5">•</span>
                            <span>{paragraph.trim().substring(2)}</span>
                          </div>
                        );
                      }
                      
                      // Handle numbered lists
                      if (paragraph.match(/^\d+\./)) {
                        return (
                          <div key={idx} className="mb-2">
                            <span className="font-medium">{paragraph}</span>
                          </div>
                        );
                      }
                      
                      // Regular paragraph
                      return (
                        <p key={idx} className="mb-3">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom spacing for mobile */}
      <div className="h-8"></div>
    </div>
  );
};